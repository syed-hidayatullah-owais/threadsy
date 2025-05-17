import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/search', searchUsers);

export default router;