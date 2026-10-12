const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.get('/stats', authenticate, requireRole('admin'), adminController.getDashboardStats);
router.put('/fares', authenticate, requireRole('admin'), adminController.updateFareSettings);
router.get('/drivers', authenticate, requireRole('admin'), adminController.getAllDrivers);
router.put('/drivers/:driverId', authenticate, requireRole('admin'), adminController.updateDriver);
router.put('/drivers/:driverId/verify', authenticate, requireRole('admin'), adminController.verifyDriver);
router.post('/drivers/:driverId/pass', authenticate, requireRole('admin'), adminController.grantDriverPass);

module.exports = router;
