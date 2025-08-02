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
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/MainStack';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import { useMatchInvitations } from '../contexts/MatchInvitationsContext';
import { locationService } from '../services/locationService';
import { matchService } from '../services/matchService';
import { useAppTheme } from '../hooks/useThemeColors';
import { MatchInvitationNotification, FAB } from '../components';
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
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { location, loading: locationLoading, updateLocation } = useLocation();
  const { user } = useAuth();
  const { friends, pendingRequests } = useFriends();
  const { receivedInvitations, joinRequests } = useMatchInvitations();
  const theme = useAppTheme();
  const styles = createStyles(theme);
  
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
          <Ionicons name="people" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Friends</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Friends')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
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
                { backgroundColor: friendship.friend.avatar_url ? 'transparent' : theme.colors.primary }
              ]}
              titleStyle={{ color: theme.colors.surface, fontSize: 14, fontWeight: 'bold' }}
            />
            <Text style={styles.friendName} numberOfLines={1}>
              {friendship.friend.username}
            </Text>
          </TouchableOpacity>
        ))}
        
        {friends.length === 0 && (
          <View style={styles.emptyFriends}>
            <Ionicons name="person-add-outline" size={32} color={theme.colors.border} />
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
          <Ionicons name="location" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Nearby Matches</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Matches')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
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
                  <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
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
          <Ionicons name="basketball-outline" size={32} color={theme.colors.border} />
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
        <Button
          title="Create Match"
          onPress={() => navigation.navigate('CreateMatch')}
          buttonStyle={[styles.quickActionButton, { backgroundColor: theme.colors.success }]}
          titleStyle={styles.quickActionButtonText}
          icon={
            <Ionicons 
              name="add-circle" 
              size={20} 
              color={theme.colors.surface}
              style={{ marginRight: theme.spacing.sm }}
            />
          }
        />
        
        <Button
          title="Find Matches"
          onPress={() => navigation.navigate('MatchSearch')}
          buttonStyle={[styles.quickActionButton, { backgroundColor: theme.colors.primary }]}
          titleStyle={styles.quickActionButtonText}
          icon={
            <Ionicons 
              name="search" 
              size={20} 
              color={theme.colors.surface}
              style={{ marginRight: theme.spacing.sm }}
            />
          }
        />
      </View>
    </Card>
  );

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="location" size={48} color={theme.colors.primary} />
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
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
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
      {renderQuickActions()}
      {renderFriendsSection()}
      {renderNearbyMatchesSection()}
      
        <View style={styles.bottomSpacing} />
      </ScrollView>
      <FAB />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  welcomeSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  welcomeText: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  sectionCard: {
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
    marginRight: theme.spacing.xs,
  },
  notificationsContainer: {
    marginBottom: theme.spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notificationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
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
    marginBottom: theme.spacing.md,
  },
  friendAvatar: {
    marginBottom: theme.spacing.xs,
  },
  friendName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyFriends: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyMatches: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  matchItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  matchSport: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  matchLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDistance: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  matchBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: theme.spacing.xs,
  },
  matchTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minHeight: 60,
  },
  quickActionButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
  },
  quickActionText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },
});