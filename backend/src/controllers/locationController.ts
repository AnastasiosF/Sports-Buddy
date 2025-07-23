import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { calculateDistance, DEFAULT_SEARCH_RADIUS } from '@sports-buddy/shared-types';

// Find nearby users within specified radius
export const findNearbyUsers = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = DEFAULT_SEARCH_RADIUS, sport_id, skill_level } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = parseInt(radius as string);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    // Build the query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_sports (
          *,
          sport:sports (*)
        )
      `)
      .not('location', 'is', null);

    // Filter by sport if specified
    if (sport_id) {
      query = query.filter('user_sports.sport_id', 'eq', sport_id);
    }

    // Filter by skill level if specified
    if (skill_level && skill_level !== 'any') {
      query = query.or(`skill_level.eq.${skill_level},user_sports.skill_level.eq.${skill_level}`);
    }

    const { data: users, error } = await query.limit(100);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Filter by distance and add distance calculation
    const nearbyUsers = users
      .map((user: any) => {
        if (!user.location) return null;
        
        // Parse PostGIS POINT format: POINT(lng lat)
        const locationMatch = user.location.match(/POINT\(([^\s]+)\s+([^\s]+)\)/);
        if (!locationMatch) return null;

        const userLng = parseFloat(locationMatch[1]);
        const userLat = parseFloat(locationMatch[2]);
        
        const distance = calculateDistance(
          { latitude: lat, longitude: lng },
          { latitude: userLat, longitude: userLng }
        );

        return {
          ...user,
          location: { latitude: userLat, longitude: userLng },
          distance: Math.round(distance)
        };
      })
      .filter((user: any) => user && user.distance <= searchRadius)
      .sort((a: any, b: any) => a.distance - b.distance);

    res.json({
      users: nearbyUsers,
      count: nearbyUsers.length,
      searchParams: {
        latitude: lat,
        longitude: lng,
        radius: searchRadius,
        sport_id,
        skill_level
      }
    });
  } catch (error) {
    console.error('Find nearby users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Find nearby matches within specified radius
export const findNearbyMatches = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = DEFAULT_SEARCH_RADIUS, sport_id, skill_level, date_from, date_to } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = parseInt(radius as string);

    // Build the query
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
      .eq('status', 'open')
      .gte('scheduled_at', new Date().toISOString())
      .not('location', 'is', null);

    // Filter by sport if specified
    if (sport_id) {
      query = query.eq('sport_id', sport_id);
    }

    // Filter by skill level if specified
    if (skill_level && skill_level !== 'any') {
      query = query.eq('skill_level_required', skill_level);
    }

    // Filter by date range if specified
    if (date_from) {
      query = query.gte('scheduled_at', date_from);
    }
    if (date_to) {
      query = query.lte('scheduled_at', date_to);
    }

    const { data: matches, error } = await query.limit(100);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Filter by distance and add distance calculation
    const nearbyMatches = matches
      .map((match: any) => {
        if (!match.location) return null;
        
        // Parse PostGIS POINT format: POINT(lng lat)
        const locationMatch = match.location.match(/POINT\(([^\s]+)\s+([^\s]+)\)/);
        if (!locationMatch) return null;

        const matchLng = parseFloat(locationMatch[1]);
        const matchLat = parseFloat(locationMatch[2]);
        
        const distance = calculateDistance(
          { latitude: lat, longitude: lng },
          { latitude: matchLat, longitude: matchLng }
        );

        return {
          ...match,
          location: { latitude: matchLat, longitude: matchLng },
          distance: Math.round(distance)
        };
      })
      .filter((match: any) => match && match.distance <= searchRadius)
      .sort((a: any, b: any) => a.distance - b.distance);

    res.json({
      matches: nearbyMatches,
      count: nearbyMatches.length,
      searchParams: {
        latitude: lat,
        longitude: lng,
        radius: searchRadius,
        sport_id,
        skill_level,
        date_from,
        date_to
      }
    });
  } catch (error) {
    console.error('Find nearby matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user's location
export const updateUserLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, location_name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    // Convert to PostGIS POINT format
    const locationPoint = `POINT(${lng} ${lat})`;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        location: locationPoint,
        location_name: location_name || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Location updated successfully',
      profile: {
        ...data,
        location: { latitude: lat, longitude: lng }
      }
    });
  } catch (error) {
    console.error('Update user location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get popular sports areas (locations with most matches/users)
export const getPopularAreas = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 50000 } = req.query; // Default 50km radius

    let baseQuery = `
      SELECT 
        location_name,
        COUNT(*) as activity_count,
        ST_X(ST_Centroid(ST_Collect(location))) as avg_lng,
        ST_Y(ST_Centroid(ST_Collect(location))) as avg_lat
      FROM (
        SELECT location_name, location FROM matches WHERE location IS NOT NULL
        UNION ALL
        SELECT location_name, location FROM profiles WHERE location IS NOT NULL
      ) combined
      WHERE location_name IS NOT NULL
      GROUP BY location_name
      HAVING COUNT(*) >= 2
      ORDER BY activity_count DESC
      LIMIT 20;
    `;

    const { data, error } = await supabase.rpc('execute_sql', { sql: baseQuery });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      areas: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Get popular areas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};