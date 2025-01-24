const express = require("express");
const router = express.Router();

const {
  addUser,
  getUser,
  activateAccount,
  requestPasswordReset,
  resetPassword,
  deleteUser,
} = require("../controllers/addUserController.js");

// Route for adding a new user
router.post("/add-user", addUser);

// Route for fetching all users (admin/registrar roles)
router.get("/getall-users", getUser);

// Route for requesting a password reset
router.post("/request-password-reset", requestPasswordReset);

// Route for resetting the user's password
router.post("/reset-password", resetPassword);

router.post("/delete-user", deleteUser);

module.exports = router;
