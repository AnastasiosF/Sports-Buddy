import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Badge,
} from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import { useMatchInvitations } from '../contexts/MatchInvitationsContext';
import { locationService } from '../services/locationService';
import { matchService } from '../services/matchService';
import { useThemeColors } from '../hooks/useThemeColors';
import { MatchInvitationNotification } from '../components';
import {
  Profile,
  Match,
  formatDistance,
  formatDateTime,
  getInitials,
} from '@sports-buddy/shared-types';

interface NearbyUser extends Profile {
  distance: number;
}

interface NearbyMatch extends Match {
  distance: number;
}

const { width } = Dimensions.get('window');

export const MainDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { location, loading: locationLoading, updateLocation } = useLocation();
  const { user } = useAuth();
  const { friends, pendingRequests } = useFriends();
  const { receivedInvitations, joinRequests } = useMatchInvitations();
  const colors = useThemeColors();
  
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [nearbyMatches, setNearbyMatches] = useState<NearbyMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (location) {
      loadDashboardData();
    }
  }, [location]);

  const loadDashboardData = async () => {
    if (!location) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadNearbyUsers(),
        loadNearbyMatches(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyUsers = async () => {
    if (!location) return;
    
    try {
      const params = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 10000, // 10km
      };
      const response = await locationService.findNearbyUsers(params);
      setNearbyUsers(response.users.slice(0, 3)); // Limit to 3 for dashboard
    } catch (error) {
      console.error('Failed to load nearby users:', error);
    }
  };

  const loadNearbyMatches = async () => {
    if (!location) return;
    
    try {
      const params = {
        location: `${location.latitude},${location.longitude}`,
        radius: 10000,
      };
      const matchesData = await matchService.getMatches(params);
      // Add distance property to matches for dashboard display
      const matchesWithDistance = matchesData.map(match => ({
        ...match,
        distance: 0, // Default distance, could be calculated from location
      }));
      setNearbyMatches(matchesWithDistance.slice(0, 3)); // Limit to 3 for dashboard
    } catch (error) {
      console.error('Failed to load nearby matches:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await updateLocation();
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderFriendsSection = () => (
    <Card containerStyle={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Friends</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Friends' as never)}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {(pendingRequests.length > 0 || receivedInvitations.length > 0 || joinRequests.length > 0) && (
        <View style={styles.notificationsContainer}>
          {pendingRequests.length > 0 && (
            <View style={styles.notificationItem}>
              <Text style={styles.notificationText}>
                {pendingRequests.length} friend request{pendingRequests.length > 1 ? 's' : ''}
              </Text>
              <Badge
                value={pendingRequests.length}
                status="warning"
                containerStyle={styles.notificationBadge}
              />
            </View>
          )}
          {receivedInvitations.length > 0 && (
            <View style={styles.notificationItem}>
              <Text style={styles.notificationText}>
                {receivedInvitations.length} match invitation{receivedInvitations.length > 1 ? 's' : ''}
              </Text>
              <Badge
                value={receivedInvitations.length}
                status="primary"
                containerStyle={styles.notificationBadge}
              />
            </View>
          )}
          {joinRequests.length > 0 && (
            <View style={styles.notificationItem}>
              <Text style={styles.notificationText}>
                {joinRequests.length} join request{joinRequests.length > 1 ? 's' : ''}
              </Text>
              <Badge
                value={joinRequests.length}
                status="success"
                containerStyle={styles.notificationBadge}
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.friendsList}>
        {friends.slice(0, 4).map((friendship, index) => (
          <TouchableOpacity
            key={friendship.connection_id}
            style={styles.friendItem}
            onPress={() => console.log('View friend profile:', friendship.friend.id)}
          >
            <Avatar
              rounded
              size="medium"
              source={friendship.friend.avatar_url ? { uri: friendship.friend.avatar_url } : undefined}
              title={getInitials(friendship.friend.full_name || friendship.friend.username)}
              containerStyle={[
                styles.friendAvatar,
                { backgroundColor: friendship.friend.avatar_url ? 'transparent' : colors.primary }
              ]}
              titleStyle={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}
            />
            <Text style={styles.friendName} numberOfLines={1}>
              {friendship.friend.username}
            </Text>
          </TouchableOpacity>
        ))}
        
        {friends.length === 0 && (
          <View style={styles.emptyFriends}>
            <Ionicons name="person-add-outline" size={32} color="#ccc" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>Find sports buddies nearby!</Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderNearbyMatchesSection = () => (
    <Card containerStyle={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="location" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Nearby Matches</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Matches' as never)}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {nearbyMatches.length > 0 ? (
        nearbyMatches.map((match) => (
          <TouchableOpacity
            key={match.id}
            style={styles.matchItem}
            onPress={() => console.log('View match details:', match.id)}
          >
            <View style={styles.matchHeader}>
              <View style={styles.matchInfo}>
                <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>
                <Text style={styles.matchSport}>{match.sport?.name}</Text>
                <View style={styles.matchLocation}>
                  <Ionicons name="location-outline" size={12} color="#666" />
                  <Text style={styles.matchDistance}>
                    {formatDistance(match.distance)} away
                  </Text>
                </View>
              </View>
              <View style={styles.matchBadges}>
                <Badge
                  value={match.status.toUpperCase()}
                  status={match.status === 'open' ? 'success' : 'warning'}
                  containerStyle={styles.statusBadge}
                />
                <Text style={styles.matchTime}>
                  {formatDateTime(match.scheduled_at).split(' ')[1]}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyMatches}>
          <Ionicons name="basketball-outline" size={32} color="#ccc" />
          <Text style={styles.emptyText}>No matches nearby</Text>
          <Text style={styles.emptySubtext}>Create one or expand your search!</Text>
        </View>
      )}
    </Card>
  );

  const renderQuickActions = () => (
    <Card containerStyle={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.quickActionItem, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('CreateMatch' as never)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.quickActionText}>Create Match</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionItem, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('MatchSearch' as never)}
        >
          <Ionicons name="search" size={24} color="white" />
          <Text style={styles.quickActionText}>Find Matches</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="location" size={48} color={colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MatchInvitationNotification />
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Welcome back, {(user as any)?.user_metadata?.username || user?.email?.split('@')[0] || 'Sports Buddy'}!
        </Text>
        <Text style={styles.welcomeSubtext}>
          Ready to find your next sports adventure?
        </Text>
      </View>

      {renderFriendsSection()}
      {renderNearbyMatchesSection()}
      {renderQuickActions()}
      
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
  },
  sectionCard: {
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  notificationsContainer: {
    marginBottom: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notificationBadge: {
    marginVertical: 0,
  },
  friendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  friendItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 15,
  },
  friendAvatar: {
    marginBottom: 5,
  },
  friendName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyFriends: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMatches: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  matchItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  matchSport: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 4,
  },
  matchLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDistance: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  matchBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: 5,
  },
  matchTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});