const express = require('express');
const router = express.Router();
const { getQrData } = require('../controllers/qrController'); // Update with your actual controller file

// Define the route
router.get('/qrdata', getQrData);

module.exports = router;