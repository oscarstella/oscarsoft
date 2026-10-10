const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/estimate', rideController.estimateFare);
router.post('/request', authenticate, rideController.requestRide);
router.get('/history/passenger', authenticate, rideController.getPassengerHistory);
router.get('/history/driver', authenticate, rideController.getDriverHistory);
router.get('/:id', authenticate, rideController.getRide);
router.post('/:id/cancel', authenticate, rideController.cancelRide);

module.exports = router;
