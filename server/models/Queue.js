const mongoose = require("mongoose");
const mongooseSequence = require("mongoose-sequence")(mongoose);

const QueueSchema = new mongoose.Schema(
  {
    studentID: {
      type: String,
      required: true,
    },
    date_appointed: { type: Date, required: true },
    amPm: { type: String, enum: ["AM", "PM"], required: true },
    course: { type: String, required: true },
    firstname: { type: String, required: true },
    in_queue: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    tokenNumber: { type: Number, default: null },
    documentType: { type: String },
  },
  {
    timestamps: true,
    collection: "Queues",
  }
);

// Use mongoose-sequence for an auto-incrementing counter field
QueueSchema.plugin(mongooseSequence, { inc_field: "counter" });

// Export the model
module.exports = mongoose.model("Queue", QueueSchema);
