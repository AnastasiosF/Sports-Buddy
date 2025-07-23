-- Migration for Friends Feature
-- This migration adds necessary indexes and RLS policies for the friends system
-- The friends system uses the existing user_connections table

-- Create indexes for better performance on friend requests and friends queries
CREATE INDEX IF NOT EXISTS idx_user_connections_requester_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee_id ON user_connections(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);
CREATE INDEX IF NOT EXISTS idx_user_connections_created_at ON user_connections(created_at);

-- Composite index for common friend queries
CREATE INDEX IF NOT EXISTS idx_user_connections_status_users ON user_connections(status, user_id, friend_id);

-- Index for searching pending requests efficiently
CREATE INDEX IF NOT EXISTS idx_user_connections_pending_requests ON user_connections(friend_id, status) WHERE status = 'pending';

-- Index for searching accepted friends efficiently  
CREATE INDEX IF NOT EXISTS idx_user_connections_friends ON user_connections(user_id, friend_id, status) WHERE status = 'accepted';

-- Add RLS policies for user_connections table
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connections (as requester or addressee)
CREATE POLICY user_connections_select_own ON user_connections
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Users can create friend requests (as requester)
CREATE POLICY user_connections_insert_own ON user_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: Users can update connections where they are the addressee (accept/reject requests)
CREATE POLICY user_connections_update_addressee ON user_connections
    FOR UPDATE
    USING (auth.uid() = friend_id AND status = 'pending')
    WITH CHECK (auth.uid() = friend_id AND status IN ('accepted', 'rejected'));

-- Policy: Users can delete connections where they are involved (remove friends or cancel requests)
CREATE POLICY user_connections_delete_own ON user_connections
    FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create a function to search users by username for friend requests
CREATE OR REPLACE FUNCTION search_users_for_friends(search_query TEXT, current_user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    relationship_status TEXT,
    connection_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.bio,
        CASE 
            WHEN uc_sent.id IS NOT NULL AND uc_sent.status = 'accepted' THEN 'friends'
            WHEN uc_received.id IS NOT NULL AND uc_received.status = 'accepted' THEN 'friends'
            WHEN uc_sent.id IS NOT NULL AND uc_sent.status = 'pending' THEN 'request_sent'
            WHEN uc_received.id IS NOT NULL AND uc_received.status = 'pending' THEN 'request_received'
            ELSE 'none'
        END::TEXT as relationship_status,
        COALESCE(uc_sent.id, uc_received.id) as connection_id
    FROM profiles p
    LEFT JOIN user_connections uc_sent ON (uc_sent.user_id = current_user_id AND uc_sent.friend_id = p.id)
    LEFT JOIN user_connections uc_received ON (uc_received.user_id = p.id AND uc_received.friend_id = current_user_id)
    WHERE 
        p.id != current_user_id 
        AND (
            p.username ILIKE '%' || search_query || '%' 
            OR p.full_name ILIKE '%' || search_query || '%'
        )
    ORDER BY p.username
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_users_for_friends(TEXT, UUID) TO authenticated;

-- Create a function to get user's friends list
CREATE OR REPLACE FUNCTION get_user_friends(current_user_id UUID)
RETURNS TABLE (
    connection_id UUID,
    friend_id UUID,
    friend_username TEXT,
    friend_full_name TEXT,
    friend_avatar_url TEXT,
    friend_bio TEXT,
    friend_location_name TEXT,
    friend_skill_level TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id as connection_id,
        p.id as friend_id,
        p.username as friend_username,
        p.full_name as friend_full_name,
        p.avatar_url as friend_avatar_url,
        p.bio as friend_bio,
        p.location_name as friend_location_name,
        p.skill_level as friend_skill_level,
        uc.created_at
    FROM user_connections uc
    JOIN profiles p ON (
        CASE 
            WHEN uc.user_id = current_user_id THEN p.id = uc.friend_id
            ELSE p.id = uc.user_id
        END
    )
    WHERE 
        (uc.user_id = current_user_id OR uc.friend_id = current_user_id)
        AND uc.status = 'accepted'
    ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the friends function
GRANT EXECUTE ON FUNCTION get_user_friends(UUID) TO authenticated;

-- Create a function to get pending friend requests for a user
CREATE OR REPLACE FUNCTION get_pending_friend_requests(current_user_id UUID)
RETURNS TABLE (
    connection_id UUID,
    requester_id UUID,
    requester_username TEXT,
    requester_full_name TEXT,
    requester_avatar_url TEXT,
    requester_bio TEXT,
    requester_location_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id as connection_id,
        p.id as requester_id,
        p.username as requester_username,
        p.full_name as requester_full_name,
        p.avatar_url as requester_avatar_url,
        p.bio as requester_bio,
        p.location_name as requester_location_name,
        uc.created_at
    FROM user_connections uc
    JOIN profiles p ON p.id = uc.user_id
    WHERE 
        uc.friend_id = current_user_id
        AND uc.status = 'pending'
    ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the pending requests function
GRANT EXECUTE ON FUNCTION get_pending_friend_requests(UUID) TO authenticated;

-- Add constraint to prevent duplicate friend requests
ALTER TABLE user_connections 
ADD CONSTRAINT unique_connection_per_pair 
UNIQUE (user_id, friend_id);

-- Add constraint to prevent self-friend requests
ALTER TABLE user_connections 
ADD CONSTRAINT no_self_connections 
CHECK (user_id != friend_id);