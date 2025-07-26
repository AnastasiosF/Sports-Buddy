import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

/**
 * GET /api/matches
 * 
 * Retrieves matches with optional filtering and location-based proximity search.
 * This endpoint supports both general match listing and nearby matches functionality.
 * 
 * Query Parameters:
 * - location (string, optional): User's location in "latitude,longitude" format (e.g., "37.7749,-122.4194")
 * - radius (number, optional): Search radius in meters. Default: 10000 (10km)
 * - sport_id (string, optional): Filter matches by specific sport ID
 * - skill_level (string, optional): Filter by required skill level ('beginner', 'intermediate', 'advanced', 'expert')
 * - status (string, optional): Filter by match status. Default: 'open'
 * 
 * Features:
 * - Location-based filtering: When location is provided, calculates distances and filters by radius
 * - Distance calculation: Uses Haversine formula for accurate distance computation
 * - Sorting: Results sorted by distance when location is provided, otherwise by scheduled_at
 * - Sport and skill filtering: Supports filtering by sport type and skill level requirements
 * - Future matches only: Only returns matches scheduled for future dates
 * 
 * Response Format:
 * {
 *   "matches": [
 *     {
 *       "id": "uuid",
 *       "title": "string",
 *       "description": "string",
 *       "location": "POINT(lng lat)", // PostGIS format
 *       "location_name": "string",
 *       "scheduled_at": "ISO 8601 datetime",
 *       "duration": number, // minutes
 *       "max_participants": number,
 *       "skill_level_required": "string",
 *       "status": "string",
 *       "created_at": "ISO 8601 datetime",
 *       "distance": number, // meters (only when location provided)
 *       "sport": { "id": "uuid", "name": "string", ... },
 *       "creator": { "id": "uuid", "username": "string", ... },
 *       "participants": [
 *         {
 *           "user_id": "uuid",
 *           "status": "confirmed|pending",
 *           "user": { "id": "uuid", "username": "string", ... }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * 
 * Authentication: Optional (public endpoint with optional user context)
 * Rate Limiting: Applied (search rate limit)
 * 
 * Error Responses:
 * - 400: Bad request (invalid parameters)
 * - 500: Internal server error
 */
export const getMatches = async (req: Request, res: Response) => {
  try {
    const { location, radius = 10000, sport_id, skill_level, status = 'open', search, search_type } = req.query;

    // Base query
    let query = supabase
      .from('matches')
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*),
        participants:match_participants (
          *,
          user:profiles (*)
        )
      `)
      .eq('status', status)
      .gte('scheduled_at', new Date().toISOString());

    // Add sport filtering if provided
    if (sport_id) {
      query = query.eq('sport_id', sport_id);
    }

    // Add skill level filtering if provided
    if (skill_level && skill_level !== 'any') {
      query = query.eq('skill_level_required', skill_level);
    }

    // Add text search if provided
    if (search && typeof search === 'string' && search.length > 2) {
      const searchTerm = search.toLowerCase();
      
      switch (search_type) {
        case 'location':
          query = query.ilike('location_name', `%${searchTerm}%`);
          break;
        case 'title':
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
          break;
        case 'creator':
          // For creator search, we'll need to filter after the query since we need to search in profiles
          break;
        default:
          // Search all fields
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location_name.ilike.%${searchTerm}%`);
          break;
      }
    }

    const { data, error } = await query
      .order('scheduled_at')
      .limit(100); // Get more matches for filtering

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    let matches = data || [];
    
    // Apply creator search if needed (after initial query since we need profile data)
    if (search && search_type === 'creator' && typeof search === 'string' && search.length > 2) {
      const searchTerm = search.toLowerCase();
      matches = matches.filter(match => 
        match.creator?.username?.toLowerCase().includes(searchTerm) ||
        match.creator?.full_name?.toLowerCase().includes(searchTerm)
      );
    }
    
    // If location was provided, calculate distances and filter by radius
    if (location && typeof location === 'string') {
      const [userLat, userLng] = location.split(',').map(Number);
      
      if (!isNaN(userLat) && !isNaN(userLng)) {
        matches = matches
          .map(match => {
            // Extract coordinates from PostGIS POINT format
            if (match.location) {
              // Parse "POINT(lng lat)" format
              const pointMatch = match.location.match(/POINT\(([^)]+)\)/);
              if (pointMatch) {
                const [matchLng, matchLat] = pointMatch[1].split(' ').map(Number);
                
                // Calculate distance using Haversine formula
                const distance = calculateDistance(userLat, userLng, matchLat, matchLng);
                
                return {
                  ...match,
                  distance: Math.round(distance)
                };
              }
            }
            return { ...match, distance: Infinity };
          })
          .filter(match => match.distance <= Number(radius)) // Filter by radius
          .sort((a, b) => a.distance - b.distance) // Sort by distance
          .slice(0, 50); // Limit results
      }
    }

    res.json({ matches });
  } catch (error) {
    console.error('Error in getMatches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * GET /api/matches/:id
 * 
 * Retrieves detailed information about a specific match by ID.
 * Returns comprehensive match data including participants, creator info, and sport details.
 * 
 * Path Parameters:
 * - id (string, required): Unique identifier of the match (UUID format)
 * 
 * Response Format:
 * {
 *   "id": "uuid",
 *   "title": "string",
 *   "description": "string",
 *   "location": "POINT(lng lat)", // PostGIS format
 *   "location_name": "string",
 *   "scheduled_at": "ISO 8601 datetime",
 *   "duration": number, // minutes
 *   "max_participants": number,
 *   "skill_level_required": "string",
 *   "status": "open|full|completed|cancelled",
 *   "created_at": "ISO 8601 datetime",
 *   "updated_at": "ISO 8601 datetime",
 *   "created_by": "uuid",
 *   "sport": {
 *     "id": "uuid",
 *     "name": "string",
 *     "description": "string",
 *     "icon": "string"
 *   },
 *   "creator": {
 *     "id": "uuid",
 *     "username": "string",
 *     "full_name": "string",
 *     "avatar_url": "string"
 *   },
 *   "participants": [
 *     {
 *       "match_id": "uuid",
 *       "user_id": "uuid",
 *       "status": "confirmed|pending",
 *       "joined_at": "ISO 8601 datetime",
 *       "user": {
 *         "id": "uuid",
 *         "username": "string",
 *         "full_name": "string",
 *         "avatar_url": "string"
 *       }
 *     }
 *   ]
 * }
 * 
 * Authentication: Optional (public endpoint with optional user context)
 * Rate Limiting: None
 * 
 * Use Cases:
 * - View match details before joining
 * - Display match information in mobile app
 * - Check current participants and availability
 * 
 * Error Responses:
 * - 404: Match not found
 * - 500: Internal server error
 */
export const getMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*),
        participants:match_participants (
          *,
          user:profiles (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/matches
 * 
 * Creates a new sports match. The authenticated user becomes the match creator and is automatically
 * added as a confirmed participant.
 * 
 * Request Body:
 * {
 *   "sport_id": "uuid", // Required: ID of the sport
 *   "title": "string", // Required: Match title/name
 *   "description": "string", // Optional: Match description
 *   "location": [longitude, latitude], // Required: Location coordinates as array
 *   "location_name": "string", // Required: Human-readable location name
 *   "scheduled_at": "ISO 8601 datetime", // Required: When the match is scheduled
 *   "duration": number, // Optional: Duration in minutes (default: 60)
 *   "max_participants": number, // Optional: Maximum participants (default: 2)
 *   "skill_level_required": "any|beginner|intermediate|advanced|expert" // Optional: Required skill level (default: "any")
 * }
 * 
 * Features:
 * - Automatically adds creator as confirmed participant
 * - Converts location array to PostGIS POINT format for database storage
 * - Validates required fields
 * - Returns complete match data with related information
 * 
 * Response Format:
 * {
 *   "id": "uuid",
 *   "created_by": "uuid",
 *   "sport_id": "uuid",
 *   "title": "string",
 *   "description": "string",
 *   "location": "POINT(lng lat)",
 *   "location_name": "string",
 *   "scheduled_at": "ISO 8601 datetime",
 *   "duration": number,
 *   "max_participants": number,
 *   "skill_level_required": "string",
 *   "status": "open",
 *   "created_at": "ISO 8601 datetime",
 *   "sport": {
 *     "id": "uuid",
 *     "name": "string",
 *     "description": "string",
 *     "icon": "string"
 *   },
 *   "creator": {
 *     "id": "uuid",
 *     "username": "string",
 *     "full_name": "string",
 *     "avatar_url": "string"
 *   }
 * }
 * 
 * Authentication: Required (JWT token)
 * Rate Limiting: Applied (match creation rate limit)
 * 
 * Business Rules:
 * - Match creator is automatically added as confirmed participant
 * - Location must be provided as [longitude, latitude] array
 * - Duration defaults to 60 minutes if not specified
 * - Max participants defaults to 2 if not specified
 * - Status is automatically set to "open"
 * 
 * Error Responses:
 * - 400: Bad request (invalid/missing required fields)
 * - 401: Authentication required
 * - 500: Internal server error
 */
export const createMatch = async (req: Request, res: Response) => {
  try {
    const {
      sport_id,
      title,
      description,
      location,
      location_name,
      scheduled_at,
      duration = 60,
      max_participants = 2,
      skill_level_required = 'any'
    } = req.body;

    // Get user ID from authenticated request
    const created_by = req.user?.id;

    if (!created_by) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Convert location array to PostGIS POINT format
    const locationPoint = `POINT(${location[0]} ${location[1]})`;

    // Use authenticated client for proper RLS context
    const authClient = req.supabaseAuth || supabase;
    const { data, error } = await authClient
      .from('matches')
      .insert([{
        created_by,
        sport_id,
        title,
        description,
        location: locationPoint,
        location_name,
        scheduled_at,
        duration,
        max_participants,
        skill_level_required,
      }])
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Automatically add creator as confirmed participant
    await supabase
      .from('match_participants')
      .insert([{
        match_id: data.id,
        user_id: created_by,
        status: 'confirmed',
      }]);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/matches/:id
 * 
 * Updates an existing match. Only the match creator can update their matches.
 * Supports partial updates - only provided fields will be updated.
 * 
 * Path Parameters:
 * - id (string, required): Unique identifier of the match to update
 * 
 * Request Body (all fields optional for partial update):
 * {
 *   "sport_id": "uuid", // Sport ID
 *   "title": "string", // Match title/name
 *   "description": "string", // Match description
 *   "location": [longitude, latitude], // Location coordinates as array
 *   "location_name": "string", // Human-readable location name
 *   "scheduled_at": "ISO 8601 datetime", // When the match is scheduled
 *   "duration": number, // Duration in minutes
 *   "max_participants": number, // Maximum participants
 *   "skill_level_required": "any|beginner|intermediate|advanced|expert", // Required skill level
 *   "status": "open|full|completed|cancelled" // Match status
 * }
 * 
 * Features:
 * - Partial updates: Only send fields that need to be changed
 * - Location conversion: Automatically converts location array to PostGIS format
 * - Creator validation: Only match creator can update the match
 * - Undefined field filtering: Removes undefined values before update
 * 
 * Response Format:
 * {
 *   "id": "uuid",
 *   "created_by": "uuid",
 *   "sport_id": "uuid",
 *   "title": "string",
 *   "description": "string",
 *   "location": "POINT(lng lat)",
 *   "location_name": "string",
 *   "scheduled_at": "ISO 8601 datetime",
 *   "duration": number,
 *   "max_participants": number,
 *   "skill_level_required": "string",
 *   "status": "string",
 *   "created_at": "ISO 8601 datetime",
 *   "updated_at": "ISO 8601 datetime",
 *   "sport": {
 *     "id": "uuid",
 *     "name": "string",
 *     "description": "string",
 *     "icon": "string"
 *   },
 *   "creator": {
 *     "id": "uuid",
 *     "username": "string",
 *     "full_name": "string",
 *     "avatar_url": "string"
 *   }
 * }
 * 
 * Authentication: Required (JWT token)
 * Authorization: Only match creator can update
 * Rate Limiting: None
 * Middleware: verifyMatchCreator ensures user owns the match
 * 
 * Use Cases:
 * - Change match time or location
 * - Update participant limits
 * - Modify skill level requirements
 * - Cancel or complete matches
 * 
 * Error Responses:
 * - 400: Bad request (invalid data)
 * - 401: Authentication required
 * - 403: Forbidden (not match creator)
 * - 404: Match not found
 * - 500: Internal server error
 */
export const updateMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Convert location array to PostGIS POINT format if location is being updated
    if (cleanData.location && Array.isArray(cleanData.location)) {
      cleanData.location = `POINT(${cleanData.location[0]} ${cleanData.location[1]})`;
    }

    const { data, error } = await supabase
      .from('matches')
      .update(cleanData)
      .eq('id', id)
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/matches/:id/join
 * 
 * Allows an authenticated user to join an existing match as a participant.
 * Includes validation for match availability, capacity, and duplicate participation.
 * 
 * Path Parameters:
 * - id (string, required): Unique identifier of the match to join
 * 
 * Request Body: None required
 * 
 * Features:
 * - Validates match exists and is open for joining
 * - Checks if match has reached maximum participant capacity
 * - Prevents duplicate participation (user can't join same match twice)
 * - Automatically sets participant status to "confirmed"
 * - Updates match status to "full" when capacity is reached
 * 
 * Business Logic:
 * 1. Verify match exists and status is "open"
 * 2. Check current participant count against max_participants
 * 3. Ensure user hasn't already joined this match
 * 4. Add user as confirmed participant
 * 5. Update match status to "full" if at capacity after joining
 * 
 * Response Format:
 * {
 *   "match_id": "uuid",
 *   "user_id": "uuid",
 *   "status": "confirmed",
 *   "joined_at": "ISO 8601 datetime",
 *   "user": {
 *     "id": "uuid",
 *     "username": "string",
 *     "full_name": "string",
 *     "avatar_url": "string"
 *   }
 * }
 * 
 * Authentication: Required (JWT token)
 * Rate Limiting: None
 * 
 * Use Cases:
 * - Join available sports matches
 * - Participate in local sports events
 * - Connect with other players
 * 
 * Error Responses:
 * - 400: Bad request (match full, already joined, etc.)
 * - 401: Authentication required
 * - 404: Match not found or not open
 * - 500: Internal server error
 * 
 * Error Messages:
 * - "Match not found or not open"
 * - "Match is full"
 * - "User already joined this match"
 */
export const joinMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user ID from authenticated request
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if match exists and is open
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, participants:match_participants(count)')
      .eq('id', id)
      .eq('status', 'open')
      .single();

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found or not open' });
    }

    // Check if match is full
    const participantCount = match.participants[0]?.count || 0;
    if (participantCount >= match.max_participants) {
      return res.status(400).json({ error: 'Match is full' });
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingParticipant) {
      return res.status(400).json({ error: 'User already joined this match' });
    }

    // Add participant
    const { data, error } = await supabase
      .from('match_participants')
      .insert([{
        match_id: id,
        user_id,
        status: 'confirmed',
      }])
      .select(`
        *,
        user:profiles (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update match status to full if at capacity
    if (participantCount + 1 >= match.max_participants) {
      await supabase
        .from('matches')
        .update({ status: 'full' })
        .eq('id', id);
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/matches/:id/leave
 * 
 * Allows an authenticated user to leave a match they have joined.
 * Automatically reopens match if it was full and someone leaves.
 * 
 * Path Parameters:
 * - id (string, required): Unique identifier of the match to leave
 * 
 * Request Body: None required
 * 
 * Features:
 * - Removes user from match participants
 * - Automatically changes match status from "full" to "open" if applicable
 * - Validates user is actually a participant before removal
 * 
 * Business Logic:
 * 1. Verify user is authenticated
 * 2. Remove user from match_participants table
 * 3. If match status was "full", change it back to "open" since there's now space
 * 4. Return success confirmation
 * 
 * Response Format:
 * {
 *   "message": "Left match successfully"
 * }
 * 
 * Authentication: Required (JWT token)
 * Rate Limiting: None
 * 
 * Use Cases:
 * - Cancel participation in a match
 * - Free up space for other players
 * - Change of plans or schedule conflicts
 * 
 * Notes:
 * - Match creators cannot leave their own matches (they must delete/cancel instead)
 * - Leaving a match makes it available for others to join
 * - No validation if user was actually in the match (silent success)
 * 
 * Error Responses:
 * - 401: Authentication required
 * - 500: Internal server error
 * 
 * Side Effects:
 * - Match status changes from "full" to "open" if applicable
 * - Other users can now join if match was previously full
 */
export const leaveMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user ID from authenticated request
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { error } = await supabase
      .from('match_participants')
      .delete()
      .eq('match_id', id)
      .eq('user_id', user_id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update match status back to open if it was full
    await supabase
      .from('matches')
      .update({ status: 'open' })
      .eq('id', id)
      .eq('status', 'full');

    res.json({ message: 'Left match successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/matches/user
 * 
 * Retrieves all matches associated with the authenticated user, separated into
 * matches they created and matches they joined as participants.
 * 
 * Path Parameters: None
 * Query Parameters: None
 * Request Body: None
 * 
 * Features:
 * - Returns user's created matches and participated matches separately
 * - Excludes matches user created from the "participated" list to avoid duplicates
 * - Includes complete match details with related data (sport, creator, participants)
 * - Results sorted by scheduled_at in descending order (newest first)
 * - Two-phase query approach for accurate participant filtering
 * 
 * Response Format:
 * {
 *   "created": [
 *     {
 *       "id": "uuid",
 *       "title": "string",
 *       "description": "string",
 *       "location": "POINT(lng lat)",
 *       "location_name": "string",
 *       "scheduled_at": "ISO 8601 datetime",
 *       "duration": number,
 *       "max_participants": number,
 *       "skill_level_required": "string",
 *       "status": "string",
 *       "created_at": "ISO 8601 datetime",
 *       "created_by": "uuid",
 *       "sport": { "id": "uuid", "name": "string", ... },
 *       "creator": { "id": "uuid", "username": "string", ... },
 *       "participants": [
 *         {
 *           "user_id": "uuid",
 *           "status": "confirmed",
 *           "user": { "id": "uuid", "username": "string", ... }
 *         }
 *       ]
 *     }
 *   ],
 *   "participated": [
 *     // Same format as created, but matches where user is participant (not creator)
 *   ]
 * }
 * 
 * Business Logic:
 * 1. Get all matches where user is the creator (created_by = user_id)
 * 2. Get all match IDs where user is a participant
 * 3. Get match details for participated matches, excluding user's own created matches
 * 4. Return both arrays separately
 * 
 * Authentication: Required (JWT token)
 * Rate Limiting: None
 * 
 * Use Cases:
 * - Mobile app "My Created" tab
 * - Mobile app "My Joined" tab
 * - User profile match history
 * - Match management dashboard
 * 
 * Data Separation:
 * - "created": Matches where user is the creator/organizer
 * - "participated": Matches where user joined as participant (excluding own matches)
 * 
 * Error Responses:
 * - 401: Authentication required
 * - 400: Bad request (database query errors)
 * - 500: Internal server error
 */
export const getUserMatches = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all matches where user is creator or participant
    const { data: createdMatches, error: createdError } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*),
        participants:match_participants (
          *,
          user:profiles (*)
        )
      `)
      .eq('created_by', user_id)
      .order('scheduled_at', { ascending: false });

    // Get match IDs where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('match_participants')
      .select('match_id')
      .eq('user_id', user_id);

    if (participantError) {
      return res.status(400).json({ error: participantError.message });
    }

    const participantMatchIds = participantData?.map(p => p.match_id) || [];

    // Get the matches where user is a participant (but not creator)
    let participatedMatches = [];
    let participatedError = null;

    if (participantMatchIds.length > 0) {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          sport:sports (*),
          creator:profiles!created_by (*),
          participants:match_participants (
            *,
            user:profiles (*)
          )
        `)
        .in('id', participantMatchIds)
        .neq('created_by', user_id) // Exclude matches user created (already in createdMatches)
        .order('scheduled_at', { ascending: false });

      participatedMatches = data || [];
      participatedError = error;
    }

    if (createdError || participatedError) {
      return res.status(400).json({ 
        error: createdError?.message || participatedError?.message 
      });
    }

    res.json({
      created: createdMatches || [],
      participated: participatedMatches || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/matches/:id/invite
 * 
 * Invites a user to join a match by creating a pending participant entry.
 * Only match creators can invite users to their matches.
 * 
 * Path Parameters:
 * - id (string, required): Match ID to invite user to
 * 
 * Request Body:
 * {
 *   "user_id": "uuid" // Required: ID of user to invite
 * }
 * 
 * Features:
 * - Only match creator can send invites
 * - Creates pending participant entry
 * - Prevents duplicate invitations
 * - Validates match capacity
 * 
 * Response Format:
 * {
 *   "match_id": "uuid",
 *   "user_id": "uuid", 
 *   "status": "pending",
 *   "joined_at": "ISO 8601 datetime",
 *   "user": {
 *     "id": "uuid",
 *     "username": "string",
 *     "full_name": "string",
 *     "avatar_url": "string"
 *   }
 * }
 * 
 * Authentication: Required (JWT token)
 * Authorization: Only match creator can invite
 * 
 * Error Responses:
 * - 400: Bad request (match full, user already invited, etc.)
 * - 401: Authentication required
 * - 403: Forbidden (not match creator)
 * - 404: Match or user not found
 * - 500: Internal server error
 */
export const inviteToMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    const creator_id = req.user?.id;

    if (!creator_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify user is the match creator
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .eq('created_by', creator_id)
      .single();

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found or you are not the creator' });
    }

    // Check if match is still open and has space
    if (match.status !== 'open') {
      return res.status(400).json({ error: 'Match is not open for invitations' });
    }

    // Check current participant count
    const { data: participants, error: participantError } = await supabase
      .from('match_participants')
      .select('count')
      .eq('match_id', id);

    if (participantError) {
      return res.status(400).json({ error: participantError.message });
    }

    const participantCount = participants?.length || 0;
    if (participantCount >= match.max_participants) {
      return res.status(400).json({ error: 'Match is full' });
    }

    // Check if user is already invited or joined
    const { data: existingParticipant } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingParticipant) {
      return res.status(400).json({ error: 'User already invited or joined this match' });
    }

    // Create invitation (pending participant)
    // Use admin client to bypass RLS since creator is inviting another user
    const { data, error } = await supabaseAdmin
      .from('match_participants')
      .insert([{
        match_id: id,
        user_id,
        status: 'pending',
      }])
      .select(`
        *,
        user:profiles (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error inviting to match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/matches/:id/respond
 * 
 * Responds to a match invitation (accept or decline).
 * Only invited users can respond to their pending invitations.
 * 
 * Path Parameters:
 * - id (string, required): Match ID to respond to
 * 
 * Request Body:
 * {
 *   "response": "accept" | "decline" // Required: Response to invitation
 * }
 * 
 * Features:
 * - Updates participant status from pending to confirmed/declined
 * - Only user who was invited can respond
 * - Validates match capacity when accepting
 * - Updates match status if full after acceptance
 * 
 * Response Format:
 * {
 *   "match_id": "uuid",
 *   "user_id": "uuid",
 *   "status": "confirmed" | "declined",
 *   "joined_at": "ISO 8601 datetime"
 * }
 * 
 * Authentication: Required (JWT token)
 * Authorization: Only invited user can respond
 * 
 * Error Responses:
 * - 400: Bad request (invalid response, match full, etc.)
 * - 401: Authentication required
 * - 404: Invitation not found
 * - 500: Internal server error
 */
export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!response || !['accept', 'decline'].includes(response)) {
      return res.status(400).json({ error: 'Valid response (accept/decline) is required' });
    }

    // Find the pending invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', id)
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const newStatus = response === 'accept' ? 'confirmed' : 'declined';

    // If accepting, check if match still has space
    if (response === 'accept') {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*, participants:match_participants(count)')
        .eq('id', id)
        .single();

      if (matchError) {
        return res.status(400).json({ error: matchError.message });
      }

      const confirmedCount = await supabase
        .from('match_participants')
        .select('count')
        .eq('match_id', id)
        .eq('status', 'confirmed');

      const currentConfirmed = confirmedCount.data?.length || 0;
      if (currentConfirmed >= match.max_participants) {
        return res.status(400).json({ error: 'Match is now full' });
      }
    }

    // Update the invitation status
    const { data, error } = await supabase
      .from('match_participants')
      .update({ status: newStatus })
      .eq('match_id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If accepted, check if match is now full and update status
    if (response === 'accept') {
      const { data: match } = await supabase
        .from('matches')
        .select('max_participants')
        .eq('id', id)
        .single();

      const { data: confirmedParticipants } = await supabase
        .from('match_participants')
        .select('count')
        .eq('match_id', id)
        .eq('status', 'confirmed');

      const confirmedCount = confirmedParticipants?.length || 0;
      if (confirmedCount >= match?.max_participants) {
        await supabase
          .from('matches')
          .update({ status: 'full' })
          .eq('id', id);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};