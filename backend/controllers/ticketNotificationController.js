const SupportTicket = require('../models/Ticket');
const Notification = require('../models/Notification');
const User = require('../models/User');
const InstructorProfile = require('../models/InstructorProfile');
const StudentProfile = require('../models/StudentProfile'); // <-- STUDENT PROFILE MODEL IMPORTED
const StudentExam = require('../models/StudentExam');
const bcrypt = require('bcryptjs');

// --- SUPPORT TICKETS ---
exports.createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const ticket = await SupportTicket.create({
      student_id: req.user._id,
      subject,
      message
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student_id = req.user._id;
    }
    const tickets = await SupportTicket.find(query).populate('student_id', 'name email');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- NOTIFICATIONS ---
exports.createNotification = async (req, res) => {
  try {
    const { recipient_id, message } = req.body;
    const notification = await Notification.create({
      recipient_id,
      message
    });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- PROFILE MANAGEMENT (SUPPORTS BOTH STUDENT & INSTRUCTOR) ---
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = null;

    if (user.role === 'instructor') {
      profile = await InstructorProfile.findOne({ user_id: req.user._id });
    } else if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user_id: req.user._id }); // <-- FETCH STUDENT PROFILE
    }

    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, password, date_of_birth, cnic, phone, address, specialization, department, class: className } = req.body;
    
    let updateFields = {};

    if (name) updateFields.name = name;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      updateFields.image = normalizedPath;
    }

    // Direct User Document update
    const updatedUserDoc = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    let profile = null;
    if (req.user.role === 'instructor') {
      profile = await InstructorProfile.findOneAndUpdate(
        { user_id: req.user._id },
        { date_of_birth, cnic, phone, address, specialization },
        { new: true, upsert: true }
      );
    } else if (req.user.role === 'student') {
      // <-- HANDLE STUDENT PROFILE UPDATE PROPERLY
      profile = await StudentProfile.findOneAndUpdate(
        { user_id: req.user._id },
        { date_of_birth, cnic, phone, address, department, class: className },
        { new: true, upsert: true }
      );
    }

    res.json({ 
      message: 'Profile and image updated successfully!', 
      user: updatedUserDoc, 
      profile 
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: err.message });
  }
};

// --- RESULTS & EVALUATIONS ---
exports.getStudentResults = async (req, res) => {
  try {
    const results = await StudentExam.find({ student_id: req.user._id })
      .populate('exam_schedule_id')
      .populate('answers.question_id');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmittedExams = async (req, res) => {
  try {
    const submitted = await StudentExam.find()
      .populate('student_id', 'name email')
      .populate('exam_schedule_id', 'exam_name passing_marks')
      .populate('answers.question_id');
    res.json(submitted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};