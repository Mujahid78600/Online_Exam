const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target_role: { type: String, enum: ['all', 'student', 'instructor', 'both'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);