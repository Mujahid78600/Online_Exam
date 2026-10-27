const express = require('express');
const router = express.Router();
const { 
  scheduleExam, 
  getExams, 
  addQuestionsToExam, 
  getMappedQuestionsByExam,
  getExamPaper, 
  submitExam, 
  evaluateExam, 
  updateExam, 
  deleteExam 
} = require('../controllers/examController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All exam routes require logged-in users
router.use(protect);

// 1. Exam Schedule Management (Instructor Only)
router.post('/schedule', authorize('instructor'), scheduleExam);
router.put('/schedule/:id', authorize('instructor'), updateExam);
router.delete('/schedule/:id', authorize('instructor'), deleteExam);

// 2. Exam List & Question Mapping (Instructor & Admin)
router.get('/list', getExams);
router.post('/add-questions', authorize('instructor'), addQuestionsToExam);
router.get('/mapped-questions/:examId', authorize('instructor'), getMappedQuestionsByExam);

// 3. Student Paper Attempt & Submission (Student Only)
router.get('/paper/:examId', authorize('student'), getExamPaper);
router.post('/submit', authorize('student'), submitExam);

// 4. Manual Grading & Feedback Evaluation (Instructor Only)
router.post('/evaluate', authorize('instructor'), evaluateExam);

module.exports = router;