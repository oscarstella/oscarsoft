const db = require('../models/db');

// Formula de Haversine para distancia en kilómetros
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2));
}

// Estimación de tiempo en minutos (promedio 32 km/h para Bariloche con desniveles)
function estimateDurationMinutes(distanceKm) {
  const avgSpeedKmH = 32;
  const hours = distanceKm / avgSpeedKmH;
  const minutes = Math.ceil(hours * 60) + 3; // +3 minutos de maniobra/semáforos
  return Math.max(minutes, 5);
}

// Cálculo de tarifa
function calculateFare(distanceKm, durationMinutes) {
  const settings = db.getSettings();
  
  // Recargo nocturno (entre 22:00 y 06:00 hs)
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 22 || currentHour < 6;
  const multiplier = isNight ? (settings.nightMultiplier || 1.2) : 1.0;

  // Fórmula
  const rawFare = (settings.baseFare + (distanceKm * settings.perKmRate) + (durationMinutes * settings.perMinuteRate)) * multiplier;
  const finalFare = Math.max(rawFare, settings.minRideFare);

  return {
    baseFare: settings.baseFare,
    distanceKm,
    durationMinutes,
    perKmRate: settings.perKmRate,
    isNight,
    multiplier,
    totalFare: Math.round(finalFare / 50) * 50 // Redondeo a múltiplos de $50 ARS
  };
}

module.exports = {
  calculateDistanceKm,
  estimateDurationMinutes,
  calculateFare
};
