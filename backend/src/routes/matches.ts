/**
 * Match Routes
 * 
 * This module defines all HTTP routes for match-related operations in the Sports Buddy application.
 * Includes endpoints for viewing, creating, updating, joining, and leaving sports matches.
 * 
 * Route Organization:
 * - Public routes: Can be accessed without authentication (with optional user context)
 * - Protected routes: Require JWT authentication
 * - Creator-only routes: Require user to be the match creator
 * 
 * Security Features:
 * - Rate limiting on search and creation endpoints
 * - JWT authentication middleware
 * - Creator verification for sensitive operations
 * - Optional authentication for enhanced functionality
 * 
 * Route Order Important:
 * - Specific routes (/user) must come before parameterized routes (/:id)
 * - This ensures proper route matching by Express
 */

import { Router } from 'express';
import { 
  getMatches, 
  getMatch, 
  createMatch, 
  updateMatch, 
  joinMatch, 
  leaveMatch,
  getUserMatches,
  inviteToMatch,
  respondToInvitation
} from '../controllers/matchController';
import { authenticateUser, verifyMatchCreator, optionalAuth } from '../middleware/auth';
import { matchCreationRateLimit, searchRateLimit } from '../middleware/security';

const router = Router();

/**
 * Public/Optional Authentication Routes
 * These routes can be accessed without authentication but provide enhanced functionality
 * when user context is available.
 */

// GET /api/matches - List/search matches with optional location filtering
router.get('/', searchRateLimit, optionalAuth, getMatches);

/**
 * Protected Routes - Authentication Required
 * These routes require a valid JWT token in the Authorization header.
 */

// GET /api/matches/user - Get user's created and participated matches
// NOTE: This route must come before /:id to avoid conflicts
router.get('/user', authenticateUser, getUserMatches);

// GET /api/matches/:id - Get specific match details
router.get('/:id', optionalAuth, getMatch);

// POST /api/matches - Create new match (with rate limiting)
router.post('/', matchCreationRateLimit, authenticateUser, createMatch);

// PUT /api/matches/:id - Update match (creator only)
router.put('/:id', authenticateUser, verifyMatchCreator, updateMatch);

// POST /api/matches/:id/join - Join a match
router.post('/:id/join', authenticateUser, joinMatch);

// POST /api/matches/:id/leave - Leave a match
router.post('/:id/leave', authenticateUser, leaveMatch);

// POST /api/matches/:id/invite - Invite user to match (creator only)
router.post('/:id/invite', authenticateUser, verifyMatchCreator, inviteToMatch);

// POST /api/matches/:id/respond - Respond to match invitation
router.post('/:id/respond', authenticateUser, respondToInvitation);

export default router;