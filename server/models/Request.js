const mongoose = require("mongoose");
const { number } = require("yup");

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
  client: { type: String, required: true },
  documentType: { type: String, required: true },
  expectedDuration: { type: String, default: "Unknown Duration" },
  purpose: { type: String, required: true },
  graduationDate: { type: Date, required: true },
  semester: { type: String, required: true },
  requestedCredentials: { type: String, required: true },
  documentRequested: { type: String },
  requestedDate: { type: Date, required: true },
  phoneNumber: { type: String, required: true },
  clearanceStatus: { type: String, required: true },
  clearanceFile: { type: String },
  proofOfPayment: { type: String }, // Add this field if it's not already present
  authorizationLetter: { type: String },
  authorizingPersonID: { type: String },
  authorizedPersonID: { type: String },
  requestStatus: { type: String, default: "Pending" },
  clearedAt: {type: Date, default: "" },
  queuedAt: {type: Date, default: "" },
}, {
  timestamps: true,
  collection: 'Request',
});

// Middleware to set `expectedDuration` based on `documentType`
requestSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('documentType')) {
    // Mapping document types to their expected durations
    const documentDurations = {
      "Authentication": "2 weeks",
      "CAV (Certification Authentication & Verification)": "4 weeks",
      "Correction of Name": "1 week",
      "Diploma Replacement": "3 weeks",
      "Evaluation": "1 day",
      "Permit to study": "2 days",
      "Rush Fee": "3 days",
      "SF 10 ( Form 137 )": "4 days",
      "Transcript of Records": "5 days",
      "Honorable Dismissal": "6 days",
      "Others": "Varies"
    };


    // Set the `expectedDuration` based on the `documentType` or use a fallback
    this.expectedDuration = documentDurations[this.documentType] || 'Unknown duration';
  }
  next();
});

module.exports = mongoose.model("Request", requestSchema);
