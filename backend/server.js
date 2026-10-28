
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// MongoDB connection status
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');

  res.json({
    backend: 'Running',
    database:
      mongoose.connection.readyState === 1
        ? 'Connected'
        : 'Disconnected',
    databaseName: mongoose.connection.name || null
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/extra', require('./routes/extraRoutes'));

// Default Admin Seeding
const seedAdmin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({
      role: 'admin'
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(
        'admin123',
        10
      );

      await User.create({
        name: 'System Admin',
        email: 'admin@exam.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });

      console.log('Default Admin Account Created');
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

// Vercel serverless export
module.exports = app;
