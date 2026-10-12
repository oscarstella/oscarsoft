CREATE DATABASE IF NOT EXISTS barigo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barigo_db;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(128) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  fullName VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  role ENUM('admin', 'driver', 'passenger') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_profiles (
  userId VARCHAR(64) PRIMARY KEY,
  carModel VARCHAR(128) NOT NULL,
  carPlate VARCHAR(32) NOT NULL,
  carColor VARCHAR(64) NOT NULL,
  hasSnowChains BOOLEAN DEFAULT TRUE,
  isVerified BOOLEAN DEFAULT TRUE,
  rating FLOAT DEFAULT 4.95,
  totalTrips INT DEFAULT 0,
  isOnline BOOLEAN DEFAULT TRUE,
  lat DOUBLE DEFAULT -41.1335,
  lng DOUBLE DEFAULT -71.3103,
  lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS driver_passes (
  id VARCHAR(64) PRIMARY KEY,
  driverId VARCHAR(64) NOT NULL,
  passType VARCHAR(32) DEFAULT 'daily_24h',
  price DECIMAL(10,2) DEFAULT 4500.00,
  activatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME NOT NULL,
  status ENUM('active', 'expired') DEFAULT 'active',
  FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rides (
  id VARCHAR(64) PRIMARY KEY,
  passengerId VARCHAR(64) NOT NULL,
  driverId VARCHAR(64) NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  originLat DOUBLE NOT NULL,
  originLng DOUBLE NOT NULL,
  destLat DOUBLE NOT NULL,
  destLng DOUBLE NOT NULL,
  distanceKm FLOAT NOT NULL,
  durationMin INT NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  category VARCHAR(64) DEFAULT 'clasico',
  paymentMethod VARCHAR(64) DEFAULT 'Efectivo',
  status ENUM('searching', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled') DEFAULT 'searching',
  routePoints JSON NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME NULL
);

-- Seed accounts (password: 123456)
INSERT INTO users (id, email, password_hash, fullName, phone, role)
VALUES 
('usr-admin-1', 'oscarnicolasstella@gmail.com', '$2a$10$3/JkPF84a7i10b2zdKbZ4ONMH4phxnVlARLALpyWkx1VSAVvYGMpe', 'Oscar Nicolás Stella (Admin)', '+5492944000001', 'admin'),
('usr-driver-1', 'chofer1@barigo.app', '$2a$10$3/JkPF84a7i10b2zdKbZ4ONMH4phxnVlARLALpyWkx1VSAVvYGMpe', 'Carlos Nahuel Huapi (Chofer 1)', '+5492944123456', 'driver'),
('usr-passenger-1', 'pasajero1@barigo.app', '$2a$10$3/JkPF84a7i10b2zdKbZ4ONMH4phxnVlARLALpyWkx1VSAVvYGMpe', 'Martina Pasajera 1', '+5492944987654', 'passenger')
ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);

INSERT INTO driver_profiles (userId, carModel, carPlate, carColor, hasSnowChains, isVerified, rating, totalTrips, isOnline, lat, lng)
VALUES
('usr-driver-1', 'Chevrolet Onix Joy', 'AF 342 BZ', 'Blanco Glaciar', 1, 1, 4.96, 1420, 1, -41.1348, -71.3055)
ON DUPLICATE KEY UPDATE isOnline=1;

INSERT INTO driver_passes (id, driverId, passType, price, activatedAt, expiresAt, status)
VALUES
('pass-1', 'usr-driver-1', 'daily_24h', 4500.00, NOW(), DATE_ADD(NOW(), INTERVAL 21 HOUR), 'active')
ON DUPLICATE KEY UPDATE status='active';
