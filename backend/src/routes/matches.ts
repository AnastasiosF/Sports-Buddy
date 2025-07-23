import { Router } from 'express';
import { 
  getMatches, 
  getMatch, 
  createMatch, 
  updateMatch, 
  joinMatch, 
  leaveMatch 
} from '../controllers/matchController';
import { authenticateUser, verifyMatchCreator, optionalAuth } from '../middleware/auth';
import { matchCreationRateLimit, searchRateLimit } from '../middleware/security';

const router = Router();

// Public/optional auth routes
router.get('/', searchRateLimit, optionalAuth, getMatches);
router.get('/:id', optionalAuth, getMatch);

// Protected routes requiring authentication
router.post('/', matchCreationRateLimit, authenticateUser, createMatch);
router.put('/:id', authenticateUser, verifyMatchCreator, updateMatch);
router.post('/:id/join', authenticateUser, joinMatch);
router.post('/:id/leave', authenticateUser, leaveMatch);

export default router;