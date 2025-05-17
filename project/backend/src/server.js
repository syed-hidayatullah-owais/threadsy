import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import imageRoutes from './routes/image.routes';
import recommendationRoutes from './routes/recommendation.routes';
import { initSocketIO } from './services/socket.service';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocketIO(server);

// Middleware
app.use(cors({
  origin: ['http://localhost:8082', 'http://localhost:8081', 'http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - for serving uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/threadsy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    // Fail gracefully - exit if we can't connect to MongoDB
    process.exit(1);
  });

// Routes
app.use('/api/vision', imageRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
