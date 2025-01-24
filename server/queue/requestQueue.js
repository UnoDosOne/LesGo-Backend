// queue/requestQueue.js
const mongoose = require('mongoose');

const requestQueueSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
  documentType: { type: String, required: true },
  expectedDate: { type: Date, required: true }, // Date when the request should be processed
  status: { type: String, default: 'Pending' }, // Status of the request (e.g., "Pending", "In Progress")
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' }, // Link to the request model if needed
  createdAt: { type: Date, default: Date.now }, // Automatically sets the creation date
});

const RequestQueue = mongoose.model('RequestQueue', requestQueueSchema);

module.exports = RequestQueue;

// WALA PANI NA INTEGRATE