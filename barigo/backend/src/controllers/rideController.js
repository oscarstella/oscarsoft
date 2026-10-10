const db = require('../models/db');
const { calculateDistanceKm, estimateDurationMinutes, calculateFare } = require('../services/fareService');
const { sendExpoPushNotification } = require('../services/notificationService');

// Cotizar viaje
exports.estimateFare = (req, res) => {
  const { originLat, originLng, destinationLat, destinationLng } = req.body;

  if (!originLat || !originLng || !destinationLat || !destinationLng) {
    return res.status(400).json({ error: 'Coordenadas de origen y destino son requeridas' });
  }

  const distanceKm = calculateDistanceKm(
    Number(originLat),
    Number(originLng),
    Number(destinationLat),
    Number(destinationLng)
  );

  const durationMinutes = estimateDurationMinutes(distanceKm);
  const fare = calculateFare(distanceKm, durationMinutes);

  return res.json({
    distanceKm,
    durationMinutes,
    fare
  });
};

// Solicitar viaje
exports.requestRide = (req, res) => {
  const {
    originAddress,
    originLat,
    originLng,
    destinationAddress,
    destinationLat,
    destinationLng,
    paymentMethod
  } = req.body;

  if (!originAddress || !originLat || !originLng || !destinationAddress || !destinationLat || !destinationLng) {
    return res.status(400).json({ error: 'Datos de viaje incompletos' });
  }

  const distanceKm = calculateDistanceKm(
    Number(originLat),
    Number(originLng),
    Number(destinationLat),
    Number(destinationLng)
  );
  const durationMinutes = estimateDurationMinutes(distanceKm);
  const fareInfo = calculateFare(distanceKm, durationMinutes);

  const newRide = {
    id: 'ride-' + Date.now(),
    passengerId: req.user.id,
    driverId: null,
    status: 'requested',
    originAddress,
    originLat: Number(originLat),
    originLng: Number(originLng),
    destinationAddress,
    destinationLat: Number(destinationLat),
    destinationLng: Number(destinationLng),
    estimatedDistanceKm: distanceKm,
    estimatedDurationMins: durationMinutes,
    estimatedFare: fareInfo.totalFare,
    finalFare: fareInfo.totalFare,
    paymentMethod: paymentMethod || 'cash',
    requestedAt: new Date().toISOString()
  };

  db.createRide(newRide);

  // Notificar a choferes conectados por WebSocket
  const io = req.app.get('io');
  if (io) {
    io.to('drivers').emit('ride:new_available', {
      ride: newRide,
      passenger: {
        id: req.user.id,
        fullName: req.user.fullName,
        phone: req.user.phone
      }
    });
  }

  // Notificar también por Push Notifications a choferes online con pases activos
  const onlineDrivers = db.getOnlineDrivers();
  for (const driverLoc of onlineDrivers) {
    if (db.hasActivePass(driverLoc.driverId)) {
      const driverUser = db.findUserById(driverLoc.driverId);
      if (driverUser && driverUser.pushToken) {
        sendExpoPushNotification(driverUser.pushToken, {
          title: '🚕 ¡Nuevo viaje en BariGo!',
          body: `${originAddress} ➔ ${destinationAddress} • Tarifa: $${fareInfo.totalFare}`,
          data: { rideId: newRide.id }
        });
      }
    }
  }

  return res.status(201).json({
    message: 'Viaje solicitado. Buscando choferes cercanos...',
    ride: newRide
  });
};

// Obtener detalles de un viaje
exports.getRide = (req, res) => {
  const ride = db.getRideById(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Viaje no encontrado' });

  const passenger = db.findUserById(ride.passengerId);
  let driver = null;
  let driverProfile = null;
  let driverLocation = null;

  if (ride.driverId) {
    driver = db.findUserById(ride.driverId);
    driverProfile = db.getDriverProfile(ride.driverId);
    driverLocation = db.getDriverLocation(ride.driverId);
  }

  return res.json({
    ride,
    passenger: passenger ? { id: passenger.id, fullName: passenger.fullName, phone: passenger.phone } : null,
    driver: driver ? { id: driver.id, fullName: driver.fullName, phone: driver.phone } : null,
    driverProfile,
    driverLocation
  });
};

// Cancelar viaje
exports.cancelRide = (req, res) => {
  const ride = db.getRideById(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Viaje no encontrado' });

  if (ride.status === 'completed') {
    return res.status(400).json({ error: 'El viaje ya fue completado y no puede cancelarse' });
  }

  const updated = db.updateRide(ride.id, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancellationReason: req.body.reason || 'Cancelado por el usuario'
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`ride:${ride.id}`).emit('ride:cancelled', { ride: updated });
    io.to('drivers').emit('ride:removed', { rideId: ride.id });
  }

  return res.json({ message: 'Viaje cancelado', ride: updated });
};

// Historial de viajes del pasajero
exports.getPassengerHistory = (req, res) => {
  const rides = db.getRidesByPassenger(req.user.id);
  return res.json(rides);
};

// Historial de viajes del chofer
exports.getDriverHistory = (req, res) => {
  const rides = db.getRidesByDriver(req.user.id);
  return res.json(rides);
};
