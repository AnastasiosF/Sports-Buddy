# API-First Architecture Guide

This document outlines the comprehensive API-first architecture implemented in the Sports Buddy App, where the mobile app communicates exclusively with the backend API, and never directly with the database.

## 🏗️ **Architecture Overview**

### **Data Flow Architecture**
```
Mobile App → Backend API → Supabase Database
     ↑           ↑              ↑
   React       Express.js    PostgreSQL
   Native      + JWT Auth    + PostGIS
```

### **Security Benefits**
- **Database Security**: No direct database credentials in mobile app
- **Centralized Authentication**: All auth logic in backend
- **Rate Limiting**: API-level protection against abuse
- **Data Validation**: Server-side validation for all operations
- **Audit Trail**: All database operations logged at API level

## 🔐 **Authentication Flow**

### **JWT Token Management**
```typescript
interface AuthSession {
  access_token: string;      // Short-lived (1 hour)
  refresh_token: string;     // Long-lived (30 days) 
  expires_at: number;        // Token expiration timestamp
  user: {
    id: string;
    email: string;
  };
}
```

### **Token Lifecycle**
1. **Login** → Backend validates credentials → Returns JWT tokens
2. **API Requests** → Mobile sends access_token in Authorization header
3. **Token Expiry** → Mobile automatically refreshes using refresh_token
4. **Refresh Failure** → Mobile clears session and redirects to login

### **Automatic Token Refresh**
```typescript
// API utility automatically handles token refresh
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(url, config);
  
  // Handle token expiration
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry with new token
      return apiRequest(endpoint, options);
    } else {
      // Redirect to login
      await clearSession();
      throw new Error('Authentication expired. Please log in again.');
    }
  }
};
```

## 📱 **Mobile App Services**

### **Service Layer Architecture**
The mobile app uses a service layer that abstracts all backend communication:

```typescript
// Authentication Service
export const authService = {
  signIn: (email: string, password: string) => Promise<SignInResponse>;
  signUp: (email: string, password: string, username: string) => Promise<SignUpResponse>;
  signOut: () => Promise<void>;
  refreshToken: (refresh_token: string) => Promise<SignInResponse>;
};

// Profile Service  
export const profileService = {
  getProfile: (userId: string) => Promise<Profile>;
  updateProfile: (userId: string, updates: Partial<Profile>) => Promise<Profile>;
  searchProfiles: (params: SearchProfilesParams) => Promise<Profile[]>;
  addUserSport: (sport_id: string) => Promise<UserSport>;
  removeUserSport: (userId: string, sportId: string) => Promise<void>;
};

// Match Service
export const matchService = {
  getMatches: (params?: GetMatchesParams) => Promise<Match[]>;
  getMatch: (matchId: string) => Promise<Match>;
  createMatch: (matchData: CreateMatchRequest) => Promise<Match>;
  updateMatch: (matchId: string, updates: Partial<CreateMatchRequest>) => Promise<Match>;
  joinMatch: (matchId: string) => Promise<void>;
  leaveMatch: (matchId: string) => Promise<void>;
};
```

### **Data Caching Strategy**
- **Session Storage**: JWT tokens stored securely in AsyncStorage
- **Profile Caching**: User profile cached for offline access
- **Location Caching**: Last known location stored locally
- **Optimistic Updates**: UI updates immediately, syncs with backend

## 🛡️ **Backend API Architecture**

### **Middleware Stack**
```typescript
// Security & Rate Limiting
app.use(ddosProtection);
app.use(generalRateLimit);
app.use(speedLimiter);

// Authentication Middleware
app.use('/api/profiles/:id', authenticateUser, verifyResourceOwnership());
app.use('/api/matches', authenticateUser);
app.use('/api/location/update', authenticateUser);
```

### **Authentication Middleware**
```typescript
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = { id: user.id, email: user.email };
  next();
};
```

### **Resource Ownership Protection**
```typescript
export const verifyResourceOwnership = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceUserId = req.params[userIdParam];
    const authenticatedUserId = req.user?.id;

    if (resourceUserId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};
```

## 🔄 **API Endpoints**

### **Authentication Endpoints**
```typescript
// Sign Up
POST /api/auth/signup
Body: { email: string, password: string, username: string, full_name?: string }
Response: { message: string, user: { id: string, email: string } }

// Sign In  
POST /api/auth/signin
Body: { email: string, password: string }
Response: { 
  message: string,
  user: { id: string, email: string },
  session: { access_token: string, refresh_token: string, expires_at: number }
}

// Token Refresh
POST /api/auth/refresh
Body: { refresh_token: string }
Response: { message: string, user: User, session: Session }

// Sign Out
POST /api/auth/signout
Response: { message: string }
```

### **Profile Endpoints**
```typescript
// Get Profile
GET /api/profiles/:id
Response: Profile (with user_sports included)

// Update Profile (Protected)
PUT /api/profiles/:id
Body: Partial<Profile>
Response: Profile

// Search Profiles
GET /api/profiles/search?location=lat,lng&radius=10000&sport_id=123
Response: Profile[]

// Add User Sport (Protected)
POST /api/profiles/sports
Body: { sport_id: string, skill_level?: string, preferred?: boolean }
Response: UserSport

// Remove User Sport (Protected)
DELETE /api/profiles/:user_id/sports/:sport_id
Response: { message: string }
```

### **Location Endpoints**
```typescript
// Find Nearby Users
GET /api/location/nearby/users?latitude=123&longitude=456&radius=10000
Response: { users: Profile[], count: number, searchParams: object }

// Find Nearby Matches
GET /api/location/nearby/matches?latitude=123&longitude=456&sport_id=789
Response: { matches: Match[], count: number, searchParams: object }

// Update User Location (Protected)
PUT /api/location/update
Body: { latitude: number, longitude: number, location_name?: string }
Response: { message: string, profile: Profile }

// Get Popular Areas
GET /api/location/popular-areas
Response: { areas: Area[], count: number }
```

### **Match Endpoints**
```typescript
// Get Matches
GET /api/matches?location=lat,lng&sport_id=123&status=open
Response: Match[]

// Get Specific Match
GET /api/matches/:id
Response: Match (with participants and creator)

// Create Match (Protected)
POST /api/matches
Body: CreateMatchRequest
Response: Match

// Update Match (Protected - Creator Only)
PUT /api/matches/:id
Body: Partial<CreateMatchRequest>
Response: Match

// Join Match (Protected)
POST /api/matches/:id/join
Response: { message: string }

// Leave Match (Protected)  
POST /api/matches/:id/leave
Response: { message: string }
```

## 🔒 **Security Features**

### **Authentication Security**
- **JWT Tokens**: Secure, stateless authentication
- **Token Rotation**: Automatic refresh token rotation
- **Secure Storage**: Tokens stored in device secure storage
- **Session Management**: Automatic logout on token expiry

### **API Security**
- **Rate Limiting**: Multiple layers of rate limiting
- **Input Validation**: Server-side validation using shared types
- **SQL Injection Protection**: Supabase ORM prevents SQL injection
- **CORS Protection**: Restricted origins in production

### **Data Security**
- **Row Level Security**: Database-level access control
- **Resource Ownership**: Users can only access their own data
- **Audit Logging**: All API requests logged
- **Error Sanitization**: No sensitive data in error responses

## 📊 **Performance Optimizations**

### **Mobile Optimizations**
- **Request Caching**: Intelligent caching of API responses
- **Offline Support**: Cached data available offline
- **Optimistic Updates**: UI responds immediately
- **Background Sync**: Sync changes when connectivity returns

### **Backend Optimizations**
- **Database Indexing**: Spatial indexes for location queries
- **Query Optimization**: Efficient JOIN queries with select fields
- **Connection Pooling**: Supabase handles connection pooling
- **Response Compression**: Gzip compression for large responses

### **Network Optimizations**
- **Pagination**: Large datasets paginated
- **Field Selection**: Only required fields returned
- **Batch Operations**: Multiple operations in single request
- **CDN Integration**: Static assets served from CDN

## 🔧 **Development Benefits**

### **Type Safety**
- **Shared Types**: Same TypeScript types across backend and mobile
- **API Contracts**: Clear interface definitions
- **Compile-Time Validation**: Catch errors at build time
- **IntelliSense Support**: Better developer experience

### **Testing Strategy**
- **API Testing**: Comprehensive backend API tests
- **Mobile Testing**: Service layer unit tests
- **Integration Testing**: End-to-end user flows
- **Security Testing**: Authentication and authorization tests

### **Maintainability**
- **Single Source of Truth**: All business logic in backend
- **Version Control**: API versioning for backward compatibility
- **Documentation**: Auto-generated API documentation
- **Monitoring**: Comprehensive logging and error tracking

## 🚀 **Production Considerations**

### **Scalability**
- **Horizontal Scaling**: Backend can scale independently
- **Database Scaling**: Supabase handles database scaling
- **CDN Distribution**: Global content delivery
- **Load Balancing**: Multiple backend instances

### **Monitoring**
- **API Metrics**: Response times, error rates, usage patterns
- **Performance Monitoring**: Database query performance
- **Security Monitoring**: Authentication failures, rate limit hits
- **User Analytics**: Feature usage and engagement metrics

This API-first architecture provides a robust, secure, and scalable foundation for the Sports Buddy app, ensuring data security while maintaining excellent performance and developer experience.