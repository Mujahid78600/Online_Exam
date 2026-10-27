const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['MCQS', 'True/False', 'Short Question', 'Long Question'], required: true },
  difficulty_level: { type: String, enum: ['Easy', 'Moderate', 'Difficult'], default: 'Easy' },
  options: {
    option_a: { type: String, default: '' },
    option_b: { type: String, default: '' },
    option_c: { type: String, default: '' },
    option_d: { type: String, default: '' }
  },
  correct_answer: { type: String, default: '' },
  total_marks: { type: Number, required: true },
  time_for_question: { type: Number, required: true } // in seconds
}, { timestamps: true });

module.exports = mongoose.model('QuestionBank', questionBankSchema);