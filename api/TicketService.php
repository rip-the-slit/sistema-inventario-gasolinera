<?php
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/inventory.php';

function tickets($filters = []) {
    if (!is_array($filters)) throw new InvalidArgumentException('Los filtros deben ser un objeto.');
    $columns = [
        'id' => 'id',
        'verificationCode' => 'verificationCode',
        'emissionDate' => 'emissionDate',
    ];
    $vehicleColumns = [];
    foreach (['type', 'brand', 'model', 'plateNumber', 'colour'] as $key) {
        $vehicleColumns[$key] = "JSON_UNQUOTE(JSON_EXTRACT(vehicleSnapshot, '$.$key'))";
    }
    $statusColumns = [
        'success' => 'status',
        'type' => $vehicleColumns['type'],
        'quantity' => 'quantity',
        'message' => 'message',
    ];
    $conditions = [];
    $values = [];
    foreach ($filters as $key => $expected) {
        $nested = ($key === 'vehicle' || $key === 'status') && is_array($expected);
        $fields = $nested ? $expected : [$key => $expected];
        $allowed = $nested ? ($key === 'vehicle' ? $vehicleColumns : $statusColumns) : $columns + $vehicleColumns;
        foreach ($fields as $attribute => $value) {
            if (!isset($allowed[$attribute]) || is_array($value) || is_object($value)) {
                $conditions[] = '0 = 1';
                continue;
            }
            if ($nested && $key === 'status' && $attribute !== 'success') {
                $conditions[] = $attribute === 'message' ? 'status = 0' : 'status = 1';
            }
            $column = $allowed[$attribute];
            if ($value === null) {
                $conditions[] = "$column IS NULL";
            } else {
                $conditions[] = is_string($value) ? "BINARY $column = BINARY ?" : "$column = ?";
                $values[] = is_bool($value) ? (int) $value : $value;
            }
        }
    }
    $sql = 'SELECT * FROM ticket';
    if ($conditions) $sql .= ' WHERE ' . implode(' AND ', $conditions);
    $sql .= ' ORDER BY recordId';
    $result = [];
    foreach (query($sql, $values)->fetchAll() as $row) {
        $vehicle = json_decode($row['vehicleSnapshot'], true, 512, JSON_THROW_ON_ERROR);
        $result[] = [
            'id' => (int) $row['id'],
            'verificationCode' => $row['verificationCode'],
            'emissionDate' => $row['emissionDate'],
            'vehicle' => $vehicle,
            'status' => (bool) $row['status'] ? ['success' => true, 'type' => $vehicle['type'], 'quantity' => (float) $row['quantity']] : ['success' => false, 'message' => $row['message']],
        ];
    }
    return $result;
}

function randomAvailable($pool, $taken, $message) {
    $available = array_values(array_diff($pool, $taken));
    if (!$available) throw new InvalidArgumentException($message);
    return $available[random_int(0, count($available) - 1)];
}

function supplySchedule() {
    $row = station();
    return ['start' => substr($row['supplyStart'], 0, 5), 'end' => substr($row['supplyEnd'], 0, 5)];
}

function withinSchedule($station) {
    $now = date('H:i');
    $start = substr($station['supplyStart'], 0, 5);
    $end = substr($station['supplyEnd'], 0, 5);
    return $start < $end ? $now >= $start && $now <= $end : $now >= $start || $now <= $end;
}

function generateTicket($data) {
    $vehicleData = $data['vehicle'] ?? [];
    $type = strtolower($data['vehicleType'] ?? $data['type'] ?? $vehicleData['type'] ?? '');
    $types = ['motorbike' => 'Motorbike', 'truck' => 'Truck', 'car' => 'Car'];
    if (!isset($types[$type])) throw new InvalidArgumentException('El tipo de vehículo "' . $type . '" no es válido.');
    $vehicle = ['type' => $types[$type]];
    foreach (['brand', 'model', 'plateNumber'] as $key) {
        $vehicle[$key] = $data[$key] ?? $vehicleData[$key] ?? '';
        if (!is_string($vehicle[$key])) throw new InvalidArgumentException('Los datos del vehículo son inválidos.');
    }
    $vehicle['colour'] = $data['colour'] ?? $data['color'] ?? $vehicleData['colour'] ?? $vehicleData['color'] ?? '';
    if (!is_string($vehicle['colour'])) throw new InvalidArgumentException('Los datos del vehículo son inválidos.');
    if (!is_string($vehicle['type'])) throw new InvalidArgumentException('Los datos del vehículo son inválidos.');
    if (strlen($vehicle['plateNumber']) > 7 || strlen($vehicle['brand']) > 100 || strlen($vehicle['model']) > 100 || strlen($vehicle['colour']) > 100) {
        throw new InvalidArgumentException('Los datos del vehículo son inválidos.');
    }
    db()->beginTransaction();
    $station = station(true);
    $date = date('D M d Y');
    $all = tickets();
    $daily = array_values(array_filter($all, function ($ticket) use ($date) { return $ticket['emissionDate'] === $date; }));
    $code = (string) randomAvailable(range(100, 999), array_column($all, 'verificationCode'), 'No hay más códigos disponibles.');
    $id = randomAvailable(range(1, 20), array_column($daily, 'id'), 'No hay más turnos disponibles.');
    $status = $data['status'] ?? ['success' => true];
    if (!is_array($status)) throw new InvalidArgumentException('El estatus del ticket es inválido.');
    if (($status['success'] ?? true) !== false) {
        try {
            if ((float) $station['quantity'] <= 1900) throw new InvalidArgumentException('La estación no dispone del nivel mínimo de combustible.');
            if (!withinSchedule($station)) throw new InvalidArgumentException('La estación se encuentra fuera del horario de suministro configurado.');
            foreach ($daily as $existing) {
                if ($existing['vehicle']['plateNumber'] === $vehicle['plateNumber'] && $existing['status']['success']) {
                    throw new InvalidArgumentException('Ya se le fué asignado combustible a este número de placa.');
                }
            }
            $quantity = assignedQuantity($type);
            consumeFuel($station, $quantity);
            $status = ['success' => true, 'type' => $vehicle['type'], 'quantity' => $quantity];
        } catch (InvalidArgumentException $error) {
            $status = ['success' => false, 'message' => $error->getMessage()];
        }
    } else {
        $status = ['success' => false, 'message' => $status['message'] ?? 'Se agotó el tiempo para realizar la operación'];
    }
    query('INSERT INTO car (plateNumber, type, brand, model, colour) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE type = VALUES(type), brand = VALUES(brand), model = VALUES(model), colour = VALUES(colour)', [$vehicle['plateNumber'], $type, $vehicle['brand'], $vehicle['model'], $vehicle['colour']]);
    query('INSERT INTO ticket (id, verificationCode, emissionDate, status, message, quantity, plateNumber, vehicleSnapshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$id, $code, $date, $status['success'] ? 1 : 0, $status['message'] ?? null, $status['quantity'] ?? 0, $vehicle['plateNumber'], json_encode($vehicle, JSON_THROW_ON_ERROR)]);
    db()->commit();
    return ['emissionDate' => $date, 'id' => $id, 'vehicle' => $vehicle, 'status' => $status, 'verificationCode' => $code];
}

$action = $_GET['action'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($action) {
        case 'getTickets':
            $filters = decodeObject($_GET['filters'] ?? '{}');
            respond(['data' => tickets($filters)]);
        case 'getSupplySchedule':
            respond(['data' => supplySchedule()]);
        default:
            notFound();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = requestData();
    switch ($action) {
        case 'generateTicket':
            respond(['data' => generateTicket($data)]);
        case 'setSupplySchedule':
            authorize(['employee', 'admin']);
            $start = $data['start'] ?? null;
            $end = $data['end'] ?? null;
            if (!is_string($start) || !is_string($end) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $start) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $end) || $start === $end) {
                throw new InvalidArgumentException('El horario debe tener una hora de inicio y fin diferentes.');
            }
            query('UPDATE station SET supplyStart = ?, supplyEnd = ? WHERE id = 1', [$start, $end]);
            respond(['data' => ['start' => $start, 'end' => $end]]);
        default:
            notFound();
    }
} else {
    methodNotAllowed();
}
