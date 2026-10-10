-- ============================================================
-- BariGo - Database Schema para PostgreSQL Propio en VPS
-- (Sin dependencias de Supabase ni Firebase)
-- ============================================================

-- 1. Habilitar extensión UUID y PostGIS (si está disponible)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE USUARIOS / PERFILES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'passenger', -- 'passenger', 'driver', 'admin'
    avatar_url TEXT,
    push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PERFIL DE CHOFER Y VEHÍCULO (NORMATIVA BARILOCHE)
CREATE TABLE IF NOT EXISTS driver_profiles (
    id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_make VARCHAR(80) NOT NULL,
    vehicle_model VARCHAR(80) NOT NULL,
    vehicle_year INT NOT NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_color VARCHAR(50) NOT NULL,
    doors_count INT NOT NULL DEFAULT 4,
    has_air_conditioning BOOLEAN NOT NULL DEFAULT TRUE,
    has_snow_chains BOOLEAN NOT NULL DEFAULT TRUE, -- Cadenas de nieve obligatorias en invierno
    has_fire_extinguisher BOOLEAN NOT NULL DEFAULT TRUE,
    driver_license_number VARCHAR(50),
    driver_license_expires_at DATE,
    rto_number VARCHAR(50),
    rto_expires_at DATE,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending_approval', -- 'pending_approval', 'approved', 'rejected', 'suspended'
    rejection_reason TEXT,
    rating_avg NUMERIC(3, 2) DEFAULT 5.00,
    total_trips INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PASES DE 24 HORAS PARA CHOFERES (SISTEMA DE MONETIZACIÓN)
CREATE TABLE IF NOT EXISTS driver_passes (
    id VARCHAR(64) PRIMARY KEY,
    driver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 4500.00,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'mercadopago',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'approved',
    payment_reference VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_passes_active ON driver_passes (driver_id, expires_at);

-- 5. CONFIGURACIÓN DEL SISTEMA Y TARIFAS (BARILOCHE)
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    base_fare NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,        -- Bajada de bandera
    per_km_rate NUMERIC(10, 2) NOT NULL DEFAULT 650.00,        -- Tarifa por kilómetro
    per_minute_rate NUMERIC(10, 2) NOT NULL DEFAULT 120.00,    -- Tarifa por minuto
    driver_pass_24h_price NUMERIC(10, 2) NOT NULL DEFAULT 4500.00, -- Pase de chofer
    min_ride_fare NUMERIC(10, 2) NOT NULL DEFAULT 2000.00,     -- Tarifa mínima
    night_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.20,      -- Recargo nocturno (22:00 a 06:00)
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '$',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'ARS',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_settings (id, base_fare, per_km_rate, per_minute_rate, driver_pass_24h_price, min_ride_fare, night_multiplier)
VALUES (1, 1200.00, 650.00, 120.00, 4500.00, 2000.00, 1.20)
ON CONFLICT (id) DO NOTHING;

-- 6. POSICIONAMIENTO GPS EN TIEMPO REAL
CREATE TABLE IF NOT EXISTS driver_locations (
    driver_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0.0,
    speed DOUBLE PRECISION DEFAULT 0.0,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_busy BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. VIAJES
CREATE TABLE IF NOT EXISTS rides (
    id VARCHAR(64) PRIMARY KEY,
    passenger_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'requested', -- 'requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled'
    
    -- Origen y Destino
    origin_address TEXT NOT NULL,
    origin_latitude DOUBLE PRECISION NOT NULL,
    origin_longitude DOUBLE PRECISION NOT NULL,
    destination_address TEXT NOT NULL,
    destination_latitude DOUBLE PRECISION NOT NULL,
    destination_longitude DOUBLE PRECISION NOT NULL,
    
    -- Métricas y Finanzas
    estimated_distance_km NUMERIC(6, 2) NOT NULL,
    estimated_duration_mins INT NOT NULL,
    estimated_fare NUMERIC(10, 2) NOT NULL,
    final_fare NUMERIC(10, 2),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    
    -- Tiempos
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_rides_status ON rides (status);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides (passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides (driver_id);
