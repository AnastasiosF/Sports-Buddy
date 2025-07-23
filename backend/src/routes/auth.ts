import { Router } from 'express';
import { signUp, signIn, signOut, verifyEmail } from '../controllers/authController';
import { refreshToken } from '../controllers/tokenController';
import { authRateLimit } from '../middleware/security';

const router = Router();

router.post('/signup', authRateLimit, signUp);
router.post('/signin', authRateLimit, signIn);
router.post('/signout', signOut);
router.post('/verify-email', authRateLimit, verifyEmail);
router.post('/refresh', authRateLimit, refreshToken);

export default router;