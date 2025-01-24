const mongoose = require("mongoose");

const NotifSchema = new mongoose.Schema({
  message: { type: String, required: true },
  formType: { type: String, required: true },
  type: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  read: { type: Boolean, default: false},
  backup_id: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Export the model asd
module.exports = mongoose.model("Notification", NotifSchema);
