const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const { updateRequestStatus } = require('../controllers/requestController'); // Correctly import the controller function
const { protect } = require("../middleware/authMiddleware");
const { requestPasswordReset } = require("../controllers/authController"); // Import the function from authController
const { resetPassword } = require("../controllers/authController");


// Define the POST route with file upload
router.post(
  "/request",
  protect, // Add the `protect` middleware for authentication
  requestController.upload, // Use the configured `upload` middleware directly
  requestController.saveRequest
);

// Reset password route
router.post("/reset-password", resetPassword); // Define the reset password route

// Forgot password route
router.post("/forgot-password", requestPasswordReset); // Use the imported function

// PUT route
router.put('/request/:id', updateRequestStatus); // Ensure the function exists and is correctly referenced

// Route to get the counts of active, processed, and rejected requests
router.get('/request-counts', requestController.getRequestCounts);


// Define the GET route to fetch all requests for authenticated users
router.get(
  "/request",
  protect, // Add the `protect` middleware for authentication
  requestController.getAllRequests // Add the controller function for handling GET requests
);

module.exports = router;
