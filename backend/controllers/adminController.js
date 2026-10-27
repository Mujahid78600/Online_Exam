const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// 1. Get All System Users (Admin View)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Update User Status (Active / Inactive)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'inactive'
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Get Active Students With Profile Data (Department & Class for Instructor Assignment)
exports.getActiveStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'active' }).select('-password').lean();

    const studentsWithProfiles = await Promise.all(students.map(async (st) => {
      // Find StudentProfile handling both String and ObjectId formats securely
      const profile = await StudentProfile.findOne({ user_id: st._id.toString() }) || 
                      await StudentProfile.findOne({ user_id: st._id });
      
      return {
        ...st,
        department: profile && profile.department ? profile.department : '',
        class: profile && profile.class ? profile.class : '',
        cnic: profile && profile.cnic ? profile.cnic : '',
        phone: profile && profile.phone ? profile.phone : ''
      };
    }));

    res.json(studentsWithProfiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};