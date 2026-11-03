<?php
require_once __DIR__ . '/utils.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($_GET['action'] ?? '') {
        case 'getCredentials':
            authorize(['admin']);
            $publicKey = getenv('EMAILJS_PUBLIC_KEY');
            if (!$publicKey) throw new RuntimeException('El servicio de correo no está disponible.');
            respond(['data' => ['publicKey' => $publicKey, 'serviceId' => getenv('EMAILJS_SERVICEID') ?: 'default_service']]);
        default:
            notFound();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    switch ($_GET['action'] ?? '') {
        default:
            notFound();
    }
} else {
    methodNotAllowed();
}
