const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utility/sendEmail");

// Register User Function
const registerUser = async (req, res) => {
  try {
    const { schoolID, fName, email, pword, age, course, acadYear, userType } =
      req.body;

    console.log("Request Body:", req.body); // Debugging log

    // Validate required fields
    if (
      !schoolID ||
      !fName ||
      !email ||
      !pword ||
      !age ||
      !course ||
      !acadYear ||
      !userType
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the email or schoolID already exists
    const existingUser = await User.findOne({ $or: [{ email }, { schoolID }] });
    if (existingUser) {
      return res.status(400).json({
        message: "Email or School ID already exists. Please use another one.",
      });
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24-hour expiration
    console.log(
      "Activation Token:",
      activationToken,
      "Token Expiry:",
      tokenExpiry
    );

    // Create a new user
    const newUser = new User({
      schoolID,
      fName,
      email,
      pword, // Password will be hashed in the pre-save hook
      age,
      course,
      acadYear,
      userType,
      isActive: false,
      activationToken,
      tokenExpiry,
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
      Hi ${fName},

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

// Activate Account Function
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
    user.isActive = true;
    user.activationToken = undefined; // Clear the token
    user.tokenExpiry = undefined; // Clear the expiry
    await user.save();
    console.log("User After Activation Save:", user);

    res
      .status(200)
      .json({ message: "Account activated successfully! You can now log in." });
  } catch (err) {
    console.error("Activation error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Login User Function
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login Request Body:", req.body);

    // Validate inputs
    if (!email || !password) {
      console.error("Missing email or password");
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    console.log("Fetched User:", user);

    if (!user) {
      console.error("User not found");
      return res
        .status(401)
        .json({ message: "Authentication failed. User not found." });
    }

    // Check if the account is active
    if (!user.isActive) {
      console.error("Account not activated");
      return res.status(403).json({
        message: "Account not activated. Please activate your account.",
      });
    }

    // Validate password
    console.log("Provided Password:", password);
    console.log("Stored Hashed Password:", user.pword);

    const isMatch = await bcrypt.compare(password, user.pword);
    console.log("Password Match Result:", isMatch);

    if (!isMatch) {
      console.error("Incorrect password");
      return res
        .status(401)
        .json({ message: "Authentication failed. Incorrect password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Generated JWT Token:", token);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        schoolID: user.schoolID,
        fName: user.fName,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Request Password Reset Function
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a reset token and set expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save the reset token and expiry to the user's record
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Generate the reset link
    const resetLink = `${process.env.FRONTEND_URL.replace(
      /\/$/,
      ""
    )}/reset-password?token=${resetToken}`;

    // Send the reset email
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

// Reset Password Function
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }

    const user = await User.findOne({
      resetToken: token, // Match token
      resetTokenExpiry: { $gt: Date.now() }, // Ensure token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password (will be handled by pre-save hook)
    user.pword = newPassword;
    user.resetToken = null; // Clear token
    user.resetTokenExpiry = null; // Clear expiry
    await user.save();

    console.log("Reset Token:", token);
    console.log("User Found:", user);

    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Protect Middleware Function
const protect = async (req, res, next) => {
  let token;

  console.log(req.headers.authorization)

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user to the request object
      req.user = await User.findById(decoded.id).select("-pword");

      next(); // Proceed to the next middleware/controller
    } catch (err) {
      console.error("Authorization error:", err);
      res.status(401).json({ message: "Not authorized, token failed." });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token provided." });
  }
};

// Function to get all users and count them
const getAllUsersAndCount = async (req, res) => {
  try {
    // Retrieve all users
    const users = await User.find();

    // Count the total number of users
    const totalUsers = await User.countDocuments();

    // Return the users and total count as the response
    res.status(200).json({
      totalUsers,
      users,
    });
  } catch (err) {
    // Handle any errors
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  activateAccount,
  requestPasswordReset,
  resetPassword,
  protect,
  getAllUsersAndCount,
};
