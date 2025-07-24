import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  searchProfiles,
  addUserSport,
  removeUserSport,
  updateUserSports,
  setupProfile
} from '../controllers/profileController';
import { authenticateUser, verifyResourceOwnership, optionalAuth } from '../middleware/auth';
import { searchRateLimit } from '../middleware/security';

const router = Router();

// Public/optional auth routes
router.get('/search', searchRateLimit, optionalAuth, searchProfiles);

// Protected sports routes (must come before /:id route)
router.post('/sports', authenticateUser, addUserSport);
router.put('/sports', authenticateUser, updateUserSports);
router.delete('/sports/:sport_id', authenticateUser, removeUserSport);

// Protected routes requiring authentication
router.post('/setup', authenticateUser, setupProfile);
router.put('/:id', authenticateUser, verifyResourceOwnership('id'), updateProfile);

// Generic profile route (must come last)
router.get('/:id', optionalAuth, getProfile);

export default router;
