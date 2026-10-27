const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { 
  createTicket, 
  getTickets, 
  updateTicketStatus,
  createNotification, 
  getNotifications, 
  getProfile, 
  updateProfile,
  getStudentResults, 
  getSubmittedExams 
} = require('../controllers/ticketNotificationController');
const { getActiveStudents } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All extra routes require authentication
router.use(protect);

// 1. Active Students List for Instructors
router.get('/students/active', authorize('instructor', 'admin'), getActiveStudents);

// 2. Support Tickets Routes
router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.put('/tickets/:id', authorize('instructor', 'admin'), updateTicketStatus);

// 3. Notifications Routes
router.post('/notifications', authorize('admin', 'instructor'), createNotification);
router.get('/notifications', getNotifications);

// 4. User Profile & Avatar Image Upload Route
router.get('/profile', getProfile);
router.put('/profile', upload.single('profile_image'), updateProfile);

// 5. Exam Submissions & Results
router.get('/results/student', authorize('student'), getStudentResults);
router.get('/results/submitted', authorize('instructor', 'admin'), getSubmittedExams);

module.exports = router;