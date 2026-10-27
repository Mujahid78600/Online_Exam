const User = require('../models/User');
const InstructorProfile = require('../models/InstructorProfile');
const StudentProfile = require('../models/StudentProfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_exam_key_12345', { expiresIn: '7d' });
};

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, ...extraFields } = req.body;
    
    let userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Admin default active, Instructor & Student pending approval
    const status = role === 'admin' ? 'active' : 'pending';

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status
    });

    if (role === 'instructor') {
      await InstructorProfile.create({
        user_id: user._id,
        cnic: extraFields.cnic,
        phone: extraFields.phone,
        address: extraFields.address,
        specialization: extraFields.specialization,
        date_of_birth: extraFields.date_of_birth
      });
    } else if (role === 'student') {
      await StudentProfile.create({
        user_id: user._id,
        cnic: extraFields.cnic,
        department: extraFields.department,
        class: extraFields.class,
        previous_degree: extraFields.previous_degree,
        previous_grade: extraFields.previous_grade,
        date_of_birth: extraFields.date_of_birth
      });
    }

    res.status(201).json({
      message: role === 'admin' ? 'Admin registered successfully' : 'Registration successful! Waiting for Admin Approval.',
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        status: user.status,
        image: user.image || user.profile_image || '' 
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login (ADDED IMAGE FIELD TO PREVENT LOSS ON RE-LOGIN)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status !== 'active') {
      return res.status(403).json({ message: `Your account status is ${user.status}. Please contact Admin.` });
    }

    // Profile image field included guarantees persistence across logins
    res.json({
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        status: user.status,
        image: user.image || user.profile_image || '' // <-- ESSENTIAL FIX
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};