USE `sistema-gasolinera`;

INSERT IGNORE INTO station (id, quantity, supplyStart, supplyEnd) VALUES (1, 0, '06:00:00', '18:00:00');

INSERT IGNORE INTO carType (type, ltPerVehicle) VALUES
('motorbike', 5),
('truck', 50),
('car', 25);

INSERT IGNORE INTO color (colorCode, name) VALUES
('000000', 'Negro'),
('FFFFFF', 'Blanco'),
('FF0000', 'Rojo'),
('0000FF', 'Azul'),
('008000', 'Verde'),
('FFFF00', 'Amarillo'),
('FFA500', 'Naranja'),
('800080', 'Morado'),
('FFC0CB', 'Rosa'),
('808080', 'Gris');

INSERT IGNORE INTO user (id, email, password, role) VALUES
('V-1', 'admin@example.com', '$2b$12$twq7yQYmn.7rsMTQK9Fto.bDnxTPReZQ5AjEu2kSbN0NIw.kZsJXS', 'admin'),
('E-1', 'employee@example.com', '$2b$12$Qk0j0ujpBOWc9wtD4UaKSuxJ8AWF7.tgDtQFoV30jMjaS7QQ4ZqFO', 'employee');
