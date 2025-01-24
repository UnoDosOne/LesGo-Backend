const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
  {
    studentID: {
      type: String,
      required: true,
    },
    firstname: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    collection: 'Record', // Collection name
  }
);

module.exports = mongoose.model('Record', recordSchema);

