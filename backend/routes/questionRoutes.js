const express = require('express');
const router = express.Router();
const { addQuestion, getQuestions, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.route('/')
  .post(authorize('instructor'), addQuestion)
  .get(authorize('instructor'), getQuestions);

router.route('/:id')
  .put(authorize('instructor'), updateQuestion)
  .delete(authorize('instructor'), deleteQuestion);

module.exports = router;