const db = require('../models/db');
const { sendExpoPushNotification } = require('../services/notificationService');

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

    // 1. Chofer reporta posición GPS en tiempo real
    socket.on('driver:update_location', (data) => {
      const driverId = data.driverId || userId;
      if (!driverId) return;

      const updated = db.updateDriverLocation(driverId, {
        lat: Number(data.lat),
        lng: Number(data.lng),
        heading: Number(data.heading || 0),
        speed: Number(data.speed || 0),
        isOnline: data.isOnline !== undefined ? Boolean(data.isOnline) : true
      });

      // Si el chofer está en un viaje activo, retransmitir GPS al pasajero
      if (data.activeRideId) {
        io.to(`ride:${data.activeRideId}`).emit('ride:driver_location', {
          rideId: data.activeRideId,
          lat: updated.lat,
          lng: updated.lng,
          heading: updated.heading,
          speed: updated.speed
        });
      }

      // Notificar al radar público de choferes disponibles
      io.emit('drivers:radar_update', {
        driverId,
        lat: updated.lat,
        lng: updated.lng,
        heading: updated.heading
      });
    });

    // 2. Chofer acepta un viaje
    socket.on('ride:accept', async ({ rideId, driverId }) => {
      const actualDriverId = driverId || userId;
      const ride = db.getRideById(rideId);

      if (!ride || ride.status !== 'requested') {
        return socket.emit('ride:error', { message: 'El viaje ya no está disponible' });
      }

      if (!db.hasActivePass(actualDriverId)) {
        return socket.emit('ride:error', { message: 'Necesitas un Pase de 24hs activo para aceptar viajes' });
      }

      // Asignar viaje al chofer
      const driverUser = db.findUserById(actualDriverId);
      const driverProfile = db.getDriverProfile(actualDriverId);

      const updatedRide = db.updateRide(rideId, {
        driverId: actualDriverId,
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });

      db.updateDriverLocation(actualDriverId, { isBusy: true });

      // Unir chofer a la sala del viaje
      socket.join(`ride:${rideId}`);

      // Notificar al pasajero
      io.to(`user:${ride.passengerId}`).emit('ride:accepted', {
        ride: updatedRide,
        driver: {
          id: driverUser.id,
          fullName: driverUser.fullName,
          phone: driverUser.phone,
          vehicle: `${driverProfile.vehicleMake} ${driverProfile.vehicleModel} (${driverProfile.vehicleColor})`,
          plate: driverProfile.vehiclePlate,
          rating: driverProfile.ratingAvg
        }
      });

      // Notificar a todos los choferes que retiren la oferta de su pantalla
      io.to('drivers').emit('ride:removed', { rideId });

      // Push notification al pasajero
      if (driverUser) {
        const passengerUser = db.findUserById(ride.passengerId);
        if (passengerUser && passengerUser.pushToken) {
          sendExpoPushNotification(passengerUser.pushToken, {
            title: '✅ ¡Chofer confirmado en BariGo!',
            body: `${driverUser.fullName} viene en un ${driverProfile.vehicleMake} ${driverProfile.vehicleColor}.`,
            data: { rideId }
          });
        }
      }
    });

    // 3. Chofer actualiza estado del viaje ('arriving', 'in_progress', 'completed')
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

      // Notificar a pasajero y chofer en la sala
      io.to(`ride:${rideId}`).emit('ride:status_changed', {
        rideId,
        status,
        ride: updatedRide
      });
      io.to(`user:${ride.passengerId}`).emit('ride:status_changed', {
        rideId,
        status,
        ride: updatedRide
      });
    });

    // 4. Suscribirse a una sala de viaje
    socket.on('ride:join', ({ rideId }) => {
      if (rideId) socket.join(`ride:${rideId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Desconectado] ${socket.id}`);
    });
  });
}

module.exports = setupSockets;
