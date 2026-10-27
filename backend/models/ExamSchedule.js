const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam_name: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  passing_marks: { type: Number, required: true },
  assigned_students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);