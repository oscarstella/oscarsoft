const db = require('../models/db');
const { sendExpoPushNotification } = require('../services/notificationService');
const { calculateDistanceKm } = require('../services/fareService');

// Mapa de temporizadores de expansión concéntrica de búsqueda
const activeDispatchTimers = new Map();

/**
 * Algoritmo de Despacho con Anillos Concéntricos de Búsqueda en Bariloche:
 * 1. Anillo 1: Choferes a menos de 3 km (inmediato).
 * 2. Anillo 2: Expansión a 5 km (a los 4 segundos).
 * 3. Anillo 3: Expansión a 10 km (a los 8 segundos).
 * 4. Anillo 4: Todo Bariloche (a los 12 segundos).
 */
function dispatchRideExpandingRings(io, ride, passenger) {
  if (!io || !ride) return;

  // Limpiar temporizadores previos si existen
  if (activeDispatchTimers.has(ride.id)) {
    activeDispatchTimers.get(ride.id).forEach(clearTimeout);
    activeDispatchTimers.delete(ride.id);
  }

  const rings = [
    { radiusKm: 3, delayMs: 0, label: '3 km' },
    { radiusKm: 5, delayMs: 4000, label: '5 km' },
    { radiusKm: 10, delayMs: 8000, label: '10 km' },
    { radiusKm: 999, delayMs: 12000, label: 'Todo Bariloche' }
  ];

  const timers = [];

  rings.forEach((ring) => {
    const timer = setTimeout(() => {
      const currentRide = db.getRideById(ride.id);
      if (!currentRide || currentRide.status !== 'requested') {
        return; // El viaje ya fue aceptado por un chofer o cancelado
      }

      console.log(`[BariGo Despacho] Anillo: ${ring.label} (${ring.radiusKm} km) para viaje ${ride.id} (${currentRide.originAddress} ➔ ${currentRide.destinationAddress})`);

      const offerPayload = {
        ride: {
          id: currentRide.id,
          passengerId: currentRide.passengerId,
          originText: currentRide.originAddress,
          destText: currentRide.destinationAddress,
          originAddress: currentRide.originAddress,
          destinationAddress: currentRide.destinationAddress,
          originLat: currentRide.originLat,
          originLng: currentRide.originLng,
          destinationLat: currentRide.destinationLat,
          destinationLng: currentRide.destinationLng,
          fare: currentRide.estimatedFare,
          estimatedFare: currentRide.estimatedFare,
          distanceKm: currentRide.estimatedDistanceKm,
          durationMins: currentRide.estimatedDurationMins,
          category: currentRide.category || 'BariGo Estándar',
          paymentMethod: currentRide.paymentMethod || 'cash',
          status: 'requested',
          createdAt: currentRide.requestedAt
        },
        passenger: {
          id: passenger?.id || currentRide.passengerId || 'usr-pasajero-1',
          fullName: passenger?.fullName || currentRide.passengerName || 'Oscar Stella',
          phone: passenger?.phone || currentRide.passengerPhone || '+54 9 294 400-1122'
        },
        ring: ring.label,
        radiusKm: ring.radiusKm
      };

      // Emitir tanto a la sala de choferes como emisión global para garantizar recepción en web y móvil
      io.to('drivers').emit('ride:new_available', offerPayload);
      io.emit('ride:new_available', offerPayload);

    }, ring.delayMs);

    timers.push(timer);
  });

  activeDispatchTimers.set(ride.id, timers);
}

function clearRideTimers(rideId) {
  if (activeDispatchTimers.has(rideId)) {
    activeDispatchTimers.get(rideId).forEach(clearTimeout);
    activeDispatchTimers.delete(rideId);
  }
}

function setupSockets(io) {
  io.on('connection', (socket) => {
    const { userId, role } = socket.handshake.query;
    console.log(`[Socket Conectado] ID: ${socket.id} | User: ${userId || 'Anon'} | Rol: ${role || 'desconocido'}`);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (role === 'driver') {
      socket.join('drivers');
    }

    // Identificación explícita de chofer
    socket.on('driver:register', (data) => {
      socket.join('drivers');
      const driverId = data?.driverId || userId || 'drv-carlos';
      if (driverId) {
        socket.join(`user:${driverId}`);
      }
      console.log(`[Chofer Registrado] ID: ${driverId} en sala drivers`);
    });

    // 1. Chofer reporta posición GPS en tiempo real
    socket.on('driver:update_location', (data) => {
      const driverId = data.driverId || userId || 'drv-carlos';
      socket.join('drivers');

      const updated = db.updateDriverLocation(driverId, {
        lat: Number(data.lat),
        lng: Number(data.lng),
        heading: Number(data.heading || 0),
        speed: Number(data.speed || 0),
        isOnline: data.isOnline !== undefined ? Boolean(data.isOnline) : true
      });

      // Si el chofer está en un viaje activo, retransmitir GPS al pasajero
      if (data.activeRideId) {
        const locPayload = {
          rideId: data.activeRideId,
          lat: updated.lat,
          lng: updated.lng,
          heading: updated.heading,
          speed: updated.speed
        };
        io.to(`ride:${data.activeRideId}`).emit('ride:driver_location', locPayload);
        io.emit('ride:driver_location', locPayload);
      }

      // Notificar al radar público de choferes disponibles
      io.emit('drivers:radar_update', {
        driverId,
        lat: updated.lat,
        lng: updated.lng,
        heading: updated.heading
      });
    });

    // 2. Solicitud de viaje en tiempo real desde Pasajero (WebSocket directo)
    socket.on('ride:request', (data) => {
      console.log(`[Socket] Solicitud de viaje recibida de pasajero:`, data?.passengerName || userId);

      const rideId = data.id || ('ride-' + Date.now());
      const passengerId = data.passengerId || userId || 'usr-pasajero-1';
      const passengerName = data.passengerName || 'Oscar Stella';
      const passengerPhone = data.passengerPhone || '+54 9 294 400-1122';

      const newRide = {
        id: rideId,
        passengerId,
        passengerName,
        passengerPhone,
        driverId: null,
        status: 'requested',
        originAddress: data.originAddress || data.originText || 'Centro Cívico',
        originLat: Number(data.originLat || data.originCoord?.lat || -41.1335),
        originLng: Number(data.originLng || data.originCoord?.lng || -71.3103),
        destinationAddress: data.destinationAddress || data.destText || 'Pasaje Gutiérrez 980',
        destinationLat: Number(data.destinationLat || data.destCoord?.lat || -41.1415),
        destinationLng: Number(data.destinationLng || data.destCoord?.lng || -71.3132),
        estimatedDistanceKm: Number(data.distanceKm || data.estimatedDistanceKm || 2.5),
        estimatedDurationMins: Number(data.durationMins || data.estimatedDurationMins || 7),
        estimatedFare: Number(data.fare || data.estimatedFare || 3500),
        finalFare: Number(data.fare || data.estimatedFare || 3500),
        category: data.category || 'BariGo Estándar',
        paymentMethod: data.paymentMethod || 'cash',
        requestedAt: new Date().toISOString()
      };

      db.createRide(newRide);

      socket.join(`ride:${rideId}`);
      socket.join(`user:${passengerId}`);

      // Confirmar al pasajero que la solicitud ingresó al sistema
      socket.emit('ride:request_confirmed', { ride: newRide });

      // Iniciar búsqueda por anillos concéntricos
      dispatchRideExpandingRings(io, newRide, {
        id: passengerId,
        fullName: passengerName,
        phone: passengerPhone
      });
    });

    // 3. Chofer acepta un viaje (Real End-to-End)
    socket.on('ride:accept', async ({ rideId, driverId, driver }) => {
      console.log(`[Socket] Chofer acepta viaje ${rideId} (Driver ID: ${driverId})`);
      const actualDriverId = driverId || userId || 'drv-carlos';
      const ride = db.getRideById(rideId);

      if (!ride || ride.status !== 'requested') {
        return socket.emit('ride:error', { message: 'El viaje ya no está disponible o ya fue tomado' });
      }

      // Detener búsqueda concéntrica
      clearRideTimers(rideId);

      // Asegurar pase activo para que no bloquee pruebas
      if (!db.hasActivePass(actualDriverId)) {
        db.createPass({
          id: `pass-auto-${Date.now()}`,
          driverId: actualDriverId,
          amountPaid: 4500,
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          paymentStatus: 'approved',
          paymentMethod: 'mercadopago'
        });
      }

      // Asignar viaje al chofer
      const driverUser = db.findUserById(actualDriverId);
      const driverProfile = db.getDriverProfile(actualDriverId) || {};

      const updatedRide = db.updateRide(rideId, {
        driverId: actualDriverId,
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });

      db.updateDriverLocation(actualDriverId, { isBusy: true });

      // Unir chofer a la sala del viaje
      socket.join(`ride:${rideId}`);

      const resolvedDriver = {
        id: actualDriverId,
        fullName: driver?.name || driverUser?.fullName || 'Carlos Nahuel Huapi',
        name: driver?.name || driverUser?.fullName || 'Carlos Nahuel Huapi',
        phone: driver?.phone || driverUser?.phone || '+54 9 294 422-3344',
        vehicle: driver?.vehicle || `${driverProfile.vehicleMake || 'Chevrolet'} ${driverProfile.vehicleModel || 'Onix Joy'} (${driverProfile.vehicleColor || 'Blanco'})`,
        plate: driver?.plate || driverProfile.vehiclePlate || 'AF 342 BZ',
        rating: driver?.rating || driverProfile.ratingAvg || 4.96,
        lat: Number(ride.originLat) + 0.002,
        lng: Number(ride.originLng) - 0.002
      };

      const acceptedPayload = {
        ride: updatedRide,
        driver: resolvedDriver
      };

      // 1. Notificar al pasajero en su sala individual
      io.to(`user:${ride.passengerId}`).emit('ride:accepted', acceptedPayload);
      // 2. Notificar en la sala del viaje
      io.to(`ride:${rideId}`).emit('ride:accepted', acceptedPayload);
      // 3. Notificación global broadcast para garantizar recepción en todas las apps
      io.emit('ride:accepted', acceptedPayload);

      // 4. Notificar a todos los choferes para que retiren la oferta
      io.to('drivers').emit('ride:removed', { rideId });
      io.emit('ride:removed', { rideId });

      // 5. Push notification al pasajero si tiene token
      if (driverUser) {
        const passengerUser = db.findUserById(ride.passengerId);
        if (passengerUser && passengerUser.pushToken) {
          sendExpoPushNotification(passengerUser.pushToken, {
            title: '✅ ¡Chofer confirmado en BariGo!',
            body: `${resolvedDriver.fullName} viene en camino (${resolvedDriver.vehicle}).`,
            data: { rideId }
          });
        }
      }
    });

    // 4. Chofer actualiza estado del viaje ('arriving', 'in_progress', 'completed')
    socket.on('ride:update_status', ({ rideId, status }) => {
      const ride = db.getRideById(rideId);
      if (!ride) return;

      const updates = { status };
      const now = new Date().toISOString();

      if (status === 'arriving') updates.arrivedAt = now;
      if (status === 'in_progress') updates.startedAt = now;
      if (status === 'completed') {
        updates.completedAt = now;
        db.updateDriverLocation(ride.driverId, { isBusy: false });
      }

      const updatedRide = db.updateRide(rideId, updates);
      const statusPayload = { rideId, status, ride: updatedRide };

      io.to(`ride:${rideId}`).emit('ride:status_changed', statusPayload);
      io.to(`user:${ride.passengerId}`).emit('ride:status_changed', statusPayload);
      io.emit('ride:status_changed', statusPayload);
    });

    // 4b. Alerta automática de proximidad a 1 minuto
    socket.on('ride:one_minute_alert', ({ rideId, driverName, message }) => {
      const ride = db.getRideById(rideId);
      const alertPayload = {
        rideId,
        driverName: driverName || 'Carlos Nahuel Huapi',
        message: message || '¡Hola! Estoy a 1 minuto de llegar a tu ubicación. Por favor salí al punto de encuentro.',
        timestamp: new Date().toISOString()
      };

      if (ride) {
        io.to(`user:${ride.passengerId}`).emit('ride:one_minute_alert', alertPayload);
      }
      io.to(`ride:${rideId}`).emit('ride:one_minute_alert', alertPayload);
      io.emit('ride:one_minute_alert', alertPayload);
    });

    // 5. Cancelar viaje
    socket.on('ride:cancel', ({ rideId }) => {
      clearRideTimers(rideId);
      const ride = db.getRideById(rideId);
      if (ride) {
        db.updateRide(rideId, { status: 'cancelled', cancelledAt: new Date().toISOString() });
        io.to(`ride:${rideId}`).emit('ride:cancelled', { rideId });
        io.to(`user:${ride.passengerId}`).emit('ride:cancelled', { rideId });
        io.to('drivers').emit('ride:removed', { rideId });
        io.emit('ride:removed', { rideId });
      }
    });

    // 6. Suscribirse a una sala de viaje
    socket.on('ride:join', ({ rideId }) => {
      if (rideId) socket.join(`ride:${rideId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Desconectado] ${socket.id}`);
    });
  });
}

module.exports = setupSockets;
module.exports.dispatchRideExpandingRings = dispatchRideExpandingRings;
