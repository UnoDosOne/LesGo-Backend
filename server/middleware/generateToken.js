const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT secret is not defined in environment variables");
  }

  return jwt.sign(
    {
      id: user._id,
      userType: user.userType,
    },
    secret,
    { expiresIn: '1h' }
  );
};

module.exports = generateToken;