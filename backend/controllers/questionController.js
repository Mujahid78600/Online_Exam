const QuestionBank = require('../models/QuestionBank');

// Add Question
exports.addQuestion = async (req, res) => {
  try {
    const question = await QuestionBank.create({
      ...req.body,
      instructor_id: req.user._id
    });
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Questions for Logged-in Instructor
exports.getQuestions = async (req, res) => {
  try {
    const questions = await QuestionBank.find({ instructor_id: req.user._id });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Question
exports.updateQuestion = async (req, res) => {
  try {
    const question = await QuestionBank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Question
exports.deleteQuestion = async (req, res) => {
  try {
    await QuestionBank.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};