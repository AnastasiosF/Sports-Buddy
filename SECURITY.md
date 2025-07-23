# Security Implementation Guide

This document outlines the comprehensive security features implemented in the Sports Buddy App.

## 🔐 Authentication & Authorization

### Supabase JWT Authentication
- **JWT Token Verification**: All protected routes verify Supabase JWT tokens
- **User Context**: Authenticated user information is available in `req.user`
- **Token Extraction**: Bearer tokens extracted from Authorization headers
- **Session Management**: Automatic token refresh handled by Supabase client

### Authentication Middleware

#### `authenticateUser`
- Requires valid JWT token for access
- Used on all protected endpoints
- Adds user information to request object

#### `verifyResourceOwnership`
- Ensures users can only access/modify their own resources
- Used for profile updates and user-specific operations

#### `verifyMatchCreator`
- Ensures only match creators can modify their matches
- Database-level verification for additional security

#### `optionalAuth`
- Allows both authenticated and anonymous access
- Used for public content that benefits from user context

## 🛡️ DDoS Protection & Rate Limiting

### Multi-Layer Rate Limiting

#### General API Rate Limiting
- **Limit**: 1000 requests per 15 minutes per IP
- **Purpose**: Prevents general API abuse
- **Headers**: Returns rate limit info in standard headers

#### Authentication Rate Limiting
- **Limit**: 10 requests per 15 minutes per IP
- **Purpose**: Prevents brute force attacks on auth endpoints
- **Skip Success**: Only failed attempts count toward limit

#### Match Creation Rate Limiting
- **Limit**: 20 matches per hour per IP
- **Purpose**: Prevents match spam and resource exhaustion

#### Message Rate Limiting
- **Limit**: 30 messages per minute per IP
- **Purpose**: Prevents message spam and chat abuse

#### Search Rate Limiting
- **Limit**: 60 searches per minute per IP
- **Purpose**: Protects resource-intensive search operations

### Progressive Speed Limiting
- **Delay After**: 50 requests without delay
- **Progressive Delay**: 500ms per request after threshold
- **Maximum Delay**: 10 seconds
- **Window**: 15 minutes

### DDoS Protection
- **Emergency Rate Limit**: 100 requests per minute
- **Attack Detection**: Logs suspicious activity
- **Automatic Blocking**: Temporary IP blocking for excessive requests

## 🔒 Application Security

### Helmet Security Headers
- **Content Security Policy**: Prevents XSS attacks
- **HSTS**: Enforces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing

### CORS Configuration
- **Origin Whitelist**: Only allowed origins can access API
- **Credentials**: Supports authenticated requests
- **Methods**: Limited to necessary HTTP methods
- **Headers**: Restricted to required headers

### Request Security
- **Size Limits**: 10MB maximum request body size
- **JSON Limits**: Prevents JSON bomb attacks
- **Trust Proxy**: Proper IP detection behind reverse proxies

## 🔧 Advanced Security Features

### Brute Force Protection
```typescript
const bruteForceProtection = createBruteForceProtection();

// Usage example
const result = bruteForceProtection(userEmail, 5, 15 * 60 * 1000);
if (result.blocked) {
  // Handle blocked user
}
```

### IP Whitelisting (Admin Endpoints)
```typescript
const adminIPs = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
router.use('/admin', ipWhitelist(adminIPs));
```

### Emergency Rate Limiting
- Activated during suspected attacks
- 10 requests per minute limit
- Logs all emergency activations

## 📊 Security Monitoring

### Logging & Monitoring
- **Error Logging**: All security events logged with context
- **IP Tracking**: Suspicious IP addresses tracked
- **Attack Detection**: Automatic logging of potential attacks
- **Health Monitoring**: Security status in health checks

### Error Handling
- **Safe Error Messages**: No internal information leaked
- **Stack Traces**: Only in development environment
- **Consistent Responses**: Standardized error format
- **Security Headers**: Added to all error responses

## 🚨 Security Best Practices

### Environment Variables
```bash
# Required security configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# CORS and origins
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Admin security
ADMIN_IP_WHITELIST=123.456.789.0,987.654.321.0

# Environment
NODE_ENV=production
```

### Production Deployment
1. **Environment Variables**: Set all required environment variables
2. **HTTPS Only**: Force HTTPS in production
3. **Rate Limits**: Adjust rate limits based on expected traffic
4. **Monitoring**: Set up logging and monitoring
5. **IP Whitelisting**: Configure admin IP restrictions

### Database Security (Supabase)
- **Row Level Security**: Enabled on all tables
- **Policies**: Granular access control policies
- **Service Role**: Used only for admin operations
- **Anon Key**: Used for public operations only

## 🔍 Security Testing

### Rate Limit Testing
```bash
# Test general rate limit
for i in {1..1010}; do curl -s http://localhost:3000/health; done

# Test auth rate limit
for i in {1..15}; do curl -s -X POST http://localhost:3000/api/auth/signin; done
```

### Authentication Testing
```bash
# Test protected endpoint without token
curl -X GET http://localhost:3000/api/profiles/123

# Test with invalid token
curl -X GET -H "Authorization: Bearer invalid" http://localhost:3000/api/profiles/123
```

## 🚀 Performance Impact

### Rate Limiting Overhead
- **Memory Usage**: In-memory store for rate limits
- **CPU Impact**: Minimal per-request processing
- **Network**: Additional headers in responses

### Optimization
- **Redis Integration**: For distributed rate limiting (future)
- **Database Connection Pooling**: Efficient database usage
- **Caching**: JWT verification caching (implemented by Supabase)

## 📋 Security Checklist

### Deployment Security
- [ ] Environment variables configured
- [ ] HTTPS enforced
- [ ] Rate limits appropriate for traffic
- [ ] CORS origins restricted to production domains
- [ ] Admin IP whitelist configured
- [ ] Monitoring and logging enabled
- [ ] Error messages sanitized for production

### Code Security
- [ ] All sensitive endpoints protected with authentication
- [ ] Resource ownership verified
- [ ] Input validation implemented
- [ ] SQL injection prevention (via Supabase)
- [ ] XSS prevention (via Helmet)
- [ ] Rate limiting on all public endpoints

This security implementation provides enterprise-level protection while maintaining good performance and developer experience.