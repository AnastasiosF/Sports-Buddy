# Shared Types Package

This package contains shared TypeScript types, API interfaces, validation utilities, constants, and helper functions used across the Sports Buddy App backend and mobile applications.

## Purpose

- **Type Safety**: Ensure consistent data structures between API and client
- **Validation**: Shared validation logic prevents inconsistencies
- **Constants**: Centralized app configuration and limits
- **Utilities**: Common helper functions for date formatting, distance calculation, etc.

## Package Structure

```
shared/
├── src/
│   ├── types.ts         # Core data model interfaces
│   ├── api.ts           # API request/response types
│   ├── validation.ts    # Validation functions and helpers
│   ├── constants.ts     # App constants and configuration
│   ├── utils.ts         # Utility functions
│   └── index.ts         # Main export file
├── dist/               # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### Backend (Express API)
```bash
cd backend
npm install ../shared
```

### Mobile App (React Native)
```bash
cd mobile/SportsMonkey
npm install ../../shared
```

## Usage

### Import Types
```typescript
import { Profile, Match, Sport } from '@sports-buddy/shared-types';
```

### Import API Types
```typescript
import { SignUpRequest, CreateMatchRequest } from '@sports-buddy/shared-types';
```

### Import Validation
```typescript
import { isValidEmail, isValidPassword, isValidUsername } from '@sports-buddy/shared-types';
```

### Import Constants
```typescript
import { DEFAULT_MATCH_DURATION, COLORS, API_ENDPOINTS } from '@sports-buddy/shared-types';
```

### Import Utilities
```typescript
import { formatDistance, calculateDistance, formatDateTime } from '@sports-buddy/shared-types';
```

## Core Types

### Profile
User profile information with optional location and skill level.

### Sport
Available sports with player requirements.

### Match
Sports match/session with location, participants, and scheduling.

### UserSport
Many-to-many relationship between users and sports they play.

### Message
In-app messaging between match participants.

### UserConnection
Friend/connection system between users.

### UserReview
Player rating and review system.

## API Types

Request and response types for all API endpoints:
- Authentication (SignUp, SignIn)
- Profile management (Update, Search)
- Match management (Create, Update, Join, Leave)

## Validation Functions

- `isValidEmail()` - Email format validation
- `isValidPassword()` - Password strength requirements
- `isValidUsername()` - Username format and length
- `isValidLocation()` - Geographic coordinate validation
- `isValidRating()` - Rating value validation (1-5)
- And many more...

## Constants

- **Limits**: Maximum lengths, participant counts, etc.
- **Defaults**: Default values for matches, search radius
- **Colors**: App theme colors
- **API Endpoints**: Base paths for API routes
- **Screen Names**: Navigation screen identifiers

## Utilities

- **Distance Calculation**: Haversine formula for geographic distance
- **Date Formatting**: Human-readable date/time formatting
- **Text Processing**: String sanitization and capitalization
- **Debouncing**: Function debouncing for search inputs

## Development

### Build the Package
```bash
npm run build
```

### Watch for Changes
```bash
npm run dev
```

## Type Safety Benefits

1. **Consistent Data Models**: Same types used in API and client
2. **Compile-time Validation**: TypeScript catches type mismatches
3. **API Contract**: Clear interface definitions
4. **Refactoring Safety**: Changes propagate across all apps
5. **Documentation**: Types serve as living documentation

## Version Management

When updating types:
1. Make changes in the shared package
2. Increment version in `package.json`
3. Rebuild the package
4. Update dependent packages in backend and mobile apps

This ensures all applications stay synchronized with the latest type definitions.