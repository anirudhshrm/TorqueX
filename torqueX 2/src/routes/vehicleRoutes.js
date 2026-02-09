const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { requireAuth } = require('../middleware/authMiddleware');

// Get all vehicles with optional filtering
router.get('/', vehicleController.getAllVehicles);

// Search vehicles by type
router.get('/search', vehicleController.getAllVehicles);

// Get booking form for a vehicle
router.get('/:id/book', requireAuth, vehicleController.getBookingForm);

// Get a single vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

module.exports = router;