# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend
```bash
cd backend
npm run dev      # Start development server with nodemon
npm run build    # Compile TypeScript to dist/
npm start        # Run production server from dist/
```

### Mobile App (React Native + Expo)
```bash
cd mobile/SportsMonkey
npm start                    # Start Expo development server
npm run android             # Run on Android device/emulator
npm run android:emulator    # Run on Android emulator specifically
npm run ios                 # Run on iOS simulator
npm run type-check          # TypeScript type checking without compilation
npm run lint                # ESLint checking
npm run lint:fix            # Fix ESLint issues automatically
npm run format              # Format code with Prettier
```

### Shared Types Package
```bash
cd shared
npm run build    # Build TypeScript types - required before using in other packages
npm run dev      # Watch mode for development
```

## Architecture Overview

### Monorepo Structure
Three interconnected packages:
- `backend/`: Express.js API server with TypeScript
- `mobile/SportsMonkey/`: React Native Expo mobile app  
- `shared/`: Shared TypeScript types and utilities used by both backend and mobile

### API-First Architecture
The mobile app never communicates directly with the database. All data flows through the backend API:
```
Mobile App → Backend API → Supabase Database
```

Key security benefits:
- No database credentials in mobile app
- Centralized authentication and validation
- API-level rate limiting and protection
- Server-side business logic enforcement

### Authentication Flow
- JWT tokens from Supabase with automatic refresh
- Backend validates all tokens via Supabase auth
- Mobile app handles token lifecycle automatically
- Authentication middleware protects all sensitive endpoints

### Technology Stack
- **Database**: Supabase (PostgreSQL + PostGIS for location features)
- **Backend**: Express.js with TypeScript, helmet security, CORS, rate limiting
- **Mobile**: React Native with Expo, React Navigation v6, AsyncStorage
- **Shared**: TypeScript types and validation utilities

### Location-Based Features
Core functionality built around PostGIS spatial queries:
- Find nearby users and matches using geographic distance
- Spatial indexing for performance
- Haversine formula distance calculations
- Privacy controls for location sharing

### Security Implementation
Multi-layer protection:
- General API rate limiting (1000 req/15min)
- Authentication-specific limits (10 req/15min for auth endpoints)
- JWT token verification on all protected routes
- Resource ownership verification (users can only access their own data)
- Helmet security headers and CORS restrictions

### Service Layer Pattern
Mobile app uses dedicated service modules:
- `authService`: Authentication operations
- `profileService`: User profile management
- `matchService`: Sports match operations
- `locationService`: Location-based searches
- `sportsService`: Sports data management

Each service abstracts API communication and handles token refresh automatically.

## Development Workflow

1. **Setup**: Ensure Supabase credentials configured in `backend/.env`
2. **Types**: Build shared package first when making type changes: `cd shared && npm run build`
3. **Development**: Run backend dev server and Expo simultaneously
4. **Mobile Testing**: Use Expo Go app or simulators/emulators
5. **Database**: Make schema changes directly in Supabase dashboard

## Important Implementation Details

- The `@sports-buddy/shared-types` package is referenced as a local file dependency
- Location data stored as PostGIS POINT geometry with spatial indexes
- Authentication context provides user state throughout mobile app
- All API responses follow consistent JSON format with proper HTTP status codes
- Mobile app implements optimistic updates with backend synchronization