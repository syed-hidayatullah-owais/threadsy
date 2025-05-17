import express from 'express';
import multer from 'multer';
import { analyzeClothingImage } from '../services/vision.service';
import { removeBackground } from '../services/mediapipe.service';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

const upload = multer({ storage });

/**
 * Endpoint to analyze a clothing image with Google Cloud Vision API
 * POST /vision/analyze
 */
router.post('/vision/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imagePath = req.file.path;
    const results = await analyzeClothingImage(imagePath);
    
    res.json(results);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

/**
 * Endpoint to remove background from a clothing image
 * POST /mediapipe/remove-background
 */
router.post('/mediapipe/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imagePath = req.file.path;
    
    // Read the file as a buffer
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Process the image with MediaPipe
    const processedImagePath = await removeBackground(imageBuffer);
    
    // In a production environment, we would upload to Firebase Storage and return the URL
    // For now, we'll construct a URL to the local file
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const relativePath = path.relative(path.join(__dirname, '..', '..'), processedImagePath);
    const imageUrl = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error removing background:', error);
    res.status(500).json({ error: 'Failed to remove background from image' });
  }
});

export default router;
