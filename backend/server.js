
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// Backend status
app.get('/', (req, res) => {
  res.json({
    backend: 'Online Exam Backend Running'
  });
});

// MongoDB health check
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();

    const mongoose = require('mongoose');

    res.status(200).json({
      backend: 'Running',
      database: 'Connected',
      databaseName: mongoose.connection.name
    });
  } catch (error) {
    res.status(503).json({
      backend: 'Running',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Connect database before processing API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/extra', require('./routes/extraRoutes'));

// Vercel serverless export
module.exports = app;
