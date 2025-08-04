import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { dbLogger } from '../middleware/logging';

// Send friend request
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { friend_id } = req.body || {};
    
    logger.info('Friend request initiated', {
      userId: user_id,
      friendId: friend_id,
      ip: req.ip
    });

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!friend_id) {
      logger.warn('Friend request failed - missing friend_id', {
        userId: user_id,
        requestBody: req.body,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Friend ID is required' });
    }

    if (user_id === friend_id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if connection already exists
    dbLogger('SELECT', 'user_connections', { user_id, friend_id, action: 'check_existing' });
    const { data: existingConnection } = await supabase
      .from('user_connections')
      .select('*')
      .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
      .single();

    if (existingConnection) {
      logger.warn('Friend request failed - connection exists', {
        userId: user_id,
        friendId: friend_id,
        existingStatus: existingConnection.status,
        ip: req.ip
      });
      return res.status(400).json({ 
        error: existingConnection.status === 'accepted' 
          ? 'Already friends' 
          : 'Friend request already exists' 
      });
    }

    // Create friend request
    dbLogger('INSERT', 'user_connections', { user_id, friend_id, status: 'pending' });
    const { data, error } = await supabase
      .from('user_connections')
      .insert([{
        user_id,
        friend_id,
        status: 'pending'
      }])
      .select(`
        *,
        friend:profiles!user_connections_friend_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .single();

    if (error) {
      logger.error('Friend request database error', {
        userId: user_id,
        friendId: friend_id,
        error: error.message,
        ip: req.ip
      });
      return res.status(400).json({ error: error.message });
    }

    logger.info('Friend request sent successfully', {
      userId: user_id,
      friendId: friend_id,
      connectionId: data.id,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Friend request sent successfully',
      connection: data
    });
  } catch (error) {
    logger.error('Send friend request unexpected error', {
      userId: req.user?.id,
      friendId: req.body?.friend_id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { connection_id } = req.params;
    
    logger.info('Friend request acceptance initiated', {
      userId: user_id,
      connectionId: connection_id,
      ip: req.ip
    });

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Update the connection status
    dbLogger('UPDATE', 'user_connections', { connection_id, status: 'accepted', user_id });
    const { data, error } = await supabase
      .from('user_connections')
      .update({ status: 'accepted' })
      .eq('id', connection_id)
      .eq('friend_id', user_id) // Only the receiver can accept
      .eq('status', 'pending')
      .select(`
        *,
        user:profiles!user_connections_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .single();

    if (error || !data) {
      logger.warn('Friend request acceptance failed', {
        userId: user_id,
        connectionId: connection_id,
        error: error?.message,
        ip: req.ip
      });
      return res.status(404).json({ error: 'Friend request not found or already processed' });
    }

    logger.info('Friend request accepted successfully', {
      userId: user_id,
      connectionId: connection_id,
      senderId: data.user_id,
      ip: req.ip
    });

    res.json({
      message: 'Friend request accepted',
      connection: data
    });
  } catch (error) {
    logger.error('Accept friend request unexpected error', {
      userId: req.user?.id,
      connectionId: req.params.connection_id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { connection_id } = req.params;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Delete the connection (reject)
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .eq('id', connection_id)
      .eq('friend_id', user_id) // Only the receiver can reject
      .eq('status', 'pending');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    logger.error('Reject friend request unexpected error', {
      userId: req.user?.id,
      connectionId: req.params.connection_id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove friend
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { friend_id } = req.params;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Delete the friendship (both directions)
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
      .eq('status', 'accepted');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    logger.error('Remove friend unexpected error', {
      userId: req.user?.id,
      friendId: req.params.friend_id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's friends
export const getFriends = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get accepted friend connections
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        created_at,
        user_id,
        friend_id,
        friend:profiles!user_connections_friend_id_fkey (
          id, username, full_name, avatar_url, bio, skill_level, location_name
        ),
        user:profiles!user_connections_user_id_fkey (
          id, username, full_name, avatar_url, bio, skill_level, location_name
        )
      `)
      .or(`user_id.eq.${user_id},friend_id.eq.${user_id}`)
      .eq('status', 'accepted');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Format the response to always show the friend (not the current user)
    const friends = data.map(connection => {
      const friend = connection.user_id === user_id ? connection.friend : connection.user;
      return {
        connection_id: connection.id,
        friend,
        created_at: connection.created_at
      };
    });

    res.json({ friends });
  } catch (error) {
    logger.error('Get friends unexpected error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        created_at,
        user:profiles!user_connections_user_id_fkey (
          id, username, full_name, avatar_url, bio, skill_level
        )
      `)
      .eq('friend_id', user_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ requests: data });
  } catch (error) {
    logger.error('Get pending requests unexpected error', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search users by username or email
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { query } = req.query;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Search profiles by username or email (email is in auth.users)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, username, full_name, avatar_url, bio, skill_level, location_name
      `)
      .ilike('username', `%${query}%`)
      .neq('id', user_id)
      .limit(20);

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    // Get current user's connections to determine relationship status
    const { data: connections } = await supabase
      .from('user_connections')
      .select('id, friend_id, user_id, status')
      .or(`user_id.eq.${user_id},friend_id.eq.${user_id}`);

    // Add relationship status to each profile
    const profilesWithStatus = profiles.map(profile => {
      const connection = connections?.find(conn => 
        (conn.user_id === user_id && conn.friend_id === profile.id) ||
        (conn.friend_id === user_id && conn.user_id === profile.id)
      );

      let relationshipStatus = 'none';
      if (connection) {
        if (connection.status === 'accepted') {
          relationshipStatus = 'friends';
        } else if (connection.user_id === user_id) {
          relationshipStatus = 'request_sent';
        } else {
          relationshipStatus = 'request_received';
        }
      }

      return {
        ...profile,
        relationship_status: relationshipStatus,
        connection_id: connection?.id
      };
    });

    res.json({ users: profilesWithStatus });
  } catch (error) {
    logger.error('Search users unexpected error', {
      userId: req.user?.id,
      query: req.query.query,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get friend suggestions based on location and sports interests
export const getFriendSuggestions = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { radius = 10 } = req.query; // Default 10km radius

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current user's profile and location
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select(`
        id, location, location_name,
        user_sports (
          sport_id,
          skill_level,
          sports (name)
        )
      `)
      .eq('id', user_id)
      .single();

    if (userError || !currentUser?.location) {
      logger.warn('Friend suggestions failed - user location issue', {
        userId: user_id,
        userError: userError?.message,
        hasUser: !!currentUser,
        hasLocation: !!currentUser?.location,
        ip: req.ip
      });
      return res.status(400).json({ error: 'User location required for suggestions' });
    }
    
    logger.info('Friend suggestions request started', {
      userId: user_id,
      radius: radius,
      userLocation: currentUser.location,
      ip: req.ip
    });

    // Get current user's connections (friends and pending requests)
    const { data: connections } = await supabase
      .from('user_connections')
      .select('friend_id, user_id, status')
      .or(`user_id.eq.${user_id},friend_id.eq.${user_id}`);

    // Get friend IDs to exclude from suggestions
    const excludeIds = [user_id];
    connections?.forEach(conn => {
      if (conn.user_id === user_id) {
        excludeIds.push(conn.friend_id);
      } else {
        excludeIds.push(conn.user_id);
      }
    });

    // Find nearby users with mutual sports interests
    logger.info('Calling get_friend_suggestions RPC', {
      userId: user_id,
      excludeIds: excludeIds,
      searchRadius: parseInt(radius as string) * 1000,
      ip: req.ip
    });
    
    const { data: suggestions, error: suggestionsError } = await supabase
      .rpc('get_friend_suggestions_v2', {
        current_user_id: user_id,
        user_location: currentUser.location,
        search_radius: parseInt(radius as string) * 1000, // Convert km to meters
        exclude_user_ids: excludeIds
      });

    if (suggestionsError) {
      logger.error('Friend suggestions database error', {
        userId: user_id,
        error: suggestionsError.message,
        code: suggestionsError.code,
        details: suggestionsError.details,
        hint: suggestionsError.hint,
        radius: radius,
        excludeIds: excludeIds,
        ip: req.ip
      });
      return res.status(500).json({ error: 'Failed to get suggestions' });
    }
    
    logger.info('Friend suggestions RPC completed successfully', {
      userId: user_id,
      suggestionsCount: suggestions?.length || 0,
      ip: req.ip
    });

    // Add relationship status to suggestions
    const suggestionsWithStatus = suggestions.map((suggestion: any) => ({
      ...suggestion,
      relationship_status: 'none',
      distance_km: Math.round(suggestion.distance_meters / 1000 * 10) / 10 // Round to 1 decimal
    }));

    res.json({ suggestions: suggestionsWithStatus });
  } catch (error) {
    logger.error('Get friend suggestions unexpected error', {
      userId: req.user?.id,
      radius: req.query.radius,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};