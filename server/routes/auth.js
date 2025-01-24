const express = require("express");
const {
  registerUser,
  loginUser,
  activateAccount,
  requestPasswordReset,
  resetPassword,
  getAllUsersAndCount,
} = require("../controllers/authController");
const router = express.Router();

// Register User
router.post("/Users", registerUser);

// Login User
router.post("/auth/login", loginUser);

// Request Password Reset
router.post("/forgot-password", requestPasswordReset);

// Reset Password
router.post("/reset-password", resetPassword);

// Activate Account
router.get("/activate", activateAccount);
// Define the route for getting all users and counting them
router.get('/all-users', getAllUsersAndCount);

module.exports = router;
