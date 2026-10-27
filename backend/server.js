const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static uploads directory for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/extra', require('./routes/extraRoutes'));

// Default Admin Pre-seeding
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        name: 'System Admin',
        email: 'admin@exam.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      console.log('Default Admin Account Created: admin@exam.com / admin123');
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};
seedAdmin();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});