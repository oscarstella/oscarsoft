const db = require('../models/db');

exports.getDashboardStats = (req, res) => {
  const allRides = db.getAllRides();
  const allDriverUsers = db.getAllUsers().filter(u => u.role === 'driver');
  const allUsers = db.getAllUsers();
  const settings = db.getSettings();

  const completedRides = allRides.filter(r => r.status === 'completed');
  const totalVolume = completedRides.reduce((acc, r) => acc + (Number(r.finalFare) || Number(r.fare) || 0), 0);
  const activePassesCount = allDriverUsers.filter(d => db.hasActivePass(d.id)).length;

  return res.json({
    stats: {
      totalRides: allRides.length,
      completedRides: completedRides.length,
      totalVolume,
      totalDrivers: allDriverUsers.length,
      activeDriversWithPass: activePassesCount,
      totalPassengers: allUsers.filter(u => u.role === 'passenger').length
    },
    settings,
    recentRides: allRides.slice(-15).reverse()
  });
};

exports.updateFareSettings = (req, res) => {
  const updated = db.updateSettings(req.body);
  return res.json({ message: 'Tarifas actualizadas correctamente', settings: updated });
};

exports.getAllDrivers = (req, res) => {
  const driverUsers = db.getAllUsers().filter(u => u.role === 'driver');

  const drivers = driverUsers.map(user => {
    let profile = db.getDriverProfile(user.id);
    if (!profile) {
      profile = db.setDriverProfile(user.id, {
        id: user.id,
        vehicleMake: 'Chevrolet',
        vehicleModel: 'Onix Joy',
        vehicleYear: 2022,
        vehiclePlate: 'AF 342 BZ',
        vehicleColor: 'Blanco',
        verificationStatus: 'approved',
        ratingAvg: 4.96,
        totalTrips: 0
      });
    }
    const hasPass = db.hasActivePass(user.id);
    const location = db.getDriverLocation(user.id);
    const activePass = db.getActivePass(user.id);
    let passHoursLeft = 0;
    if (activePass && activePass.expiresAt) {
      passHoursLeft = Math.max(0, Math.round((new Date(activePass.expiresAt) - new Date()) / (1000 * 60 * 60)));
    }

    return {
      id: user.id,
      name: user.fullName || 'Carlos Nahuel Huapi',
      fullName: user.fullName || 'Carlos Nahuel Huapi',
      email: user.email,
      phone: user.phone || '+54 9 294 422-3344',
      vehicleModel: `${profile.vehicleMake || ''} ${profile.vehicleModel || ''}`.trim() || 'Chevrolet Onix Joy',
      vehicleMake: profile.vehicleMake || 'Chevrolet',
      vehicleName: profile.vehicleModel || 'Onix Joy',
      vehiclePlate: profile.vehiclePlate || 'AF 342 BZ',
      vehicleColor: profile.vehicleColor || 'Blanco',
      vehicleYear: profile.vehicleYear || 2022,
      category: profile.category || 'classic',
      rating: profile.ratingAvg || 4.96,
      tripsCount: profile.totalTrips || 0,
      todayEarnings: profile.todayEarnings || 0,
      hasPass24h: hasPass,
      passHoursLeft,
      verified: profile.verificationStatus === 'approved',
      verificationStatus: profile.verificationStatus || 'approved',
      status: location && location.isOnline ? (location.isBusy ? 'busy' : 'online') : 'online',
      lat: location ? location.lat : -41.1348,
      lng: location ? location.lng : -71.3055
    };
  });

  return res.json(drivers);
};

exports.verifyDriver = (req, res) => {
  const { driverId } = req.params;
  const { status, rejectionReason } = req.body; // 'approved', 'rejected', 'suspended'

  const profile = db.setDriverProfile(driverId, {
    verificationStatus: status,
    rejectionReason: rejectionReason || null
  });

  return res.json({ message: `Chofer actualizado a ${status}`, profile });
};

exports.updateDriver = (req, res) => {
  const { driverId } = req.params;
  const { 
    fullName, 
    phone, 
    email, 
    vehicleMake, 
    vehicleModel, 
    vehiclePlate, 
    vehicleColor, 
    vehicleYear, 
    ratingAvg, 
    verificationStatus, 
    hasPass 
  } = req.body;

  if (fullName || phone || email) {
    db.updateUser(driverId, {
      ...(fullName ? { fullName } : {}),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {})
    });
  }

  const profile = db.setDriverProfile(driverId, {
    ...(vehicleMake ? { vehicleMake } : {}),
    ...(vehicleModel ? { vehicleModel } : {}),
    ...(vehiclePlate ? { vehiclePlate } : {}),
    ...(vehicleColor ? { vehicleColor } : {}),
    ...(vehicleYear ? { vehicleYear: Number(vehicleYear) } : {}),
    ...(ratingAvg !== undefined ? { ratingAvg: Number(ratingAvg) } : {}),
    ...(verificationStatus ? { verificationStatus } : {})
  });

  if (hasPass === true && !db.hasActivePass(driverId)) {
    db.createPass({
      id: `pass-admin-${Date.now()}`,
      driverId,
      amountPaid: 4500,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      paymentStatus: 'approved',
      paymentMethod: 'admin_grant'
    });
  }

  return res.json({ message: 'Chofer configurado correctamente', profile });
};

exports.grantDriverPass = (req, res) => {
  const { driverId } = req.params;
  const pass = db.createPass({
    id: `pass-admin-${Date.now()}`,
    driverId,
    amountPaid: 4500,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    paymentStatus: 'approved',
    paymentMethod: 'admin_grant'
  });

  return res.json({ message: 'Pase de 24hs otorgado con éxito', pass });
};

