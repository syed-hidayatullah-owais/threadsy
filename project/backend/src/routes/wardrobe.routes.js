import express from 'express';
import {
  addItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  likeItem,
  unlikeItem,
  findSimilarItems, // New controller method
  generateItemEmbeddings // New controller method
} from '../controllers/wardrobe.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload, processAndUploadImage } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('image'), processAndUploadImage, addItem);
router.get('/', getItems);
router.get('/:id', getItemById);
router.put('/:id', upload.single('image'), processAndUploadImage, updateItem);
router.delete('/:id', deleteItem);
router.post('/:id/like', likeItem);
router.delete('/:id/like', unlikeItem);

// New routes for CLIP integration
router.post('/similar', findSimilarItems);
router.post('/generate-embeddings/:id', generateItemEmbeddings);

export default router;