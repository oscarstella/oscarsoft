const db = require('../models/db');

// Obtener choferes conectados para el radar del mapa
exports.getOnlineDrivers = (req, res) => {
  const onlineDrivers = db.getOnlineDrivers();
  const list = onlineDrivers.map(loc => {
    const profile = db.getDriverProfile(loc.driverId);
    const user = db.findUserById(loc.driverId);
    return {
      driverId: loc.driverId,
      lat: loc.lat,
      lng: loc.lng,
      heading: loc.heading,
      vehicle: profile ? `${profile.vehicleMake} ${profile.vehicleModel} (${profile.vehicleColor})` : 'Vehículo',
      rating: profile ? profile.ratingAvg : 5.0,
      driverName: user ? user.fullName : 'Chofer BariGo'
    };
  });

  return res.json(list);
};

// Obtener estado del pase de 24 horas
exports.getPassStatus = (req, res) => {
  const driverId = req.user.id;
  const hasPass = db.hasActivePass(driverId);
  const activePass = db.getActivePass(driverId);
  const settings = db.getSettings();

  return res.json({
    hasActivePass: hasPass,
    activePass,
    price24h: settings.driverPass24hPrice
  });
};

// Comprar / Activar Pase de 24 horas
exports.buy24hPass = (req, res) => {
  const driverId = req.user.id;
  const settings = db.getSettings();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const pass = db.createPass({
    id: 'pass-' + Date.now(),
    driverId,
    amountPaid: settings.driverPass24hPrice,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    paymentStatus: 'approved',
    paymentMethod: req.body.paymentMethod || 'mercadopago',
    paymentReference: req.body.paymentReference || 'MP-TRANS-' + Date.now()
  });

  return res.status(201).json({
    message: '¡Pase de 24hs activado con éxito! Ya puedes recibir viajes.',
    pass
  });
};

// Conectar / Desconectar chofer
exports.toggleOnline = (req, res) => {
  const driverId = req.user.id;
  const { isOnline, lat, lng } = req.body;

  if (isOnline && !db.hasActivePass(driverId)) {
    return res.status(403).json({
      error: 'Debes tener un Pase de 24hs activo para conectarte y recibir viajes.',
      requiresPass: true
    });
  }

  const updatedLocation = db.updateDriverLocation(driverId, {
    isOnline: !!isOnline,
    lat: lat !== undefined ? Number(lat) : undefined,
    lng: lng !== undefined ? Number(lng) : undefined
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('driver:status_changed', {
      driverId,
      isOnline: !!isOnline,
      lat: updatedLocation.lat,
      lng: updatedLocation.lng
    });
  }

  return res.json({
    message: isOnline ? 'Chofer conectado y visible en el radar' : 'Chofer desconectado',
    location: updatedLocation
  });
};

// Actualizar datos del vehículo
exports.updateVehicle = (req, res) => {
  const driverId = req.user.id;
  const updated = db.setDriverProfile(driverId, req.body);
  return res.json({ message: 'Vehículo actualizado', profile: updated });
};

// Obtener perfil del chofer (para cockpit y apps)
exports.getProfile = (req, res) => {
  const driverId = req.params.driverId || req.user?.id || 'usr-chofer-1';
  const user = db.findUserById(driverId);
  const profile = db.getDriverProfile(driverId) || {};
  const hasPass = db.hasActivePass(driverId);
  const location = db.getDriverLocation(driverId);

  return res.json({
    id: driverId,
    name: user ? user.fullName : (profile.fullName || 'Carlos Nahuel Huapi'),
    fullName: user ? user.fullName : (profile.fullName || 'Carlos Nahuel Huapi'),
    email: user ? user.email : '',
    phone: user ? user.phone : '+54 9 294 422-3344',
    rating: profile.ratingAvg || 4.96,
    tripsCount: profile.totalTrips || 0,
    vehicleModel: `${profile.vehicleMake || ''} ${profile.vehicleModel || ''}`.trim() || 'Chevrolet Onix Joy',
    vehicleMake: profile.vehicleMake || 'Chevrolet',
    vehicleName: profile.vehicleModel || 'Onix Joy',
    vehicleColor: profile.vehicleColor || 'Blanco',
    vehiclePlate: profile.vehiclePlate || 'AF 342 BZ',
    hasPass24h: hasPass,
    verified: profile.verificationStatus === 'approved',
    location
  });
};

