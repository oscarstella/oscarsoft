const db = require('../models/db');

exports.getDashboardStats = (req, res) => {
  const allRides = db.getAllRides();
  const allDrivers = db.getAllDriverProfiles();
  const allUsers = db.getAllUsers();
  const settings = db.getSettings();

  const completedRides = allRides.filter(r => r.status === 'completed');
  const totalVolume = completedRides.reduce((acc, r) => acc + (r.finalFare || 0), 0);
  const activePassesCount = allDrivers.filter(d => db.hasActivePass(d.id)).length;

  return res.json({
    stats: {
      totalRides: allRides.length,
      completedRides: completedRides.length,
      totalVolume,
      totalDrivers: allDrivers.length,
      activeDriversWithPass: activePassesCount,
      totalPassengers: allUsers.filter(u => u.role === 'passenger').length
    },
    settings,
    recentRides: allRides.slice(-10).reverse()
  });
};

exports.updateFareSettings = (req, res) => {
  const updated = db.updateSettings(req.body);
  return res.json({ message: 'Tarifas actualizadas correctamente', settings: updated });
};

exports.getAllDrivers = (req, res) => {
  const drivers = db.getAllDriverProfiles().map(profile => {
    const user = db.findUserById(profile.id);
    const hasPass = db.hasActivePass(profile.id);
    const location = db.getDriverLocation(profile.id);
    return {
      ...profile,
      fullName: user ? user.fullName : 'Chofer',
      email: user ? user.email : '',
      phone: user ? user.phone : '',
      hasActivePass: hasPass,
      location
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
