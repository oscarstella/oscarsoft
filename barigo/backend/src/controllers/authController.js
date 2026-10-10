const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../config/constants');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Registro
exports.register = (req, res) => {
  const { email, password, fullName, phone, role } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, contraseña y nombre completo son obligatorios' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: 'usr-' + Date.now(),
    email,
    password: passwordHash,
    fullName,
    phone: phone || '',
    role: role === 'driver' ? 'driver' : 'passenger',
    createdAt: new Date().toISOString()
  };

  db.createUser(newUser);

  // Si es chofer, creamos el perfil inicial de vehículo
  if (newUser.role === 'driver') {
    db.setDriverProfile(newUser.id, {
      vehicleMake: req.body.vehicleMake || 'Pendiente',
      vehicleModel: req.body.vehicleModel || 'Pendiente',
      vehicleYear: req.body.vehicleYear || new Date().getFullYear(),
      vehiclePlate: req.body.vehiclePlate || 'Pendiente',
      vehicleColor: req.body.vehicleColor || 'Blanco',
      hasSnowChains: true,
      verificationStatus: 'pending_approval'
    });
  }

  const token = generateToken(newUser);
  const { password: _, ...userSafe } = newUser;

  return res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: userSafe,
    token
  });
};

// Login
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Ingresa email y contraseña' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generateToken(user);
  const { password: _, ...userSafe } = user;
  const driverProfile = user.role === 'driver' ? db.getDriverProfile(user.id) : null;
  const hasPass = user.role === 'driver' ? db.hasActivePass(user.id) : false;

  return res.json({
    message: 'Inicio de sesión exitoso',
    user: userSafe,
    driverProfile,
    hasActivePass: hasPass,
    token
  });
};

// Obtener perfil actual
exports.getProfile = (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { password: _, ...userSafe } = user;
  const driverProfile = user.role === 'driver' ? db.getDriverProfile(user.id) : null;
  const hasPass = user.role === 'driver' ? db.hasActivePass(user.id) : false;
  const activePass = user.role === 'driver' ? db.getActivePass(user.id) : null;

  return res.json({
    user: userSafe,
    driverProfile,
    hasActivePass: hasPass,
    activePass
  });
};

// Actualizar push token de Expo
exports.updatePushToken = (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ error: 'pushToken es requerido' });

  db.updateUser(req.user.id, { pushToken });
  return res.json({ success: true, message: 'Push token actualizado' });
};
