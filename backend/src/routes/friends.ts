import { Router } from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  searchUsers,
  getFriendSuggestions
} from '../controllers/friendsController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Friend request management
router.post('/request', sendFriendRequest);
router.put('/request/:connection_id/accept', acceptFriendRequest);
router.delete('/request/:connection_id/reject', rejectFriendRequest);

// Friend management
router.get('/', getFriends);
router.delete('/:friend_id', removeFriend);

// Requests
router.get('/requests', getPendingRequests);

// Search users
router.get('/search', searchUsers);

// Friend suggestions
router.get('/suggestions', getFriendSuggestions);

export default router;