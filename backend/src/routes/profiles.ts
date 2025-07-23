import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  searchProfiles,
  addUserSport,
  removeUserSport,
  setupProfile
} from '../controllers/profileController';
import { authenticateUser, verifyResourceOwnership, optionalAuth } from '../middleware/auth';
import { searchRateLimit } from '../middleware/security';

const router = Router();

// Public/optional auth routes
router.get('/search', searchRateLimit, optionalAuth, searchProfiles);
router.get('/:id', optionalAuth, getProfile);

// Protected routes requiring authentication
router.put('/:id', authenticateUser, verifyResourceOwnership('id'), updateProfile);
router.post('/setup', authenticateUser, setupProfile);
router.post('/sports', authenticateUser, addUserSport);
router.delete('/sports/:sport_id', authenticateUser, removeUserSport);

export default router;
