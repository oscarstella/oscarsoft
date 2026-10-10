-- ============================================================
-- BariGo - Database Schema & Realtime Setup for Supabase
-- ============================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE driver_status AS ENUM ('pending_approval', 'approved', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ride_status AS ENUM ('requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pass_payment_status AS ENUM ('pending', 'approved', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'passenger',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DRIVER DETAILS & VEHICLE INFO (ADAPTADO A NORMATIVA DE BARILOCHE)
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_make TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year INT NOT NULL, -- Antigüedad máxima 10 años (Bariloche)
    vehicle_plate TEXT NOT NULL,
    vehicle_color TEXT NOT NULL,
    doors_count INT NOT NULL DEFAULT 4, -- Mínimo 4 puertas
    has_air_conditioning BOOLEAN NOT NULL DEFAULT TRUE, -- Climatización obligatoria
    has_snow_chains BOOLEAN NOT NULL DEFAULT TRUE, -- Cadenas para nieve/hielo (temporada invernal)
    has_fire_extinguisher BOOLEAN NOT NULL DEFAULT TRUE, -- Matafuego reglamentario al día
    driver_license_number TEXT,
    driver_license_category TEXT DEFAULT 'D1', -- Profesional habilitante
    driver_license_expires_at DATE,
    rto_number TEXT, -- Revisión Técnica Obligatoria (RTO / VTV Río Negro)
    rto_expires_at DATE,
    insurance_company TEXT,
    insurance_policy_number TEXT,
    insurance_expires_at DATE,
    verification_status driver_status NOT NULL DEFAULT 'pending_approval',
    rejection_reason TEXT,
    rating_avg NUMERIC(3, 2) DEFAULT 5.00,
    total_trips INT DEFAULT 0,
    is_test_account BOOLEAN NOT NULL DEFAULT FALSE, -- Identificador de chofer de prueba
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.1 CUENTAS Y VEHÍCULOS DE PRUEBA (SANDBOX / ADMIN)
CREATE TABLE IF NOT EXISTS public.test_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_plain TEXT NOT NULL, -- Para consulta y visualización en el panel admin
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'driver',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INT,
    vehicle_plate TEXT,
    vehicle_color TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 24-HOUR DRIVER PASSES (SISTEMA DE MONETIZACIÓN)
CREATE TABLE IF NOT EXISTS public.driver_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    payment_method TEXT NOT NULL DEFAULT 'mercadopago',
    payment_status pass_payment_status NOT NULL DEFAULT 'approved',
    payment_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast check on valid active pass
CREATE INDEX IF NOT EXISTS idx_driver_passes_active ON public.driver_passes (driver_id, expires_at);

-- 5. FARE SETTINGS (CONFIGURACIÓN DE TARIFAS Y CONDICIONES POR EL ADMIN)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    base_fare NUMERIC(10, 2) NOT NULL DEFAULT 1200.00, -- Bajada de bandera
    per_km_rate NUMERIC(10, 2) NOT NULL DEFAULT 650.00,  -- Precio por km
    per_minute_rate NUMERIC(10, 2) NOT NULL DEFAULT 120.00, -- Precio por minuto
    driver_pass_24h_price NUMERIC(10, 2) NOT NULL DEFAULT 4500.00, -- Pase chofer 24hs
    min_ride_fare NUMERIC(10, 2) NOT NULL DEFAULT 2000.00, -- Tarifa mínima
    night_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.20,  -- Recargo nocturno (22:00 a 06:00)
    currency_symbol TEXT NOT NULL DEFAULT '$',
    currency_code TEXT NOT NULL DEFAULT 'ARS',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure default settings
INSERT INTO public.system_settings (id, base_fare, per_km_rate, per_minute_rate, driver_pass_24h_price, min_ride_fare, night_multiplier)
VALUES (1, 1200.00, 650.00, 120.00, 4500.00, 2000.00, 1.20)
ON CONFLICT (id) DO NOTHING;

-- 6. DRIVER LIVE LOCATIONS & ONLINE STATUS (REALTIME GPS TRACKING)
CREATE TABLE IF NOT EXISTS public.driver_locations (
    driver_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0.0,
    speed DOUBLE PRECISION DEFAULT 0.0,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_busy BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. RIDES (SOLICITUDES Y VIAJES)
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status ride_status NOT NULL DEFAULT 'requested',
    
    -- Origin
    origin_address TEXT NOT NULL,
    origin_latitude DOUBLE PRECISION NOT NULL,
    origin_longitude DOUBLE PRECISION NOT NULL,
    
    -- Destination
    destination_address TEXT NOT NULL,
    destination_latitude DOUBLE PRECISION NOT NULL,
    destination_longitude DOUBLE PRECISION NOT NULL,
    
    -- Financials & Estimates
    estimated_distance_km NUMERIC(6, 2) NOT NULL,
    estimated_duration_mins INT NOT NULL,
    estimated_fare NUMERIC(10, 2) NOT NULL,
    final_fare NUMERIC(10, 2),
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'transfer', 'card'
    
    -- Timestamps
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

-- 8. REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS public.ride_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_driver_pass_active(p_driver_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.driver_passes
        WHERE driver_id = p_driver_id
          AND payment_status = 'approved'
          AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
