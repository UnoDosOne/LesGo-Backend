const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const UserCreate = require("../models/UserCreate.js");
const User = require("../models/User.js");
const sendEmail = require("../utility/sendEmail.js"); // Ensure you have this utility for sending emails

// Add user (with activation token)
const addUser = async (req, res) => {
  try {
    const { department, email, firstName, lastName, password, role, id } =
      req.body;

    // Check if the user already exists
    const existingUser = await UserCreate.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Please use another one.",
      });
    }

    if (!password) {
      return res.status(404).json({
        message: "No password input",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate activation token and expiry
    const activationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24-hour expiration

    // Create new user
    const newUser = new UserCreate({
      department,
      fName: firstName,
      lName: lastName,
      pword: hashedPassword,
      email,
      userType: role,
      schoolID: id,
      activationToken,
      tokenExpiry,
      isActive: false, // Initially set to false
    });

    await newUser.save();

    // Send activation email
    const activationLink = `${process.env.FRONTEND_URL.replace(
      /\/$/,
      ""
    )}/activate?token=${activationToken}`;
    await sendEmail(
      email,
      "Activate Your Account",
      `
      Hi ${firstName},

      Thank you for registering with LesGo QueueEase!
      
      Please activate your account by clicking the link below:
      ${activationLink}
      
      This link will expire in 24 hours.

      If you did not request this registration, please ignore this email.

      Best regards,
      The LesGo QueueEase Team
      `
    );

    res.status(201).json({
      message:
        "Registration successful! Please check your email to activate your account.",
    });
  } catch (err) {
    console.error("Server error during registration:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Activate account
const activateAccount = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ activationToken: token });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired activation token." });
    }

    // Check if token has expired
    if (user.tokenExpiry < Date.now()) {
      return res.status(400).json({
        message: "Activation link has expired. Please register again.",
      });
    }

    // Activate the account
    console.log("User Before Activation Save:", user);

    const updatedRequest = await Request.findByIdAndUpdate(
      user._id,
      {
        isActive: true,
        activationToken: undefined,
        tokenExpiry: undefined,
        documentType: dType,
      },
      {
        new: true,
      }
    );

    console.log("User After Activation Save:", user);

    res
      .status(200)
      .json({ message: "Account activated successfully! You can now log in." });
  } catch (err) {
    console.error("Activation error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await UserCreate.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Generate the reset link
    const resetLink = `${process.env.FRONTEND_URL.replace(
      /\/$/,
      ""
    )}/reset-password?token=${resetToken}`;

    // Send reset email
    await sendEmail(
      email,
      "Reset Your Password",
      `Hi ${user.fName},

You requested to reset your password. Please use the link below to reset it:

${resetLink}

This link will expire in 1 hour. If you didn't request this, please ignore this email.

Best regards,
The LesGo QueueEase Team`
    );

    res.status(200).json({ message: "Password reset link sent successfully." });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      message: "Failed to send password reset link. Please try again.",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }

    const user = await UserCreate.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // Ensure token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.pword = hashedPassword;
    user.resetToken = null; // Clear token
    user.resetTokenExpiry = null; // Clear expiry
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const getUser = async (req, res) => {
  try {
    const documents = await UserCreate.find({
      userType: { $in: ["admin", "registrar"] },
      isActive: true // Correct query syntax
    });

    res.status(200).json({ data: documents, message: "Successful retrieval" });
  } catch (error) {
    console.error("Error fetching users:", error); // Logging the error for debugging
    res.status(500).json({ message: "Failed to retrieve users" }); // Sending a proper error response
  }
};

const deleteUser = async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.body.id);

    const user = await User.updateOne(
      { _id: req.body.id },
      { isActive: false }
    );
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User deleted successfully", user });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error deleting user", error: err.message });
  }
};

// Export functions
module.exports = {
  addUser,
  getUser,
  activateAccount,
  requestPasswordReset,
  resetPassword,
  deleteUser,
};
