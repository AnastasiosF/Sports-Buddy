import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

// Send friend request
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { friend_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!friend_id) {
      return res.status(400).json({ error: 'Friend ID is required' });
    }

    if (user_id === friend_id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('user_connections')
      .select('*')
      .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
      .single();

    if (existingConnection) {
      return res.status(400).json({ 
        error: existingConnection.status === 'accepted' 
          ? 'Already friends' 
          : 'Friend request already exists' 
      });
    }

    // Create friend request
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
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Friend request sent successfully',
      connection: data
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { connection_id } = req.params;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Update the connection status
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
      return res.status(404).json({ error: 'Friend request not found or already processed' });
    }

    res.json({
      message: 'Friend request accepted',
      connection: data
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
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
    console.error('Reject friend request error:', error);
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
    console.error('Remove friend error:', error);
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
    console.error('Get friends error:', error);
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
    console.error('Get pending requests error:', error);
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
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};