const mongoose = require('mongoose');

const studentExamSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam_schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSchedule', required: true },
  status: { type: String, enum: ['Pending', 'Submitted', 'Evaluated'], default: 'Submitted' },
  answers: [{
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
    student_answer: { type: String },
    auto_marks_obtained: { type: Number, default: 0 },
    manual_marks_obtained: { type: Number, default: 0 },
    instructor_remarks: { type: String, default: '' }
  }],
  total_score: { type: Number, default: 0 },
  submitted_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StudentExam', studentExamSchema);