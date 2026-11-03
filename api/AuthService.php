<?php
require_once __DIR__ . '/utils.php';

function validateOTP($otp, $email) {
    if (!nonEmpty($otp)) throw new InvalidArgumentException('Ingresa un código OTP válido.');
    foreach ($_SESSION['otps'] ?? [] as $entry) {
        if ($entry['otp'] === $otp && $entry['email'] === $email && time() - $entry['createdAt'] < 600) return true;
    }
    throw new InvalidArgumentException('El código OTP no es válido o ha expirado.');
}

$action = $_GET['action'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($action) {
        case 'getCurrentUser':
            respond(['data' => currentUser()]);
        case 'getUsers':
            authorize(['admin']);
            respond(['data' => query('SELECT id, email, role FROM user ORDER BY id')->fetchAll()]);
        default:
            notFound();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = requestData();
    switch ($action) {
        case 'login':
            startSession();
            foreach (['id', 'email', 'password'] as $key) {
                if (!nonEmpty($data[$key] ?? null)) throw new InvalidArgumentException('Ingresa un ID, correo y contraseña válidos.');
            }
            $user = query('SELECT * FROM user WHERE id = ? AND email = ?', [$data['id'], $data['email']])->fetch();
            if (!$user || !password_verify($data['password'], $user['password'])) {
                respond(['error' => 'Las credenciales no son válidas.'], 401);
            }
            session_regenerate_id(true);
            $_SESSION = ['userId' => $user['id']];
            respond(['data' => currentUser()]);
        case 'logout':
            startSession();
            $_SESSION = [];
            $cookie = session_get_cookie_params();
            setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $cookie['path'], 'secure' => $cookie['secure'], 'httponly' => true, 'samesite' => 'Lax']);
            session_destroy();
            respond(['data' => null]);
        case 'register':
            authorize(['admin']);
            foreach (['id', 'email', 'password'] as $key) {
                if (!nonEmpty($data[$key] ?? null)) throw new InvalidArgumentException('ID, correo, contraseña, y rol válidos son requeridos.');
            }
            if (!preg_match('/^[VE]-(?:[1-9]\d{0,7}|100000000)$/', $data['id']) || !in_array($data['role'] ?? '', ['employee', 'admin'], true)) {
                throw new InvalidArgumentException('ID, correo, contraseña, y rol válidos son requeridos.');
            }
            if (query('SELECT id FROM user WHERE id = ? OR email = ?', [$data['id'], $data['email']])->fetch()) {
                throw new InvalidArgumentException('Un usuario con el mismo ID o correo ya existe.');
            }
            validateOTP($data['otp'] ?? null, $data['email']);
            query('INSERT INTO user (id, email, password, role) VALUES (?, ?, ?, ?)', [$data['id'], $data['email'], password_hash($data['password'], PASSWORD_DEFAULT), $data['role']]);
            respond(['data' => ['id' => $data['id'], 'email' => $data['email'], 'role' => $data['role']]]);
        case 'editUser':
            authorize(['admin']);
            if (!nonEmpty($data['id'] ?? null)) throw new InvalidArgumentException('La ID es requerida.');
            $user = query('SELECT * FROM user WHERE id = ?', [$data['id']])->fetch();
            if (!$user) throw new InvalidArgumentException('No existe un usuario con el ID especificado.');
            foreach (['email', 'password', 'role'] as $key) {
                if (!nonEmpty($data[$key] ?? null)) continue;
                if ($key === 'role' && !in_array($data[$key], ['employee', 'admin'], true)) continue;
                $user[$key] = $key === 'password' ? password_hash($data[$key], PASSWORD_DEFAULT) : $data[$key];
            }
            query('UPDATE user SET email = ?, password = ?, role = ? WHERE id = ?', [$user['email'], $user['password'], $user['role'], $user['id']]);
            respond(['data' => null]);
        case 'deleteUser':
            $current = authorize(['admin']);
            $id = $data['id'] ?? null;
            if (!nonEmpty($id)) throw new InvalidArgumentException('La ID es requerida.');
            if ($current['id'] === $id) throw new InvalidArgumentException('No puedes eliminar tu propio usuario mientras tienes la sesión iniciada.');
            if (!query('DELETE FROM user WHERE id = ?', [$id])->rowCount()) throw new InvalidArgumentException('No existe un usuario con el ID especificado.');
            respond(['data' => null]);
        case 'generateOTP':
            authorize(['admin']);
            if (!nonEmpty($data['email'] ?? null)) throw new InvalidArgumentException('Ingresa un correo válido.');
            $otp = random_int(100000, 999999);
            $_SESSION['otps'] = array_values(array_filter($_SESSION['otps'] ?? [], function ($entry) { return time() - $entry['createdAt'] < 600; }));
            $_SESSION['otps'][] = ['email' => $data['email'], 'otp' => (string) $otp, 'createdAt' => time()];
            respond(['data' => $otp]);
        case 'validateOTP':
            authorize(['admin']);
            respond(['data' => validateOTP($data['otp'] ?? null, $data['email'] ?? null)]);
        default:
            notFound();
    }
} else {
    methodNotAllowed();
}
