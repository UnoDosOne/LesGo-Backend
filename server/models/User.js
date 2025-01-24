const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      unique: true,
    },
    pword: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
    
      
    },
    course: {
      type: String,
      
      
    },
    acadYear: {
      type: String,
      
    },
    userType: {
      type: String,
      enum: ["admin", "registrar", "student"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    activationToken: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
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

// Pre-save hook to hash password only if not already hashed
UserSchema.pre("save", async function (next) {
  if (this.isModified("pword")) {
    const isHashed = this.pword.startsWith("$2a$");
    if (!isHashed) {
      this.pword = await bcrypt.hash(this.pword, 10);
    }
  }
  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
