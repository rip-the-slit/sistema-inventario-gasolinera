CREATE DATABASE IF NOT EXISTS `sistema-gasolinera` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sistema-gasolinera`;

CREATE TABLE IF NOT EXISTS user(
    id VARCHAR(20) PRIMARY KEY, 
    email VARCHAR(100),
    password VARCHAR(255),
    role ENUM('admin', 'employee'),
    fullName VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carType(
    type VARCHAR(20) PRIMARY KEY,
    ltPerVehicle DOUBLE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS color(
    colorCode VARCHAR(100) PRIMARY KEY,
    name VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS car(
    plateNumber VARCHAR(7) PRIMARY KEY,
    type VARCHAR(20),
    brand VARCHAR(100),
    model VARCHAR(100),
    colour VARCHAR(100),
    CONSTRAINT fkCarType FOREIGN KEY (type) REFERENCES carType(type),
    CONSTRAINT fkCarColor FOREIGN KEY (colour) REFERENCES color(colorCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket(
    recordId INT AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    verificationCode VARCHAR(100) NOT NULL,
    emissionDate VARCHAR(100) NOT NULL,
    status BOOLEAN,
    message VARCHAR(200),
    quantity DOUBLE DEFAULT 0,
    plateNumber VARCHAR(7),
    vehicleSnapshot JSON NOT NULL,
    CONSTRAINT uniqueTicketCode UNIQUE (verificationCode),
    CONSTRAINT uniqueDailyTurn UNIQUE (emissionDate, id),
    CONSTRAINT fkCar FOREIGN KEY (plateNumber) REFERENCES car(plateNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS station(
    id INT PRIMARY KEY,
    quantity DOUBLE NOT NULL DEFAULT 0,
    supplyStart TIME NOT NULL DEFAULT '06:00:00',
    supplyEnd TIME NOT NULL DEFAULT '18:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
