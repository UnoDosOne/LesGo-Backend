const express = require('express');
const router = express.Router();
const { getCompletedRecordCount, getallRecords } = require('../controllers/recordsController');

// Route to get count of completed records
// GET /api/records/count endpoint to fetch count of completed records
router.get('/records/count', getCompletedRecordCount);

// Route to get all records
// GET /api/records endpoint to fetch all records
router.get('/records', getallRecords);

module.exports = router;
