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

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already exists. Please use another one." });
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(pword, 10);
    console.log("Original Password:", pword);
    console.log("Hashed Password:", hashedPassword);

    // Create a new user
    const newUser = new User({
      schoolID,
      fName,
      email,
      pword: hashedPassword,
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

    // Safeguard against overwriting the password
    console.log("User Before Activation Save:", user);
    user.isActive = true;
    user.activationToken = undefined;
    user.tokenExpiry = undefined;
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

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    console.log("Fetched User from DB:", user);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Authentication failed. User not found." });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account not activated. Please activate your account.",
      });
    }

    console.log("Provided Password:", password);
    console.log("Stored Hashed Password:", user.pword);

    const isMatch = await bcrypt.compare(password, user.pword);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Authentication failed. Incorrect password." });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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

const protect = async (req, res, next) => {
  let token;

  // Check if the authorization header starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from 'Bearer <token>'
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

module.exports = {
  registerUser,
  loginUser,
  activateAccount,
  protect,
};

module.exports = { protect };
