import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Avatar, Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../contexts/FriendsContext';
import { getInitials } from '@sports-buddy/shared-types';
import { useThemeColors } from '../hooks/useThemeColors';

interface PendingRequest {
  id: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export const FriendRequestNotification: React.FC = () => {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();

  useEffect(() => {
    if (pendingRequests.length > 0 && !isVisible) {
      showNotification();
    } else if (pendingRequests.length === 0 && isVisible) {
      hideNotification();
    }
  }, [pendingRequests.length]);

  // Reset current index if it's out of bounds
  useEffect(() => {
    if (currentRequestIndex >= pendingRequests.length && pendingRequests.length > 0) {
      setCurrentRequestIndex(0);
    }
  }, [pendingRequests.length, currentRequestIndex]);


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
    if (pendingRequests.length === 0) return;

    const currentRequest = pendingRequests[currentRequestIndex];
    setLoading(true);

    try {
      await acceptFriendRequest(currentRequest.id);
      
      // Adjust current index if needed
      if (currentRequestIndex >= pendingRequests.length - 1 && pendingRequests.length > 1) {
        setCurrentRequestIndex(pendingRequests.length - 2);
      }

      Alert.alert('Success', `You are now friends with ${currentRequest.user.username}!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (pendingRequests.length === 0) return;

    const currentRequest = pendingRequests[currentRequestIndex];
    setLoading(true);

    try {
      await rejectFriendRequest(currentRequest.id);
      
      // Adjust current index if needed
      if (currentRequestIndex >= pendingRequests.length - 1 && pendingRequests.length > 1) {
        setCurrentRequestIndex(pendingRequests.length - 2);
      }

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (pendingRequests.length > 1) {
      setCurrentRequestIndex((prevIndex) => 
        prevIndex === pendingRequests.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevious = () => {
    if (pendingRequests.length > 1) {
      setCurrentRequestIndex((prevIndex) => 
        prevIndex === 0 ? pendingRequests.length - 1 : prevIndex - 1
      );
    }
  };

  const handleDismiss = () => {
    hideNotification();
    // Show again after 5 minutes if there are still pending requests
    setTimeout(() => {
      if (pendingRequests.length > 0) {
        showNotification();
      }
    }, 5 * 60 * 1000);
  };

  if (pendingRequests.length === 0 || !isVisible) {
    return null;
  }

  const currentRequest = pendingRequests[currentRequestIndex];

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
        {/* Left section with avatar and info */}
        <View style={styles.leftSection}>
          <Avatar
            rounded
            size="small"
            source={currentRequest.user.avatar_url ? { uri: currentRequest.user.avatar_url } : undefined}
            title={getInitials(currentRequest.user.full_name || currentRequest.user.username)}
            containerStyle={styles.avatar}
            titleStyle={{ fontSize: 12, fontWeight: 'bold' }}
          />
          <View style={styles.textSection}>
            <Text style={styles.requestText}>
              <Text style={styles.username}>{currentRequest.user.username}</Text>
              {' '}wants to be friends
            </Text>
            {pendingRequests.length > 1 && (
              <Text style={styles.counter}>
                {currentRequestIndex + 1} of {pendingRequests.length} requests
              </Text>
            )}
          </View>
        </View>

        {/* Navigation arrows (if multiple requests) */}
        {pendingRequests.length > 1 && (
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
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
  requestText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  username: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  counter: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
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