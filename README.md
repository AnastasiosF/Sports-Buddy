# Sports Buddy App

A React Native and Node.js application for finding local sports partners.

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for API development
- **Supabase** as database (PostgreSQL with authentication)
- **PostGIS** for location-based features

### Frontend
- **React Native** with **Expo**
- **TypeScript**
- **React Native Elements** for UI components
- **Supabase** client for authentication and data

## Project Structure

```
sports-buddy-app/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript type definitions
│   │   └── app.ts          # Main Express application
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   └── SportsMonkey/       # React Native Expo app
│       ├── src/
│       │   ├── config/     # Supabase configuration
│       │   ├── contexts/   # React contexts (Auth, etc.)
│       │   ├── screens/    # App screens/components
│       │   └── types/      # TypeScript type definitions
│       ├── App.tsx
│       └── package.json
└── database_schema.sql     # Supabase database schema
```

## Features

### Core Features
- **User Authentication** - Sign up, sign in, profile management
- **Sports Selection** - Choose sports and skill levels
- **Location-based Matching** - Find nearby sports partners
- **Match Creation** - Create and join sports matches
- **Real-time Messaging** - Chat with match participants
- **User Profiles** - View other players' profiles and ratings

### Database Schema
- **Users & Profiles** - User authentication and profile information
- **Sports** - Available sports with player requirements
- **Matches** - Sports match/session management
- **Participants** - Match participation tracking
- **Messages** - In-app messaging system
- **Reviews** - Player rating and review system
- **Connections** - Friend/connection system

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Supabase credentials:
   ```
   PORT=3000
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   ```

5. Set up the database schema in Supabase:
   - Run the SQL commands in `database_schema.sql`

6. Start the development server:
   ```bash
   npm run dev
   ```

### Mobile App Setup
1. Navigate to the mobile app directory:
   ```bash
   cd mobile/SportsMonkey
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update Supabase configuration in `src/config/supabase.ts`:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

4. Start the Expo development server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user

### Profiles
- `GET /api/profiles/:id` - Get user profile
- `PUT /api/profiles/:id` - Update user profile
- `GET /api/profiles/search` - Search profiles by location/sport
- `POST /api/profiles/sports` - Add sport to user profile
- `DELETE /api/profiles/:user_id/sports/:sport_id` - Remove sport

### Sports
- `GET /api/sports` - Get all available sports
- `GET /api/sports/:id` - Get specific sport

### Matches
- `GET /api/matches` - Get matches (with filters)
- `POST /api/matches` - Create new match
- `GET /api/matches/:id` - Get specific match
- `PUT /api/matches/:id` - Update match
- `POST /api/matches/:id/join` - Join a match
- `POST /api/matches/:id/leave` - Leave a match

## Development Status

✅ **Completed:**
- Project structure setup
- TypeScript configuration
- Supabase database schema
- Express.js API endpoints
- React Native app with authentication screens
- User authentication system

🚧 **In Progress:**
- Sports selection and profile setup screens
- Location-based matching functionality
- Match creation and management
- Messaging system

📋 **Todo:**
- User interface improvements
- Push notifications
- Advanced filtering
- Social features (friends, reviews)
- Testing and deployment

## Contributing

This is a demo project showing the architecture for a sports buddy finder app. Feel free to extend and customize it for your needs.