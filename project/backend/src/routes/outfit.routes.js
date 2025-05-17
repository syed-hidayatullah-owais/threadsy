import express from 'express';
import {
  createOutfit,
  getOutfits,
  getOutfitById,
  updateOutfit,
  deleteOutfit,
  likeOutfit,
  unlikeOutfit,
  generateOutfit
} from '../controllers/outfit.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createOutfit);
router.get('/', getOutfits);
router.get('/:id', getOutfitById);
router.put('/:id', updateOutfit);
router.delete('/:id', deleteOutfit);
router.post('/:id/like', likeOutfit);
router.delete('/:id/like', unlikeOutfit);
router.post('/generate', generateOutfit);

export default router;