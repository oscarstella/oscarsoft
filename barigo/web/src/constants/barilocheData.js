// Constantes geográficas, calles y tarifas reales de San Carlos de Bariloche, Río Negro, Argentina

export const BARILOCHE_CENTER = {
  lat: -41.1335,
  lng: -71.3103,
  zoom: 14
};

// Puntos emblemáticos oficiales de Bariloche
export const BARILOCHE_PRESETS = [
  {
    id: 'civico',
    title: 'Centro Cívico Bariloche',
    address: 'San Martín e Independencia, Bariloche Centro',
    location: { lat: -41.1335, lng: -71.3103 },
    icon: 'Landmark',
    popular: true
  },
  {
    id: 'terminal',
    title: 'Terminal de Ómnibus',
    address: 'Av. 12 de Octubre 2400, Bariloche',
    location: { lat: -41.1400, lng: -71.2950 },
    icon: 'Bus',
    popular: true
  },
  {
    id: 'aeropuerto',
    title: 'Aeropuerto Internacional Teniente Candelaria (BRC)',
    address: 'Ruta Provincial 80 s/n, Bariloche',
    location: { lat: -41.1512, lng: -71.1578 },
    icon: 'Plane',
    popular: true
  },
  {
    id: 'catedral',
    title: 'Cerro Catedral (Base)',
    address: 'Av. Exequiel Bustillo Km 8.5 / RP 67, Bariloche',
    location: { lat: -41.1710, lng: -71.4390 },
    icon: 'Mountain',
    popular: true
  },
  {
    id: 'melipal',
    title: 'Av. Bustillo Km 4 (Melipal)',
    address: 'Av. Exequiel Bustillo 4000, Melipal',
    location: { lat: -41.1290, lng: -71.3580 },
    icon: 'MapPin',
    popular: true
  },
  {
    id: 'otto',
    title: 'Teleférico Cerro Otto',
    address: 'Av. De los Pioneros Km 5, Bariloche',
    location: { lat: -41.1432, lng: -71.3489 },
    icon: 'Compass',
    popular: false
  },
  {
    id: 'llaollao',
    title: 'Hotel Llao Llao / Puerto Pañuelo',
    address: 'Av. Exequiel Bustillo Km 25, Circuito Chico',
    location: { lat: -41.0545, lng: -71.5340 },
    icon: 'Hotel',
    popular: false
  },
  {
    id: 'alto',
    title: 'Alto Bariloche (Brown & Onelli)',
    address: 'Clemente Onelli y Almte. Brown, Bariloche',
    location: { lat: -41.1440, lng: -71.3000 },
    icon: 'Store',
    popular: true
  }
];

// Directorio calle por calle de San Carlos de Bariloche
export const BARILOCHE_STREET_DIRECTORY = [
  { name: 'Bartolomé Mitre', zone: 'Centro Comercial, Bariloche', lat: -41.1345, lng: -71.3060 },
  { name: 'Francisco P. Moreno', zone: 'Centro, Bariloche', lat: -41.1355, lng: -71.3075 },
  { name: 'Av. Exequiel Bustillo', zone: 'Corredor Oeste Km 1 a 25, Bariloche', lat: -41.1325, lng: -71.3500 },
  { name: 'Av. De los Pioneros', zone: 'Corredor Sur Km 1 a 9, Bariloche', lat: -41.1400, lng: -71.3400 },
  { name: 'Av. 12 de Octubre', zone: 'Costanera Lago Nahuel Huapi, Bariloche', lat: -41.1360, lng: -71.2950 },
  { name: 'Clemente Onelli', zone: 'Zona Comercial Alto, Bariloche', lat: -41.1440, lng: -71.3000 },
  { name: 'General San Martín', zone: 'Centro Cívico, Bariloche', lat: -41.1355, lng: -71.3120 },
  { name: 'Vicealmirante O’Connor', zone: 'Costanera Centro, Bariloche', lat: -41.1340, lng: -71.3040 },
  { name: 'Ángel Gallardo', zone: 'Centro / Belgrano, Bariloche', lat: -41.1380, lng: -71.3080 },
  { name: 'Fray Luis Belgrano', zone: 'Barrio Belgrano, Bariloche', lat: -41.1390, lng: -71.3130 },
  { name: 'Elflein', zone: 'Centro, Bariloche', lat: -41.1368, lng: -71.3065 },
  { name: '25 de Mayo', zone: 'Barrio Belgrano, Bariloche', lat: -41.1405, lng: -71.3065 },
  { name: 'Villegas', zone: 'Centro, Bariloche', lat: -41.1352, lng: -71.3088 },
  { name: 'Quaglia', zone: 'Centro, Bariloche', lat: -41.1356, lng: -71.3072 },
  { name: 'Rolando', zone: 'Centro, Bariloche', lat: -41.1359, lng: -71.3056 },
  { name: 'Palacios', zone: 'Centro, Bariloche', lat: -41.1362, lng: -71.3040 },
  { name: 'Beschtedt', zone: 'Centro / Alto, Bariloche', lat: -41.1366, lng: -71.3025 },
  { name: 'Otto Goedecke', zone: 'Centro / Belgrano, Bariloche', lat: -41.1370, lng: -71.3010 },
  { name: 'Emilio Frey', zone: 'Centro / Belgrano, Bariloche', lat: -41.1373, lng: -71.2995 },
  { name: 'Tiscornia', zone: 'Centro / Belgrano, Bariloche', lat: -41.1388, lng: -71.3050 },
  { name: 'Albarracín', zone: 'Centro / Belgrano, Bariloche', lat: -41.1398, lng: -71.3040 },
  { name: 'Anasagasti', zone: 'Centro / Alto, Bariloche', lat: -41.1410, lng: -71.3030 },
  { name: 'Pasaje Gutiérrez', zone: 'Barrio Mallín / Alto, Bariloche', lat: -41.1448, lng: -71.3115 },
  { name: 'Diagonal Gutiérrez', zone: 'Alto Bariloche, Bariloche', lat: -41.1460, lng: -71.3100 },
  { name: 'Panchito Moreno', zone: 'El Frutillar / Alto, Bariloche', lat: -41.1480, lng: -71.3000 }
];

// Tarifas base oficiales según normativa local
export const DEFAULT_FARE_SETTINGS = {
  baseFare: 1200,          // Bajada de bandera AR$
  perKmRate: 650,          // Por kilómetro recorrido AR$
  perMinuteRate: 120,      // Por minuto de viaje AR$
  driverPass24hPrice: 4500,// Pase diario 24hs para choferes AR$ (0% comisión)
  minRideFare: 2000,       // Tarifa mínima garantizada AR$
  nightMultiplier: 1.2     // Multiplicador nocturno / alta demanda
};

// Categorías de vehículos disponibles (estilo Uber / Cabify)
export const VEHICLE_CATEGORIES = [
  {
    id: 'classic',
    name: 'BariGo Clásico',
    tagline: 'Viaje ágil y económico',
    seats: 4,
    multiplier: 1.0,
    etaMins: 3,
    icon: 'car',
    description: 'Sedán o hatchback moderno (Onix, Etios, Cronos).',
    badge: 'Más Popular'
  },
  {
    id: 'comfort',
    name: 'BariGo Confort',
    tagline: 'Más espacio y aire acondicionado',
    seats: 4,
    multiplier: 1.25,
    etaMins: 5,
    icon: 'shield-check',
    description: 'Mayor comodidad, baúl amplio y conductores top.',
    badge: 'Premium'
  },
  {
    id: 'suv',
    name: 'BariGo 4x4 / Montaña',
    tagline: 'Tracción especial para Cerro Catedral y nieve',
    seats: 4,
    multiplier: 1.6,
    etaMins: 7,
    icon: 'mountain',
    description: 'Camionetas y SUVs equipadas para senderos y subidas.',
    badge: 'Catedral & Nieve'
  }
];

// Choferes simulados en tiempo real en San Carlos de Bariloche
export const INITIAL_DRIVERS = [
  {
    id: 'drv-carlos',
    name: 'Carlos Nahuel Huapi',
    rating: 4.96,
    tripsCount: 1420,
    phone: '+54 9 294 422-3344',
    vehicleModel: 'Chevrolet Onix Joy',
    vehicleColor: 'Blanco Glaciar',
    vehiclePlate: 'AF 342 BZ',
    category: 'classic',
    status: 'online', // 'online' | 'busy' | 'offline'
    lat: -41.1348,
    lng: -71.3055,
    hasPass24h: true,
    passHoursLeft: 21,
    verified: true,
    todayEarnings: 48500
  },
  {
    id: 'drv-esteban',
    name: 'Esteban San Martín',
    rating: 4.89,
    tripsCount: 890,
    phone: '+54 9 294 455-8899',
    vehicleModel: 'Toyota Etios XLS',
    vehicleColor: 'Gris Plata',
    vehiclePlate: 'AD 129 KL',
    category: 'classic',
    status: 'online',
    lat: -41.1310,
    lng: -71.3280,
    hasPass24h: true,
    passHoursLeft: 18,
    verified: true,
    todayEarnings: 36200
  },
  {
    id: 'drv-matias',
    name: 'Matías Llao Llao',
    rating: 4.93,
    tripsCount: 650,
    phone: '+54 9 294 488-3311',
    vehicleModel: 'Renault Duster 4WD',
    vehicleColor: 'Negro Profundo',
    vehiclePlate: 'AG 512 PQ',
    category: 'suv',
    status: 'online',
    lat: -41.1550,
    lng: -71.3800,
    hasPass24h: true,
    passHoursLeft: 14,
    verified: true,
    todayEarnings: 59000
  },
  {
    id: 'drv-luciana',
    name: 'Luciana Otto',
    rating: 4.98,
    tripsCount: 2100,
    phone: '+54 9 294 411-7722',
    vehicleModel: 'Volkswagen Virtus',
    vehicleColor: 'Azul Noche',
    vehiclePlate: 'AE 678 MN',
    category: 'comfort',
    status: 'busy',
    lat: -41.1380,
    lng: -71.2990,
    hasPass24h: true,
    passHoursLeft: 9,
    verified: true,
    todayEarnings: 72400
  }
];
