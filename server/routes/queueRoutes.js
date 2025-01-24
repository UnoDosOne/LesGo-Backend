const express = require("express");
const router = express.Router();
const queueController = require("../controllers/queueController");
const { protect } = require("../controllers/authController"); // Import the protect middleware

// Route to get the queue
router.get("/queue", protect, queueController.getQueue);

// Route to add a student to the queue
router.post("/addToQueue", queueController.addToQueue);
router.put("/serve-queue", queueController.serveQueue);

router.get("/get-records-list", protect, queueController.getRecordsList);

module.exports = router;
