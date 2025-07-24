import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        aud: string;
        role?: string;
      };
      supabaseAuth?: any; // Authenticated Supabase client
    }
  }
}

// Middleware to verify Supabase JWT token
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 AUTH MIDDLEWARE - Path:', req.path);
    console.log('🔐 AUTH MIDDLEWARE - Headers:', req.headers.authorization ? 'Has Auth Header' : 'No Auth Header');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 AUTH ERROR: Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔐 AUTH MIDDLEWARE - Token length:', token ? token.length : 0);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('🔐 AUTH ERROR: Token verification failed:', error?.message || 'No user found');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.log('🔐 AUTH SUCCESS: User verified:', user.id);

    // Add user information to request object
    req.user = {
      id: user.id,
      email: user.email || '',
      aud: user.aud,
      role: user.role,
    };

    // Create authenticated Supabase client with the user's token
    const { createClient } = require('@supabase/supabase-js');
    req.supabaseAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      }
    );

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware to verify user owns the resource (for profile updates, etc.)
export const verifyResourceOwnership = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🔒 OWNERSHIP CHECK - Path:', req.path);
    console.log('🔒 OWNERSHIP CHECK - User ID param:', userIdParam);
    console.log('🔒 OWNERSHIP CHECK - Params:', req.params);
    
    const resourceUserId = req.params[userIdParam];
    const authenticatedUserId = req.user?.id;

    console.log('🔒 OWNERSHIP CHECK - Resource User ID:', resourceUserId);
    console.log('🔒 OWNERSHIP CHECK - Authenticated User ID:', authenticatedUserId);

    if (!authenticatedUserId) {
      console.log('🔒 OWNERSHIP ERROR: No authenticated user');
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (resourceUserId !== authenticatedUserId) {
      console.log('🔒 OWNERSHIP ERROR: User ID mismatch');
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }

    console.log('🔒 OWNERSHIP SUCCESS: User owns resource');
    next();
  };
};

// Middleware to verify user is match creator (for match updates/deletions)
export const verifyMatchCreator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matchId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user created the match
    const { data: match, error } = await supabase
      .from('matches')
      .select('created_by')
      .eq('id', matchId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.created_by !== userId) {
      return res.status(403).json({ error: 'Access denied: only match creator can perform this action' });
    }

    next();
  } catch (error) {
    console.error('Match creator verification error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Middleware for optional authentication (user can be authenticated or not)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No authentication provided, continue without user info
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email || '',
        aud: user.aud,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    // If there's an error with optional auth, just continue without user
    next();
  }
};

// Admin-only middleware (using service role)
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token using admin client
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has admin role (you can customize this logic)
    if (user.app_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      aud: user.aud,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({ error: 'Admin authentication failed' });
  }
};