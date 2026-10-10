const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DEFAULT_FARES, DEFAULT_CENTER } = require('../config/constants');

const DB_FILE = path.join(__dirname, '../../data/barigo_db.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-Memory store initialized from disk or default seed
let state = {
  users: [],
  driverProfiles: {},
  driverPasses: [],
  driverLocations: {},
  rides: [],
  reviews: [],
  systemSettings: { ...DEFAULT_FARES }
};

// Load saved data if present
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    state = JSON.parse(raw);
    console.log(`[BariGo DB] Datos cargados exitosamente (${state.users.length} usuarios, ${state.rides.length} viajes)`);
  } catch (err) {
    console.error('[BariGo DB] Error al leer archivo de datos, usando seed inicial:', err.message);
  }
}

// Helper to persist state to disk
function save() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BariGo DB] Error al guardar datos:', err.message);
  }
}

// Initial Seed with Bariloche test accounts if empty
if (state.users.length === 0) {
  console.log('[BariGo DB] Inicializando datos demo para Bariloche...');
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('barigo123', salt);

  // 1. Admin
  const admin = {
    id: 'usr-admin-1',
    email: 'admin@barigo.app',
    password: passwordHash,
    fullName: 'Administrador BariGo',
    phone: '+5492944001122',
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  // 2. Pasajero Demo
  const passenger = {
    id: 'usr-pasajero-1',
    email: 'pasajero@barigo.app',
    password: passwordHash,
    fullName: 'Martina Bariloche',
    phone: '+5492944112233',
    role: 'passenger',
    createdAt: new Date().toISOString()
  };

  // 3. Chofer 1 (Centro / Mitre)
  const driver1 = {
    id: 'usr-chofer-1',
    email: 'chofer1@barigo.app',
    password: passwordHash,
    fullName: 'Carlos Nahuel Huapi',
    phone: '+5492944223344',
    role: 'driver',
    createdAt: new Date().toISOString()
  };

  // 4. Chofer 2 (Bustillo Km 4)
  const driver2 = {
    id: 'usr-chofer-2',
    email: 'chofer2@barigo.app',
    password: passwordHash,
    fullName: 'Esteban Melipal',
    phone: '+5492944334455',
    role: 'driver',
    createdAt: new Date().toISOString()
  };

  state.users.push(admin, passenger, driver1, driver2);

  // Driver profiles (adaptado a normativa de Bariloche con cadenas de nieve)
  state.driverProfiles[driver1.id] = {
    id: driver1.id,
    vehicleMake: 'Chevrolet',
    vehicleModel: 'Onix Joy',
    vehicleYear: 2021,
    vehiclePlate: 'AF 342 BZ',
    vehicleColor: 'Blanco',
    doorsCount: 4,
    hasAirConditioning: true,
    hasSnowChains: true,
    hasFireExtinguisher: true,
    verificationStatus: 'approved',
    ratingAvg: 4.95,
    totalTrips: 184
  };

  state.driverProfiles[driver2.id] = {
    id: driver2.id,
    vehicleMake: 'Toyota',
    vehicleModel: 'Etios Sedan',
    vehicleYear: 2022,
    vehiclePlate: 'AG 881 KP',
    vehicleColor: 'Gris Plata',
    doorsCount: 4,
    hasAirConditioning: true,
    hasSnowChains: true,
    hasFireExtinguisher: true,
    verificationStatus: 'approved',
    ratingAvg: 4.88,
    totalTrips: 92
  };

  // Pases de 24hs activos para choferes
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  state.driverPasses.push(
    {
      id: 'pass-1',
      driverId: driver1.id,
      amountPaid: 4500,
      startedAt: now.toISOString(),
      expiresAt: tomorrow.toISOString(),
      paymentStatus: 'approved',
      paymentMethod: 'mercadopago'
    },
    {
      id: 'pass-2',
      driverId: driver2.id,
      amountPaid: 4500,
      startedAt: now.toISOString(),
      expiresAt: tomorrow.toISOString(),
      paymentStatus: 'approved',
      paymentMethod: 'mercadopago'
    }
  );

  // GPS en tiempo real inicial en Bariloche
  state.driverLocations[driver1.id] = {
    driverId: driver1.id,
    lat: -41.1350,
    lng: -71.3050,
    heading: 90,
    speed: 25,
    isOnline: true,
    isBusy: false,
    lastUpdated: now.toISOString()
  };

  state.driverLocations[driver2.id] = {
    driverId: driver2.id,
    lat: -41.1290,
    lng: -71.3580, // Av. Bustillo Km 4
    heading: 270,
    speed: 40,
    isOnline: true,
    isBusy: false,
    lastUpdated: now.toISOString()
  };

  save();
}

// Database helper functions
const db = {
  // Users
  findUserByEmail: (email) => state.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  findUserById: (id) => state.users.find(u => u.id === id),
  createUser: (userData) => {
    state.users.push(userData);
    save();
    return userData;
  },
  updateUser: (id, updates) => {
    const user = state.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates);
      save();
    }
    return user;
  },
  getAllUsers: () => state.users,

  // Driver profiles
  getDriverProfile: (driverId) => state.driverProfiles[driverId] || null,
  setDriverProfile: (driverId, profileData) => {
    state.driverProfiles[driverId] = {
      ...(state.driverProfiles[driverId] || {}),
      ...profileData,
      id: driverId
    };
    save();
    return state.driverProfiles[driverId];
  },
  getAllDriverProfiles: () => Object.values(state.driverProfiles),

  // Driver Passes (24h)
  hasActivePass: (driverId) => {
    const now = new Date();
    return state.driverPasses.some(p => 
      p.driverId === driverId && 
      p.paymentStatus === 'approved' && 
      new Date(p.expiresAt) > now
    );
  },
  getActivePass: (driverId) => {
    const now = new Date();
    return state.driverPasses
      .filter(p => p.driverId === driverId && p.paymentStatus === 'approved' && new Date(p.expiresAt) > now)
      .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0] || null;
  },
  createPass: (passData) => {
    state.driverPasses.push(passData);
    save();
    return passData;
  },

  // Driver Locations (Realtime GPS)
  updateDriverLocation: (driverId, { lat, lng, heading, speed, isOnline, isBusy }) => {
    const existing = state.driverLocations[driverId] || {};
    state.driverLocations[driverId] = {
      ...existing,
      driverId,
      lat: lat !== undefined ? lat : existing.lat,
      lng: lng !== undefined ? lng : existing.lng,
      heading: heading !== undefined ? heading : existing.heading || 0,
      speed: speed !== undefined ? speed : existing.speed || 0,
      isOnline: isOnline !== undefined ? isOnline : existing.isOnline || false,
      isBusy: isBusy !== undefined ? isBusy : existing.isBusy || false,
      lastUpdated: new Date().toISOString()
    };
    save();
    return state.driverLocations[driverId];
  },
  getDriverLocation: (driverId) => state.driverLocations[driverId] || null,
  getOnlineDrivers: () => {
    return Object.values(state.driverLocations).filter(loc => loc.isOnline && !loc.isBusy);
  },

  // Rides
  createRide: (rideData) => {
    state.rides.push(rideData);
    save();
    return rideData;
  },
  getRideById: (id) => state.rides.find(r => r.id === id),
  updateRide: (id, updates) => {
    const ride = state.rides.find(r => r.id === id);
    if (ride) {
      Object.assign(ride, updates);
      save();
    }
    return ride;
  },
  getRidesByPassenger: (passengerId) => state.rides.filter(r => r.passengerId === passengerId),
  getRidesByDriver: (driverId) => state.rides.filter(r => r.driverId === driverId),
  getAllRides: () => state.rides,

  // Settings
  getSettings: () => state.systemSettings,
  updateSettings: (newSettings) => {
    state.systemSettings = { ...state.systemSettings, ...newSettings };
    save();
    return state.systemSettings;
  }
};

module.exports = db;
