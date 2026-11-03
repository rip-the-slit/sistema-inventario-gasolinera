<?php
function respond($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    exit;
}

set_exception_handler(function ($error) {
    if (isset($GLOBALS['connection']) && $GLOBALS['connection']->inTransaction()) {
        $GLOBALS['connection']->rollBack();
    }
    if ($error instanceof PDOException) {
        error_log($error->getMessage());
        respond(['error' => 'No fue posible completar la operación en la base de datos.'], 500);
    }
    respond(['error' => $error->getMessage()], $error instanceof JsonException ? 400 : 422);
});

function db() {
    if (!isset($GLOBALS['connection'])) {
        $host = getenv('DB_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: '3306';
        $name = getenv('DB_NAME') ?: 'sistema-gasolinera';
        $user = getenv('DB_USER') ?: 'root';
        $password = getenv('DB_PASSWORD') ?: '';
        $GLOBALS['connection'] = new PDO("mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4", $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $GLOBALS['connection'];
}

function query($sql, $values = []) {
    $statement = db()->prepare($sql);
    $statement->execute($values);
    return $statement;
}

function startSession() {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $path = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
    session_set_cookie_params([
        'path' => $path,
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_start();
}

function currentUser() {
    startSession();
    if (empty($_SESSION['userId'])) return null;
    $user = query('SELECT id, email, role FROM user WHERE id = ?', [$_SESSION['userId']])->fetch();
    if (!$user) unset($_SESSION['userId']);
    return $user ?: null;
}

function authorize($roles) {
    $user = currentUser();
    if (!in_array($user['role'] ?? null, $roles, true)) {
        respond(['error' => 'No tienes permiso para realizar esta operación.'], $user ? 403 : 401);
    }
    return $user;
}

function decodeObject($json) {
    $object = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
    if (!is_object($object)) throw new InvalidArgumentException('Los datos deben ser un objeto.');
    return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
}

function requestData() {
    return decodeObject(file_get_contents('php://input') ?: '{}');
}

function notFound() {
    respond(['error' => 'Acción no válida.'], 404);
}

function methodNotAllowed() {
    header('Allow: GET, POST');
    respond(['error' => 'Método no permitido.'], 405);
}

function nonEmpty($value) {
    return is_string($value) && trim($value) !== '';
}

function station($lock = false) {
    $station = query('SELECT * FROM station WHERE id = 1' . ($lock ? ' FOR UPDATE' : ''))->fetch();
    if (!$station) throw new RuntimeException('No existe la estación predeterminada.');
    return $station;
}

function positiveQuantity($quantity) {
    if (!is_numeric($quantity) || !is_finite((float) $quantity) || $quantity <= 0) {
        throw new InvalidArgumentException('La cantidad de combustible es inválida.');
    }
    return (float) $quantity;
}
