const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables

const connectDB = () => {
  const dbURI = process.env.MONGO_URI;

  if (!dbURI) {
    throw new Error("MongoDB URI is not defined in environment variables");
  }

  mongoose
    .connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("Error connecting to MongoDB:", err));
};

module.exports = connectDB;