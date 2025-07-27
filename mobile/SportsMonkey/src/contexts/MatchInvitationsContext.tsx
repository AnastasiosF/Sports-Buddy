import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { matchService } from '../services/matchService';

interface MatchInvitation {
  id: string;
  match_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  joined_at: string;
  match: {
    id: string;
    title: string;
    sport?: {
      name: string;
    };
    creator?: {
      username: string;
      full_name?: string;
      avatar_url?: string;
    };
    scheduled_at: string;
    location_name: string;
  };
}

interface MatchJoinRequest {
  id: string;
  match_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  match: {
    id: string;
    title: string;
    sport?: {
      name: string;
    };
    creator?: {
      username: string;
      full_name?: string;
      avatar_url?: string;
    };
    scheduled_at: string;
    location_name: string;
  };
  user: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface MatchInvitationsContextType {
  // Received invitations (others inviting you)
  receivedInvitations: MatchInvitation[];
  // Sent invitations (you invited others)
  sentInvitations: MatchInvitation[];
  // Join requests to your matches
  joinRequests: MatchJoinRequest[];
  loading: boolean;
  
  // Actions
  refreshInvitations: () => Promise<void>;
  acceptInvitation: (matchId: string) => Promise<void>;
  declineInvitation: (matchId: string) => Promise<void>;
  acceptJoinRequest: (requestId: string) => Promise<void>;
  declineJoinRequest: (requestId: string) => Promise<void>;
  sendMatchInvitation: (matchId: string, userId: string) => Promise<void>;
  requestToJoinMatch: (matchId: string) => Promise<void>;
}

const MatchInvitationsContext = createContext<MatchInvitationsContextType | undefined>(undefined);

interface MatchInvitationsProviderProps {
  children: ReactNode;
}

export const MatchInvitationsProvider: React.FC<MatchInvitationsProviderProps> = ({ children }) => {
  const { user, session } = useAuth();
  const [receivedInvitations, setReceivedInvitations] = useState<MatchInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<MatchInvitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<MatchJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && session) {
      refreshInvitations();
      // Set up periodic refresh
      const interval = setInterval(refreshInvitations, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, session]);

  const refreshInvitations = async (retryCount = 0) => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      // Use Promise.allSettled to handle individual endpoint failures gracefully
      const [receivedResult, joinRequestsResult] = await Promise.allSettled([
        matchService.getPendingInvitations(),
        matchService.getJoinRequests(),
      ]);
      
      // Handle received invitations
      if (receivedResult.status === 'fulfilled') {
        setReceivedInvitations(receivedResult.value);
      } else {
        console.error('Failed to get received invitations:', receivedResult.reason);
        setReceivedInvitations([]);
        // Only show alert for non-authentication errors
        if (!receivedResult.reason?.message?.includes('Authentication expired')) {
          // Don't show alert for every failed request to avoid spam
          console.warn('Invitations could not be loaded');
        }
      }
      
      // Handle join requests
      if (joinRequestsResult.status === 'fulfilled') {
        setJoinRequests(joinRequestsResult.value);
      } else {
        console.error('Failed to get join requests:', joinRequestsResult.reason);
        setJoinRequests([]);
        // Only show alert for non-authentication errors
        if (!joinRequestsResult.reason?.message?.includes('Authentication expired')) {
          // Don't show alert for every failed request to avoid spam
          console.warn('Join requests could not be loaded');
        }
      }
    } catch (error) {
      console.error('Failed to refresh invitations:', error);
      // Set empty arrays as fallback
      setReceivedInvitations([]);
      setJoinRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (matchId: string) => {
    try {
      await matchService.respondToInvitation(matchId, 'accept');
      
      // Remove from received invitations
      setReceivedInvitations(prev => 
        prev.filter(inv => inv.match_id !== matchId)
      );
      
      Alert.alert('Success', 'You have joined the match!');
      await refreshInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
      throw error;
    }
  };

  const declineInvitation = async (matchId: string) => {
    try {
      await matchService.respondToInvitation(matchId, 'decline');
      
      // Remove from received invitations
      setReceivedInvitations(prev => 
        prev.filter(inv => inv.match_id !== matchId)
      );
      
      await refreshInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline invitation');
      throw error;
    }
  };

  const acceptJoinRequest = async (requestId: string) => {
    try {
      await matchService.acceptJoinRequest(requestId);
      
      // Remove from join requests
      setJoinRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      Alert.alert('Success', 'Join request accepted!');
      await refreshInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept join request');
      throw error;
    }
  };

  const declineJoinRequest = async (requestId: string) => {
    try {
      await matchService.declineJoinRequest(requestId);
      
      // Remove from join requests
      setJoinRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      await refreshInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline join request');
      throw error;
    }
  };

  const sendMatchInvitation = async (matchId: string, userId: string) => {
    try {
      await matchService.inviteToMatch(matchId, userId);
      Alert.alert('Success', 'Invitation sent!');
      await refreshInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
      throw error;
    }
  };

  const requestToJoinMatch = async (matchId: string) => {
    try {
      // Instead of directly joining, send a join request
      await matchService.joinMatch(matchId);
      Alert.alert(
        'Request Sent', 
        'Your request to join the match has been sent to the organizer. You will be notified when they respond.'
      );
      await refreshInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send join request');
      throw error;
    }
  };

  const value: MatchInvitationsContextType = {
    receivedInvitations,
    sentInvitations,
    joinRequests,
    loading,
    refreshInvitations,
    acceptInvitation,
    declineInvitation,
    acceptJoinRequest,
    declineJoinRequest,
    sendMatchInvitation,
    requestToJoinMatch,
  };

  return (
    <MatchInvitationsContext.Provider value={value}>
      {children}
    </MatchInvitationsContext.Provider>
  );
};

export const useMatchInvitations = (): MatchInvitationsContextType => {
  const context = useContext(MatchInvitationsContext);
  if (!context) {
    throw new Error('useMatchInvitations must be used within a MatchInvitationsProvider');
  }
  return context;
};