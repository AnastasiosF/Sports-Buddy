# 🏃‍♂️ Sports Buddy App

**Find your perfect sports partner, anytime, anywhere!**

Sports Buddy is a comprehensive mobile application that connects sports enthusiasts based on location, skill level, and shared interests. Whether you're looking for a tennis partner, organizing a basketball game, or joining a running group, Sports Buddy makes it easy to discover and connect with like-minded athletes in your area.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

## ✨ Features

### 🎯 **Core Functionality**
- **🔐 Secure Authentication** - JWT-based auth with automatic token refresh
- **📍 Location-Based Discovery** - Find sports partners and matches nearby using PostGIS
- **🏅 Sports & Skill Management** - Track 14+ sports with skill level progression
- **⚡ Real-Time Invitations** - Bidirectional invitation system with instant notifications
- **👥 Social Features** - Friend system, user reviews, and match ratings
- **🔄 Match Management** - Create, join, leave, and manage sports matches

### 🚀 **Advanced Features**
- **🎨 Theme System** - Light/dark mode with dynamic theming
- **🛡️ Row-Level Security** - Comprehensive database security policies
- **📱 Responsive Design** - Safe area aware UI for all device types
- **🔍 Smart Search** - Search by location, creator, sport, or skill level
- **🌍 Geospatial Queries** - Efficient location-based matching with spatial indexes

## 🏗️ Architecture

### **Monorepo Structure**
```
sports-buddy-app/
├── 📱 mobile/SportsMonkey/        # React Native Expo App
│   ├── src/
│   │   ├── 🎨 components/         # Reusable UI components
│   │   ├── 🔗 contexts/           # React Context (Auth, Theme, etc.)
│   │   ├── 🪝 hooks/              # Custom React hooks
│   │   ├── 🧭 navigation/         # React Navigation setup
│   │   ├── 📱 screens/            # App screens and pages
│   │   ├── 🛠️ services/           # API service layer
│   │   ├── 🎨 theme/              # Design system and themes
│   │   ├── 🔤 types/              # TypeScript definitions
│   │   └── 🛠️ utils/              # Utility functions
│   └── App.tsx
├── 🖥️ backend/                    # Express.js API Server
│   ├── src/
│   │   ├── ⚙️ config/             # Database and app config
│   │   ├── 🎮 controllers/        # API route handlers
│   │   ├── 🛡️ middleware/         # Security and auth middleware
│   │   ├── 🛤️ routes/             # API route definitions
│   │   ├── 📝 scripts/            # Database seed scripts
│   │   ├── 🔤 types/              # TypeScript definitions
│   │   └── app.ts                # Express application
├── 🔗 shared/                     # Shared TypeScript types
│   ├── src/
│   │   ├── types.ts              # Common type definitions
│   │   ├── api.ts                # API interfaces
│   │   ├── constants.ts          # Shared constants
│   │   ├── utils.ts              # Utility functions
│   │   └── validation.ts         # Input validation
└── 🗄️ *.sql                      # Database schema and migrations
```

### **🔧 Technology Stack**

#### **Backend Stack**
- **🟢 Node.js + TypeScript** - Modern JavaScript runtime with type safety
- **⚡ Express.js** - Fast, unopinionated web framework
- **🛡️ Security Middleware** - Helmet, CORS, rate limiting, authentication
- **📊 Supabase** - PostgreSQL database with real-time subscriptions
- **🌍 PostGIS** - Spatial extension for location-based queries
- **🔐 JWT Authentication** - Secure token-based authentication

#### **Mobile Stack**
- **📱 React Native + Expo** - Cross-platform mobile development
- **🎨 React Native Elements (RNE)** - Consistent UI component library
- **🧭 React Navigation v6** - Native navigation with type safety
- **🔗 Context API** - State management for auth, theme, and data
- **💾 AsyncStorage** - Persistent local storage
- **🔧 TypeScript** - Full type safety across the application

#### **Database & Infrastructure**
- **🐘 PostgreSQL** - Robust relational database with JSON support
- **🌍 PostGIS** - Advanced geospatial capabilities
- **🔐 Row-Level Security** - Fine-grained access control
- **📈 Spatial Indexing** - Optimized location-based queries
- **⚡ Real-time Subscriptions** - Live data updates

### **🔐 Security Architecture**

#### **Multi-Layer Protection**
```
Mobile App (No DB Credentials)
     ↓ JWT Tokens
Express API (Rate Limited + Authenticated)
     ↓ Service Role Key
Supabase (Row-Level Security + Policies)
     ↓ Secure Queries
PostgreSQL Database
```

#### **Security Features**
- **🔑 JWT Token Management** - Automatic refresh and secure storage
- **🛡️ API Rate Limiting** - Protection against abuse and spam
- **🔒 Row-Level Security** - Database-level access control
- **🛠️ Input Validation** - Server-side validation for all inputs
- **🔐 Resource Ownership** - Users can only access their own data
- **🌐 CORS Protection** - Secure cross-origin resource sharing

## 💫 Core Features Deep Dive

### **🎯 Match Invitation System**
Our sophisticated invitation system supports both directions of match participation:

#### **📤 Direct Invitations (Creator → Players)**
1. **Search & Invite** - Match creators search for users and send invitations
2. **Real-time Notifications** - Invited users receive instant notification banners
3. **Quick Actions** - Accept or decline invitations with one tap
4. **Status Tracking** - Real-time updates on invitation status

#### **🙋 Join Requests (Player → Creator)**
1. **Request to Join** - Players can request to join open matches
2. **Creator Approval** - Match creators receive and manage join requests
3. **Notification System** - Both parties receive status updates
4. **Automatic Matching** - System handles capacity and skill level matching

### **🌍 Location-Based Discovery**
- **🎯 Proximity Matching** - Find matches within customizable radius (1-50km)
- **📍 Real-time Location** - Optional location sharing for enhanced matching
- **🗺️ Interactive Maps** - View match locations with tap-to-navigate
- **🔍 Smart Filtering** - Filter by sport, skill level, time, and distance

### **👥 Social Features**
- **👤 User Profiles** - Comprehensive profiles with sports preferences
- **⭐ Review System** - Rate and review other players after matches
- **🤝 Friend System** - Send/accept friend requests and build networks
- **💬 Match Chat** - In-app messaging for confirmed match participants

### **🎨 Design System**
- **🌓 Theme Support** - Light and dark modes with system preference detection
- **📱 Responsive UI** - Safe area aware design for all device types
- **🎨 Consistent Styling** - Design tokens for spacing, colors, and typography
- **♿ Accessibility** - Screen reader support and accessibility best practices

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account and project
- iOS Simulator (Mac) or Android Studio (development)

### **⚡ One-Command Setup**
```bash
# Clone and setup entire project
git clone <repository-url>
cd sports-buddy-app

# Install all dependencies
npm run setup:all

# Configure environment (see detailed setup below)
# Then start development
npm run dev:all
```

## 🛠️ Detailed Setup

### **🖥️ Backend Setup**
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

**Environment Configuration** (`.env`):
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Security Configuration (Optional)
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT=1000
AUTH_RATE_LIMIT=10
```

```bash
# 4. Set up database
npm run db:setup  # Runs FINAL_DATABASE_SCHEMA.sql

# 5. Start development server
npm run dev
```

### **📱 Mobile App Setup**
```bash
# 1. Navigate to mobile app
cd mobile/SportsMonkey

# 2. Install dependencies
npm install

# 3. Configure Supabase
# Update src/config/index.ts with your Supabase credentials

# 4. Start Expo development server
npm start
```

**Mobile Configuration** (`src/config/index.ts`):
```typescript
export const config = {
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your_anon_key_here',
  },
  api: {
    baseUrl: 'http://localhost:3000', // or your deployed API URL
  },
};
```

### **🔗 Shared Types Setup**
```bash
# Build shared types (required for development)
cd shared
npm install
npm run build
```

## 📚 API Reference

### **🔐 Authentication Endpoints**
```http
POST   /api/auth/signup       # Create new user account
POST   /api/auth/signin       # Sign in user  
POST   /api/auth/signout      # Sign out user
POST   /api/auth/refresh      # Refresh JWT token
GET    /health                # API health check
```

### **👤 Profile Management**
```http
GET    /api/profiles/me       # Get current user profile
PUT    /api/profiles/me       # Update current user profile
GET    /api/profiles/:id      # Get specific user profile
GET    /api/profiles/search   # Search users by location/sport
POST   /api/profiles/sports   # Add sport to user profile
PUT    /api/profiles/sports/:id # Update user sport preferences
DELETE /api/profiles/sports/:id # Remove sport from profile
```

### **🏃‍♂️ Sports Data**
```http
GET    /api/sports            # Get all available sports
GET    /api/sports/:id        # Get specific sport details
GET    /api/sports/popular    # Get sports popularity statistics
```

### **⚽ Match Management**
```http
GET    /api/matches           # Get matches with filtering
POST   /api/matches           # Create new match
GET    /api/matches/:id       # Get specific match details
PUT    /api/matches/:id       # Update match (creator only)
DELETE /api/matches/:id       # Delete match (creator only)
GET    /api/matches/user      # Get user's matches (created & joined)
```

### **🎯 Invitation System**
```http
POST   /api/matches/:id/join      # Request to join match
POST   /api/matches/:id/leave     # Leave match
POST   /api/matches/:id/invite    # Invite user to match (creator only)
POST   /api/matches/:id/respond   # Respond to invitation (accept/decline)

GET    /api/matches/invitations/received  # Get pending invitations
GET    /api/matches/requests/received     # Get join requests (creator only)
POST   /api/matches/requests/:id/accept   # Accept join request
POST   /api/matches/requests/:id/decline  # Decline join request
```

### **👥 Friends System**
```http
GET    /api/friends           # Get user's friends list
GET    /api/friends/requests  # Get pending friend requests
POST   /api/friends/request   # Send friend request
POST   /api/friends/:id/accept   # Accept friend request
POST   /api/friends/:id/decline  # Decline friend request
DELETE /api/friends/:id        # Remove friend
```

### **📍 Location Services**
```http
GET    /api/location/nearby   # Get nearby users/matches
POST   /api/location/update   # Update user location
GET    /api/location/search   # Search by location name
```

## 🗄️ Database Schema

### **Core Tables**
- **`profiles`** - User profiles with location data (PostGIS)
- **`sports`** - Available sports (14 included by default)
- **`user_sports`** - User-sport preferences with skill levels
- **`matches`** - Sports matches with geospatial data
- **`match_participants`** - Invitation/join request management
- **`user_connections`** - Friend system relationships
- **`messages`** - Match-based messaging
- **`user_reviews`** - Player ratings and reviews

### **Key Features**
- **PostGIS Integration** - Spatial queries and location indexing
- **Row-Level Security** - Comprehensive access control policies
- **Automatic Triggers** - `updated_at` timestamp management
- **Performance Indexes** - 20+ optimized indexes for common queries
- **Data Integrity** - Foreign keys, constraints, and business logic

### **Available Sports**
Tennis, Basketball, Football/Soccer, Volleyball, Badminton, Table Tennis, Running, Cycling, Swimming, Golf, Baseball, Hockey, Cricket, Rugby

## 📱 Mobile App Features

### **🎨 UI/UX Components**
- **Themed Components** - Light/dark mode support
- **Safe Area Design** - Works with notches and dynamic islands
- **Interactive Notifications** - Real-time invitation banners
- **Smart Navigation** - Context-aware navigation flows
- **Responsive Cards** - Match and user profile cards
- **Location Integration** - Native map integration

### **🔄 State Management**
- **Auth Context** - User authentication state
- **Theme Context** - UI theme and preferences
- **Location Context** - User location management
- **Match Invitations Context** - Real-time invitation handling
- **Friends Context** - Social connections management

### **📲 Navigation Structure**
```
App Navigator
├── Auth Stack (Unauthenticated)
│   ├── Login Screen
│   ├── Register Screen
│   └── Loading Screen
└── Main Stack (Authenticated)
    ├── Tab Navigator
    │   ├── Dashboard
    │   ├── Nearby Matches
    │   ├── Profile
    │   └── Friends
    ├── Create Match
    ├── Match Details
    ├── User Search
    └── Match Search
```

## 🧪 Development & Testing

### **Development Commands**
```bash
# Backend Development
cd backend
npm run dev          # Start with nodemon hot reload
npm run build        # Compile TypeScript
npm run type-check   # Check types without compilation
npm run lint         # ESLint checking

# Mobile Development  
cd mobile/SportsMonkey
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS Simulator
npm run type-check  # TypeScript checking
npm run lint        # ESLint checking

# Shared Types
cd shared
npm run build       # Build shared types
npm run dev         # Watch mode for development
```

### **Testing Strategy**
- **Unit Tests** - Jest for business logic testing
- **Integration Tests** - API endpoint testing with Supertest
- **E2E Tests** - Detox for mobile app testing
- **Type Safety** - Comprehensive TypeScript coverage
- **Manual Testing** - Device testing on iOS and Android

## 🚢 Deployment

### **Backend Deployment**
- **Production**: Deploy to Railway, Heroku, or AWS
- **Database**: Managed Supabase PostgreSQL
- **Environment**: Production environment variables
- **Monitoring**: Health checks and error tracking

### **Mobile Deployment**
- **iOS**: App Store via Expo Application Services (EAS)
- **Android**: Google Play Store via EAS
- **OTA Updates**: Expo Over-The-Air updates for React Native code

## 🏆 Development Status

### ✅ **Completed Features**
- **🔐 Authentication System** - JWT-based with auto-refresh
- **📱 Core Mobile App** - Complete UI with navigation
- **🗄️ Database Schema** - Production-ready with RLS policies
- **🎯 Invitation System** - Bidirectional invites and requests
- **🎨 Theme System** - Light/dark mode with design tokens
- **📍 Location Services** - PostGIS-based proximity matching
- **👥 Social Features** - Friends, reviews, and messaging foundation
- **🛡️ Security Implementation** - Rate limiting, validation, and protection

### 🚧 **In Development**
- **💬 Real-time Messaging** - Live chat for match participants
- **📊 Analytics Dashboard** - Match statistics and insights
- **🔔 Push Notifications** - Native mobile notifications
- **🗺️ Interactive Maps** - Enhanced location visualization

### 📋 **Planned Features**
- **⚡ Performance Optimization** - Caching and query optimization
- **🔍 Advanced Search** - AI-powered match recommendations
- **📱 Offline Support** - Offline-first architecture
- **🎮 Gamification** - Achievement system and leaderboards
- **🔗 Social Integration** - Share matches on social platforms

## 🤝 Contributing

### **Development Guidelines**
1. **Fork the repository** and create feature branches
2. **Follow TypeScript** - Strict type checking required
3. **Test your changes** - Unit and integration tests
4. **Update documentation** - Keep README and code comments current
5. **Security first** - Never expose credentials or sensitive data

### **Code Style**
- **ESLint + Prettier** for consistent formatting
- **Conventional Commits** for clear git history
- **Component naming** - PascalCase for React components
- **File organization** - Feature-based folder structure

### **Pull Request Process**
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: Check [DEVELOPMENT.md](DEVELOPMENT.md) for development guidance
- **Issues**: Create GitHub issues for bugs and feature requests
- **Architecture**: Review [API_ARCHITECTURE.md](API_ARCHITECTURE.md) for technical details

---

**Built with ❤️ for the sports community**