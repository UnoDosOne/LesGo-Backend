const mongoose = require("mongoose");

const UserCreateSchema = new mongoose.Schema(
  {
    schoolID: {
      type: String,
      required: true,
      unique: true,
    },
    fName: {
      type: String,
      required: true,
    },
    lName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    pword: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ["admin", "registrar"],
      required: true,
    },
    activationToken: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: false, // Account is inactive by default until activated
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
  },
  {
    collection: "Users",
  }
);

const UserCreate = mongoose.model("UserCreate", UserCreateSchema);

module.exports = UserCreate;
