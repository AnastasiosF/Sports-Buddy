import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Avatar, Card, Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useMatchInvitations } from '../contexts/MatchInvitationsContext';
import { getInitials, formatDateTime } from '@sports-buddy/shared-types';

const { width, height } = Dimensions.get('window');

export const JoinRequestsNotification: React.FC = () => {
  const { joinRequests, acceptJoinRequest, declineJoinRequest } = useMatchInvitations();
  const [isVisible, setIsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState<string | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    if (joinRequests.length > 0) {
      showNotification();
    } else {
      hideNotification();
    }
  }, [joinRequests.length]);

  const showNotification = () => {
    setIsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideNotification = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleAcceptRequest = async (requestId: string) => {
    setLoading(requestId);
    try {
      await acceptJoinRequest(requestId);
    } catch (error) {
      // Error handling is done in context
    } finally {
      setLoading(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setLoading(requestId);
    try {
      await declineJoinRequest(requestId);
    } catch (error) {
      // Error handling is done in context
    } finally {
      setLoading(null);
    }
  };

  const renderJoinRequest = ({ item }: { item: any }) => (
    <Card containerStyle={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Avatar
          rounded
          size="medium"
          source={item.user.avatar_url ? { uri: item.user.avatar_url } : undefined}
          title={getInitials(item.user.full_name || item.user.username)}
          containerStyle={[styles.avatar, { backgroundColor: colors.primary }]}
          titleStyle={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.username}>{item.user.username}</Text>
          {item.user.full_name && (
            <Text style={styles.fullName}>{item.user.full_name}</Text>
          )}
          <Text style={styles.requestText}>
            wants to join "{item.match.title}"
          </Text>
          <View style={styles.matchDetails}>
            <Text style={styles.matchSport}>{item.match.sport?.name}</Text>
            <Text style={styles.matchTime}>
              {formatDateTime(item.match.scheduled_at)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Decline"
          buttonStyle={[styles.actionButton, styles.declineButton]}
          titleStyle={{ fontSize: 12 }}
          onPress={() => handleDeclineRequest(item.id)}
          loading={loading === item.id}
          disabled={loading !== null}
          icon={<Ionicons name="close" size={14} color="white" style={{ marginRight: 5 }} />}
        />
        <Button
          title="Accept"
          buttonStyle={[styles.actionButton, styles.acceptButton]}
          titleStyle={{ fontSize: 12 }}
          onPress={() => handleAcceptRequest(item.id)}
          loading={loading === item.id}
          disabled={loading !== null}
          icon={<Ionicons name="checkmark" size={14} color="white" style={{ marginRight: 5 }} />}
        />
      </View>
    </Card>
  );

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Notification Badge */}
      <Animated.View
        style={[
          styles.notificationBadge,
          {
            opacity: fadeAnim,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.badgeContent}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={16} color="white" />
          <Text style={styles.badgeText}>
            {joinRequests.length} join request{joinRequests.length > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Full Screen Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Join Requests</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={joinRequests}
            renderItem={renderJoinRequest}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Join Requests</Text>
                <Text style={styles.emptyText}>
                  When someone wants to join your matches, you'll see their requests here.
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  notificationBadge: {
    position: 'absolute',
    top: 100,
    right: 20,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1001,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  listContainer: {
    padding: 15,
  },
  requestCard: {
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 0,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  avatar: {
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  fullName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  matchDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  matchSport: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginRight: 10,
  },
  matchTime: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});