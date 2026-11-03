<?php
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/inventory.php';

$action = $_GET['action'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($action) {
        case 'getTank':
        case 'getQuantity':
            authorize(['employee', 'admin']);
            $quantity = (float) station()['quantity'];
            respond(['data' => $action === 'getTank' ? ['quantity' => $quantity] : $quantity]);
        case 'getAssignedLtPerVehicle':
            respond(['data' => assignments()]);
        case 'isSupplied':
            respond(['data' => (float) station()['quantity'] > 1900]);
        default:
            notFound();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = requestData();
    switch ($action) {
        case 'setAssignedLtPerVehicle':
            authorize(['employee', 'admin']);
            $types = ['motorbike', 'truck', 'car'];
            if (count($data) !== 3 || array_diff($types, array_keys($data))) throw new InvalidArgumentException('La asignación debe incluir cada tipo de vehículo.');
            $normalized = [];
            foreach ($types as $type) {
                if (!is_numeric($data[$type]) || !is_finite((float) $data[$type]) || $data[$type] <= 0) throw new InvalidArgumentException('Los litros por vehículo deben ser mayores a 0.');
                $normalized[$type] = (float) $data[$type];
            }
            db()->beginTransaction();
            station(true);
            foreach ($normalized as $type => $quantity) query('UPDATE carType SET ltPerVehicle = ? WHERE type = ?', [$quantity, $type]);
            db()->commit();
            respond(['data' => $normalized]);
        case 'supply':
            authorize(['employee', 'admin']);
            $quantity = positiveQuantity($data['quantity'] ?? null);
            query('UPDATE station SET quantity = ? WHERE id = 1', [$quantity]);
            respond(['data' => $quantity]);
        case 'assignFuel':
        case 'consume':
            authorize(['employee', 'admin']);
            db()->beginTransaction();
            $tank = station(true);
            $quantity = $action === 'assignFuel' ? assignedQuantity($data['type'] ?? '') : positiveQuantity($data['quantity'] ?? null);
            consumeFuel($tank, $quantity);
            db()->commit();
            respond(['data' => $quantity]);
        default:
            notFound();
    }
} else {
    methodNotAllowed();
}
