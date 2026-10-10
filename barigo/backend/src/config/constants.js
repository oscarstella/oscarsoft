require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5055,
  JWT_SECRET: process.env.JWT_SECRET || 'barigo_super_secret_jwt_key_2026',
  DEFAULT_CENTER: {
    lat: -41.1335,
    lng: -71.3103,
    city: 'San Carlos de Bariloche',
    province: 'Río Negro, Argentina'
  },
  DEFAULT_FARES: {
    baseFare: 1200,          // Bajada de bandera ARS
    perKmRate: 650,          // Precio por kilómetro ARS
    perMinuteRate: 120,      // Precio por minuto de espera/viaje
    driverPass24hPrice: 4500,// Pase 24hs para choferes
    minRideFare: 2000,       // Tarifa mínima de viaje
    nightMultiplier: 1.20,   // Recargo nocturno (22:00 a 06:00)
    currency: 'ARS',
    symbol: '$'
  }
};
