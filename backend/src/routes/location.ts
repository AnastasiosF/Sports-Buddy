import { Router } from 'express';
import { 
  findNearbyUsers, 
  findNearbyMatches, 
  updateUserLocation, 
  getPopularAreas 
} from '../controllers/locationController';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { searchRateLimit } from '../middleware/security';

const router = Router();

// Public/optional auth routes
router.get('/nearby/users', searchRateLimit, optionalAuth, findNearbyUsers);
router.get('/nearby/matches', searchRateLimit, optionalAuth, findNearbyMatches);
router.get('/popular-areas', searchRateLimit, getPopularAreas);

// Protected routes requiring authentication
router.put('/update', authenticateUser, updateUserLocation);

export default router;