const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date_of_birth: { type: Date },
  date_of_joining: { type: Date, default: Date.now },
  cnic: { type: String },
  phone: { type: String },
  address: { type: String },
  file: { type: String },
  specialization: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InstructorProfile', instructorSchema);