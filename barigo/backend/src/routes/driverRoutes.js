const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/online', driverController.getOnlineDrivers);
router.get('/pass/status', authenticate, driverController.getPassStatus);
router.post('/pass/buy', authenticate, driverController.buy24hPass);
router.post('/toggle-online', authenticate, driverController.toggleOnline);
router.put('/vehicle', authenticate, driverController.updateVehicle);

module.exports = router;
