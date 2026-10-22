import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';

// Load environment variables
dotenv.config();

// Import route modules
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import expenseRoutes from './routes/expenses.js';
import settlementRoutes from './routes/settlements.js';
import friendRoutes from './routes/friends.js';
import currencyRoutes from './routes/currency.js';

// Import error handler middleware
import { errorHandler } from './middleware/error.js';

const app = express();

// Middleware: CORS configuration
const devAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);
      // Allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
      // Allow Vercel preview and production deployments
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      if (devAllowedOrigins.includes(origin)) return callback(null, true);
      // In development or preview, allow all
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      return callback(null, true); // Allow all web origins for expense sharing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware: Body parsing with 10MB limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware: Automatic Database Connection for Serverless and Local environments
app.use(async (req, res, next) => {
  // Allow health checks to run without blocking on DB if needed
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Database Connection Error]:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to the database. Please verify MONGODB_URI.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    });
  }
});

// Create API Router with all resource endpoints
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Spend-A-Friend backend API is operational',
    timestamp: new Date().toISOString(),
  });
});

// Mount resource routes inside the API router
apiRouter.use('/auth', authRoutes);
apiRouter.use('/groups', groupRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/settlements', settlementRoutes);
apiRouter.use('/friends', friendRoutes);
apiRouter.use('/currency', currencyRoutes);

// Mount router on BOTH '/api' and '/' to guarantee seamless routing on Vercel & local
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch-all route for unhandled API endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl || req.url}`,
  });
});

// Global error handling middleware
app.use(errorHandler);

export default app;
