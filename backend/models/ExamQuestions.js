const mongoose = require('mongoose');

const examQuestionsSchema = new mongoose.Schema({
  exam_schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSchedule', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ExamQuestions', examQuestionsSchema);