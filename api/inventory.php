<?php
function assignments() {
    $result = [];
    foreach (query('SELECT type, ltPerVehicle FROM carType')->fetchAll() as $row) $result[$row['type']] = (float) $row['ltPerVehicle'];
    return $result;
}

function assignedQuantity($type) {
    $values = assignments();
    if (!array_key_exists($type, $values)) throw new InvalidArgumentException('El tipo de vehículo "' . $type . '" no es válido.');
    return $values[$type];
}

function consumeFuel($tank, $quantity) {
    if ((float) $tank['quantity'] < $quantity) throw new InvalidArgumentException('No hay suficiente combustible en el tanque.');
    query('UPDATE station SET quantity = quantity - ? WHERE id = 1', [$quantity]);
}
