import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB } from './data/db.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Setup persistence layers:
// 1. JSON file/in-memory cache for fast local access and offline fallback
// 2. MongoDB connection if a Mongo server is running (with auto-seeding)
initDB();
connectDB();

// Allow browser clients to call the API.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON payloads in request bodies
app.use(express.json());

// API route registrations
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/assistant', assistantRoutes);

/**
 * Health check endpoint
 * Useful for monitoring, uptime checks, and verifying that the backend is live.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YouTube Clone API Backend is running smoothly',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 Handler for undefined API routes
 */
app.use((req, res) => {
  res.status(404).json({
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

/**
 * Global error handling middleware
 * Catches any unhandled errors thrown inside route handlers and sends a clean response.
 */
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  res.status(500).json({
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start listening for incoming HTTP requests
app.listen(PORT, '0.0.0.0', () => {
  console.log(`YouTube Clone Backend Server is running on http://localhost:${PORT}`);
});
