require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize');

// const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const { errorHandler, notFound } = require('./src/middlewares/errorMiddleware');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const userRoutes = require('./src/routes/userRoutes');
const scanRoutes = require('./src/routes/scanRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const institutionRoutes = require('./src/routes/institutionRoutes');
const supportRoutes = require('./src/routes/supportRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

const app = express();
const server = http.createServer(app);

// Init Socket.io
initSocket(server);

// Connect to MongoDB
// const connectDB = require('./src/config/db');
// connectDB();

// Security Middlewares
app.use(helmet());
// app.use(mongoSanitize());
app.use(cors({
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'production') {
      const allowed = process.env.CLIENT_URL || '';
      if (!origin || origin === allowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, origin || true);
    }
  },
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 10000, // lenient limit in development
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Library API is running', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payments', paymentRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
