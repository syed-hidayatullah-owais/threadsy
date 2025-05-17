import multer from 'multer';
import { bucket } from '../config/firebase.js';
import sharp from 'sharp';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

export const processAndUploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Process image with sharp
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Firebase Storage
    const fileName = `wardrobe/${req.user.id}/${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    await file.save(processedImageBuffer, {
      metadata: {
        contentType: 'image/jpeg'
      }
    });

    // Make the file public and get URL
    await file.makePublic();
    req.fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    next();
  } catch (error) {
    next(error);
  }
};