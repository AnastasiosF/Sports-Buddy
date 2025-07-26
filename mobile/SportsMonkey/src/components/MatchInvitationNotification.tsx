import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Avatar } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { matchService } from '../services/matchService';
import { Match, MatchParticipant } from '../types';

interface MatchInvitation {
  id: string;
  match_id: string;
  user_id: string;
  status: 'pending';
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

interface MatchInvitationNotificationProps {
  invitations: MatchInvitation[];
  onInvitationResponded: (invitationId: string) => void;
}

export const MatchInvitationNotification: React.FC<MatchInvitationNotificationProps> = ({
  invitations,
  onInvitationResponded,
}) => {
  const [currentInvitationIndex, setCurrentInvitationIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();

  useEffect(() => {
    if (invitations.length > 0 && !isVisible) {
      showNotification();
    } else if (invitations.length === 0 && isVisible) {
      hideNotification();
    }
  }, [invitations.length]);

  // Reset current index if it's out of bounds
  useEffect(() => {
    if (currentInvitationIndex >= invitations.length && invitations.length > 0) {
      setCurrentInvitationIndex(0);
    }
  }, [invitations.length, currentInvitationIndex]);

  const showNotification = () => {
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideNotification = () => {
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleAccept = async () => {
    if (invitations.length === 0) return;

    const currentInvitation = invitations[currentInvitationIndex];
    setLoading(true);

    try {
      await matchService.respondToInvitation(currentInvitation.match_id, 'accept');
      
      onInvitationResponded(currentInvitation.id);
      
      // Adjust current index if needed
      if (currentInvitationIndex >= invitations.length - 1 && invitations.length > 1) {
        setCurrentInvitationIndex(invitations.length - 2);
      }

      Alert.alert(
        'Success!', 
        `You've joined "${currentInvitation.match.title}". Check your matches to see details.`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept match invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (invitations.length === 0) return;

    const currentInvitation = invitations[currentInvitationIndex];
    setLoading(true);

    try {
      await matchService.respondToInvitation(currentInvitation.match_id, 'decline');
      
      onInvitationResponded(currentInvitation.id);
      
      // Adjust current index if needed
      if (currentInvitationIndex >= invitations.length - 1 && invitations.length > 1) {
        setCurrentInvitationIndex(invitations.length - 2);
      }

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline match invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (invitations.length > 1) {
      setCurrentInvitationIndex((prevIndex) => 
        prevIndex === invitations.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevious = () => {
    if (invitations.length > 1) {
      setCurrentInvitationIndex((prevIndex) => 
        prevIndex === 0 ? invitations.length - 1 : prevIndex - 1
      );
    }
  };

  const handleDismiss = () => {
    hideNotification();
    // Show again after 5 minutes if there are still pending invitations
    setTimeout(() => {
      if (invitations.length > 0) {
        showNotification();
      }
    }, 5 * 60 * 1000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (invitations.length === 0 || !isVisible) {
    return null;
  }

  const currentInvitation = invitations[currentInvitationIndex];
  const match = currentInvitation.match;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        {/* Header with sport icon */}
        <View style={styles.header}>
          <View style={styles.sportIcon}>
            <Ionicons name="basketball-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.headerText}>Match Invitation</Text>
          {invitations.length > 1 && (
            <Text style={styles.counter}>
              {currentInvitationIndex + 1} of {invitations.length}
            </Text>
          )}
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Left section with creator info */}
          <View style={styles.leftSection}>
            <Avatar
              rounded
              size="small"
              source={match.creator?.avatar_url ? { uri: match.creator.avatar_url } : undefined}
              title={match.creator?.username[0]?.toUpperCase() || '?'}
              containerStyle={styles.avatar}
              titleStyle={{ fontSize: 12, fontWeight: 'bold' }}
            />
            <View style={styles.textSection}>
              <Text style={styles.inviteText}>
                <Text style={styles.username}>{match.creator?.username}</Text>
                {' '}invited you to play{' '}
                <Text style={styles.sportName}>{match.sport?.name}</Text>
              </Text>
              <Text style={styles.matchTitle}>{match.title}</Text>
              <Text style={styles.details}>
                <Ionicons name="time-outline" size={12} color="#666" />
                {' '}{formatDate(match.scheduled_at)}
              </Text>
              <Text style={styles.details}>
                <Ionicons name="location-outline" size={12} color="#666" />
                {' '}{match.location_name}
              </Text>
            </View>
          </View>

          {/* Navigation arrows (if multiple invitations) */}
          {invitations.length > 1 && (
            <View style={styles.navigationSection}>
              <TouchableOpacity
                onPress={handlePrevious}
                style={styles.navButton}
                disabled={loading}
              >
                <Ionicons name="chevron-back" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                style={styles.navButton}
                disabled={loading}
              >
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              onPress={handleReject}
              style={[styles.actionButton, styles.rejectButton]}
              disabled={loading}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              style={[styles.actionButton, styles.acceptButton]}
              disabled={loading}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            disabled={loading}
          >
            <Ionicons name="close" size={14} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingTop: 45, // Account for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportIcon: {
    marginRight: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  counter: {
    fontSize: 11,
    color: '#666',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#2196F3',
    marginRight: 10,
  },
  textSection: {
    flex: 1,
  },
  inviteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  username: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  sportName: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  matchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  details: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  navigationSection: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  navButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
});