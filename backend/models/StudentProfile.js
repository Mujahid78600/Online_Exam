const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date_of_birth: { type: Date },
  date_of_joining: { type: Date, default: Date.now },
  phone: { type: String },
  cnic: { type: String },
  department: { type: String },
  class: { type: String },
  previous_degree: { type: String },
  previous_grade: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentSchema);