import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { friendsService } from '../services/friendsService';
import { Profile } from '@sports-buddy/shared-types';

interface Friend {
  connection_id: string;
  friend: Profile;
  created_at: string;
}

interface PendingRequest {
  id: string;
  created_at: string;
  user: Profile;
}

interface FriendsContextType {
  friends: Friend[];
  pendingRequests: PendingRequest[];
  loading: boolean;
  refreshFriends: () => Promise<void>;
  refreshPendingRequests: () => Promise<void>;
  refreshAll: () => Promise<void>;
  acceptFriendRequest: (connectionId: string) => Promise<void>;
  rejectFriendRequest: (connectionId: string) => Promise<void>;
  sendFriendRequest: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Load friends and pending requests when session changes
  useEffect(() => {
    if (session?.access_token) {
      refreshAll();
      
      // Set up periodic refresh for pending requests (every 30 seconds)
      const interval = setInterval(() => {
        refreshPendingRequests();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Clear data when not authenticated
      setFriends([]);
      setPendingRequests([]);
    }
  }, [session?.access_token]);

  const refreshFriends = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await friendsService.getFriends(session.access_token);
      setFriends(response.friends);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  }, [session?.access_token]);

  const refreshPendingRequests = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await friendsService.getPendingRequests(session.access_token);
      setPendingRequests(response.requests);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
    }
  }, [session?.access_token]);

  const refreshAll = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      await Promise.all([
        refreshFriends(),
        refreshPendingRequests(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [refreshFriends, refreshPendingRequests]);

  const acceptFriendRequest = useCallback(async (connectionId: string) => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    try {
      await friendsService.acceptFriendRequest(connectionId, session.access_token);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      // Refresh friends list to include the new friend
      await refreshFriends();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  }, [session?.access_token, refreshFriends]);

  const rejectFriendRequest = useCallback(async (connectionId: string) => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    try {
      await friendsService.rejectFriendRequest(connectionId, session.access_token);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      throw error;
    }
  }, [session?.access_token]);

  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    try {
      await friendsService.sendFriendRequest({ friend_id: friendId }, session.access_token);
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  }, [session?.access_token]);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    try {
      await friendsService.removeFriend(friendId, session.access_token);
      
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.friend.id !== friendId));
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }, [session?.access_token]);

  const value = {
    friends,
    pendingRequests,
    loading,
    refreshFriends,
    refreshPendingRequests,
    refreshAll,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    removeFriend,
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};