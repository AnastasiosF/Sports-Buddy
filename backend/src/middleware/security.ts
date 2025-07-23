import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  },
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  },
});

// Rate limiting for match creation (to prevent spam)
export const matchCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 match creations per hour
  message: {
    error: 'Too many matches created from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many matches created from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  },
});

// Rate limiting for message sending
export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  message: {
    error: 'Too many messages sent, please slow down.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many messages sent, please slow down.',
      retryAfter: '1 minute'
    });
  },
});

// Rate limiting for search endpoints (can be resource intensive)
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 search requests per minute
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many search requests, please slow down.',
      retryAfter: '1 minute'
    });
  },
});

// Slow down middleware for repeated requests (progressive delays)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Fixed delay of 500ms per request after delayAfter
  maxDelayMs: 10000, // Maximum delay of 10 seconds
  validate: { delayMs: false }, // Disable the warning message
});

// DDoS protection middleware
export const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute (very generous for normal use)
  message: {
    error: 'Potential DDoS attack detected. Too many requests from this IP.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    console.warn(`Potential DDoS attack from IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      error: 'Potential DDoS attack detected. Too many requests from this IP.',
      retryAfter: '1 minute'
    });
  },
});

// Aggressive rate limiting for suspected attacks
export const emergencyRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Very strict: 10 requests per minute
  message: {
    error: 'Emergency rate limiting activated. Service temporarily restricted.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    console.error(`Emergency rate limit triggered for IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      error: 'Emergency rate limiting activated. Service temporarily restricted.',
      retryAfter: '1 minute'
    });
  },
});

// Request size limiting middleware
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    const maxSizeBytes = parseInt(maxSize.replace('mb', '')) * 1024 * 1024;

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return res.status(413).json({
        error: `Request body too large. Maximum size is ${maxSize}.`
      });
    }

    next();
  };
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!allowedIPs.includes(clientIP!)) {
      return res.status(403).json({
        error: 'Access denied: IP not whitelisted'
      });
    }

    next();
  };
};

// Brute force protection for specific user accounts
export const createBruteForceProtection = () => {
  const attempts = new Map<string, { count: number; lastAttempt: Date }>();

  return (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
    const now = new Date();
    const userAttempts = attempts.get(identifier);

    if (userAttempts) {
      // Reset counter if window has passed
      if (now.getTime() - userAttempts.lastAttempt.getTime() > windowMs) {
        attempts.delete(identifier);
        return { blocked: false, remainingAttempts: maxAttempts };
      }

      if (userAttempts.count >= maxAttempts) {
        return {
          blocked: true,
          remainingAttempts: 0,
          retryAfter: new Date(userAttempts.lastAttempt.getTime() + windowMs)
        };
      }

      userAttempts.count += 1;
      userAttempts.lastAttempt = now;
      return {
        blocked: false,
        remainingAttempts: maxAttempts - userAttempts.count
      };
    }

    attempts.set(identifier, { count: 1, lastAttempt: now });
    return { blocked: false, remainingAttempts: maxAttempts - 1 };
  };
};
