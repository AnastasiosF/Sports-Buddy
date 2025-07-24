import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import sportsRoutes from './routes/sports';
import matchRoutes from './routes/matches';
import locationRoutes from './routes/location';
import friendsRoutes from './routes/friends';

// Import security middleware
import { generalRateLimit } from './middleware/security';

// Import error handling middleware
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Trust proxy (important for rate limiting with reverse proxies)
app.set('trust proxy', 1);

// Basic security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Basic rate limiting only (removing problematic middleware temporarily)
app.use(generalRateLimit);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  if (req.path.includes('/profiles/sports') || req.path.includes('/friends/request')) {
    console.log('🔍 REQUEST:', req.method, req.path);
    console.log('🔍 HEADERS:', req.headers.authorization ? 'Has Auth Header' : 'No Auth Header');
    console.log('🔍 CONTENT-TYPE:', req.headers['content-type']);
    console.log('🔍 BODY:', req.body);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/friends', friendsRoutes);

// Error handling middleware (must be after all routes)
// Note: Temporarily disabled wildcard route due to path-to-regexp compatibility issue
// app.all('*', notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔒 Security features: Rate limiting, Authentication`);
});

export default app;
