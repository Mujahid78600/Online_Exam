const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assigned_to_role: { type: String, enum: ['admin', 'instructor'], required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);