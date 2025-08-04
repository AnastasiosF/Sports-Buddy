import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import {
  Text,
  Card,
  Button,
  SearchBar,
  Avatar,
  Badge,
  ButtonGroup,
  Slider,
  Icon
} from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import { locationService } from '../services/locationService';
import { sportsService } from '../services/sportsService';
import { FriendRequestNotification, MatchInvitationNotification } from '../components';
import { useAppTheme } from '../hooks/useThemeColors';
import {
  Profile,
  Sport,
  UserSearchResult,
  formatDistance,
  getInitials,
  capitalize
} from '@sports-buddy/shared-types';

interface NearbyUser extends Profile {
  distance: number;
}

interface FriendSuggestion extends Profile {
  distance_km: number;
  distance_meters: number;
  mutual_sports_count: number;
  mutual_friends_count: number;
  suggestion_score: number;
  relationship_status: 'friends' | 'request_sent' | 'request_received' | 'none';
}

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

const { width } = Dimensions.get('window');

export const NearbyPeopleScreen: React.FC = () => {
  const { location, loading: locationLoading, updateLocation } = useLocation();
  const { user, session } = useAuth();
  const theme = useAppTheme();
  const {
    friends,
    pendingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    removeFriend,
    refreshAll
  } = useFriends();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSportIndex, setSelectedSportIndex] = useState(0);
  const [skillLevelIndex, setSkillLevelIndex] = useState(0);
  const [searchRadius, setSearchRadius] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnimation] = useState(new Animated.Value(0));
  const [activeTab, setActiveTab] = useState(0); // 0: Nearby, 1: Friends, 2: Suggestions, 3: Search
  const [isSearching, setIsSearching] = useState(false);
  const [nearbySearchText, setNearbySearchText] = useState('');
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const sportOptions = ['All Sports', ...sports.map(sport => sport.name)];
  const skillLevels = ['Any Level', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const tabs = ['Nearby', 'Friends', 'Suggestions', 'Search'];
  
  const styles = createStyles(theme);

  // Memoize icon objects to prevent SearchBar re-renders
  const searchIcon = useMemo(() => ({ name: 'search', size: 20, color: theme.colors.textSecondary }), [theme.colors.textSecondary]);
  const clearIcon = useMemo(() => ({ name: 'clear', size: 20, color: theme.colors.textSecondary }), [theme.colors.textSecondary]);

  useEffect(() => {
    loadSports();
  }, []);

  useEffect(() => {
    if (location && activeTab === 0) {
      searchNearbyUsers();
    }
  }, [location, selectedSportIndex, skillLevelIndex, searchRadius, activeTab]);

  useEffect(() => {
    if (activeTab === 2) {
      loadFriendSuggestions();
    } else if (activeTab === 3 && searchText.length >= 3) {
      const timeoutId = setTimeout(() => {
        handleUserSearch();
      }, 800); // Increased debounce time for better UX
      return () => clearTimeout(timeoutId);
    } else if (activeTab === 3 && searchText.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchText, activeTab]);

  const loadSports = async () => {
    try {
      const sportsData = await sportsService.getAllSports();
      setSports(sportsData);
    } catch (error) {
      console.error('Failed to load sports:', error);
    }
  };

  const loadFriendSuggestions = async () => {
    if (!session?.access_token) return;

    setLoadingSuggestions(true);
    try {
      const { friendsService } = await import('../services/friendsService');
      const response = await friendsService.getFriendSuggestions(
        searchRadius / 1000, // Convert to km
        session.access_token
      );
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to load friend suggestions:', error);
      Alert.alert('Error', 'Unable to load friend suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };


  const searchNearbyUsers = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please allow location access to find nearby people.');
      return;
    }

    setLoading(true);
    try {
      const params = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: searchRadius,
        sport_id: selectedSportIndex > 0 ? sports[selectedSportIndex - 1]?.id : undefined,
        skill_level: skillLevelIndex > 0 ? skillLevels[skillLevelIndex].toLowerCase() as any : undefined,
      };

      const response = await locationService.findNearbyUsers(params);
      setUsers(response.users);
    } catch (error) {
      console.error('Failed to search nearby users:', error);
      Alert.alert('Search Failed', 'Unable to find nearby people. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (forceSearch = false) => {
    if (!session?.access_token || (!forceSearch && searchText.length < 3)) return;

    setIsSearching(true);
    try {
      // Import friendsService locally for this function since it's not in context
      const { friendsService } = await import('../services/friendsService');
      const response = await friendsService.searchUsers(searchText.trim(), session.access_token);
      setSearchResults(response.users);
    } catch (error) {
      console.error('Failed to search users:', error);
      Alert.alert('Search Failed', 'Unable to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (activeTab === 3 && searchText.trim().length >= 2) {
      handleUserSearch(true);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    try {
      await sendFriendRequest(friendId);
      Alert.alert('Success', 'Friend request sent!');

      // Update search results and suggestions
      setSearchResults(prev => prev.map(user =>
        user.id === friendId
          ? { ...user, relationship_status: 'request_sent' }
          : user
      ));
      setSuggestions(prev => prev.map(user =>
        user.id === friendId
          ? { ...user, relationship_status: 'request_sent' }
          : user
      ));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptFriendRequest = async (connectionId: string) => {
    try {
      await acceptFriendRequest(connectionId);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    }
  };

  const handleRejectFriendRequest = async (connectionId: string) => {
    try {
      await rejectFriendRequest(connectionId);
      Alert.alert('Success', 'Friend request rejected');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!session?.access_token) return;

    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
              Alert.alert('Success', 'Friend removed');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);

    Animated.spring(filterAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 0) {
      await updateLocation();
      await searchNearbyUsers();
    } else if (activeTab === 1) {
      await refreshAll();
    } else if (activeTab === 2) {
      await loadFriendSuggestions();
    } else if (activeTab === 3 && searchText.length >= 3) {
      await handleUserSearch();
    }
    setRefreshing(false);
  }, [location, selectedSportIndex, skillLevelIndex, searchRadius, activeTab, searchText, updateLocation, searchNearbyUsers, refreshAll, handleUserSearch]);

  const getSkillLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return theme.colors.success;
      case 'intermediate': return theme.colors.warning;
      case 'advanced': return theme.colors.primary;
      case 'expert': return theme.colors.secondary;
      default: return theme.colors.textSecondary;
    }
  };

  const getActionButton = (item: UserSearchResult | NearbyUser | FriendSuggestion) => {
    if ('relationship_status' in item) {
      switch (item.relationship_status) {
        case 'friends':
          return (
            <Button
              title="Friends"
              buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              titleStyle={{ color: theme.colors.surface, fontSize: 20 }}
              disabled
              icon={<Ionicons name="checkmark" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
            />
          );
        case 'request_sent':
          return (
            <Button
              title="Request Sent"
              buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
              titleStyle={{ color: theme.colors.surface, fontSize: 14 }}
              disabled
              icon={<Ionicons name="time" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
            />
          );
        case 'request_received':
          return (
            <Button
              title="Accept Request"
              buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              titleStyle={{ color: theme.colors.surface, fontSize: 14 }}
              onPress={() => item.connection_id && handleAcceptFriendRequest(item.connection_id)}
              icon={<Ionicons name="person-add" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
            />
          );
        default:
          return (
            <Button
              title="Add Friend"
              buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              titleStyle={{ color: theme.colors.surface, fontSize: 14 }}
              onPress={() => handleSendFriendRequest(item.id)}
              icon={<Ionicons name="person-add" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
            />
          );
      }
    }

    return (
      <Button
        title="Send Message"
        buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        titleStyle={{ color: theme.colors.surface, fontSize: 14 }}
        onPress={() => console.log('Send message to:', item.id)}
        icon={<Ionicons name="chatbubble-outline" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
      />
    );
  };

  const renderUserItem = ({ item }: { item: NearbyUser | UserSearchResult | Friend | FriendSuggestion }) => {
    const profile = 'friend' in item ? item.friend : item;
    const isNearbyUser = 'distance' in item;
    const isSuggestion = activeTab === 2 && 'suggestion_score' in item;

    return (
      <Card containerStyle={styles.userCard}>
        <View style={styles.cardHeader}>
          <View style={styles.userHeader}>
            <Avatar
              rounded
              size="large"
              source={profile.avatar_url ? { uri: profile.avatar_url } : undefined}
              title={getInitials(profile.full_name || profile.username)}
              containerStyle={[
                styles.avatar,
                { backgroundColor: profile.avatar_url ? 'transparent' : theme.colors.primary }
              ]}
              titleStyle={{ color: theme.colors.surface, fontSize: 18, fontWeight: 'bold' }}
            />
            <View style={styles.userInfo}>
              <Text style={styles.username}>{profile.username}</Text>
              {profile.full_name && (
                <Text style={styles.fullName}>{profile.full_name}</Text>
              )}
              <View style={styles.locationContainer}>
                <Icon name="location-on" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.distance}>
                  {isNearbyUser || isSuggestion
                    ? `${formatDistance(isSuggestion ? ((item as any).distance_km * 1000) : (item as NearbyUser).distance)} away`
                    : profile.location_name || 'Location not set'
                  }
                </Text>
              </View>
              {isSuggestion && (item as any).mutual_sports_count > 0 && (
                <View style={styles.locationContainer}>
                  <Icon name="sports" size={16} color={theme.colors.success} />
                  <Text style={[styles.distance, { color: theme.colors.success }]}>
                    {(item as any).mutual_sports_count} mutual sport{(item as any).mutual_sports_count > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {isSuggestion && (item as any).mutual_friends_count > 0 && (
                <View style={styles.locationContainer}>
                  <Icon name="people" size={16} color={theme.colors.secondary} />
                  <Text style={[styles.distance, { color: theme.colors.secondary }]}>
                    {(item as any).mutual_friends_count} mutual friend{(item as any).mutual_friends_count > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.badges}>
            {isSuggestion && (
              <Badge
                value="Suggested"
                badgeStyle={[styles.skillBadge, { backgroundColor: theme.colors.info }]}
                textStyle={styles.badgeText}
              />
            )}
            {profile.skill_level && (
              <Badge
                value={capitalize(profile.skill_level)}
                badgeStyle={[
                  styles.skillBadge,
                  { backgroundColor: getSkillLevelColor(profile.skill_level) }
                ]}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>

        {profile.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            title="View Profile"
            type="clear"
            buttonStyle={styles.actionButton}
            titleStyle={styles.clearButtonText}
            icon={<Ionicons name="person-outline" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />}
            onPress={() => console.log('View profile:', profile.id)}
          />

          {activeTab === 1 ? (
            <Button
              title="Remove"
              buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.error }]}
              titleStyle={{ color: theme.colors.surface, fontSize: 14 }}
              onPress={() => handleRemoveFriend(profile.id)}
              icon={<Ionicons name="person-remove" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
            />
          ) : (
            getActionButton(item as UserSearchResult | NearbyUser | FriendSuggestion)
          )}
        </View>
      </Card>
    );
  };

  const renderPendingRequest = ({ item }: { item: PendingRequest }) => (
    <Card containerStyle={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userHeader}>
          <Avatar
            rounded
            size="large"
            source={item.user.avatar_url ? { uri: item.user.avatar_url } : undefined}
            title={getInitials(item.user.full_name || item.user.username)}
            containerStyle={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            titleStyle={{ color: theme.colors.surface, fontSize: 18, fontWeight: 'bold' }}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.user.username}</Text>
            {item.user.full_name && (
              <Text style={styles.fullName}>{item.user.full_name}</Text>
            )}
            <Text style={styles.requestTime}>
              Sent {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Accept"
          buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.success }]}
          titleStyle={{ color: theme.colors.surface, fontSize: 14 }}
          onPress={() => handleAcceptFriendRequest(item.id)}
          icon={<Ionicons name="checkmark" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
        />
        <Button
          title="Reject"
          buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          titleStyle={{ color: theme.colors.surface, fontSize: 14 }}
          onPress={() => handleRejectFriendRequest(item.id)}
          icon={<Ionicons name="close" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
        />
      </View>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {activeTab === 0 ? 'Find Sports Buddies' :
           activeTab === 1 ? 'My Friends' :
           activeTab === 2 ? 'Friend Suggestions' : 'Search Friends'}
        </Text>
        <Text style={styles.subtitle}>
          {activeTab === 0 ? `${users.length} ${users.length === 1 ? 'person' : 'people'} nearby` :
           activeTab === 1 ? `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}` :
           activeTab === 2 ? `${suggestions.length} ${suggestions.length === 1 ? 'suggestion' : 'suggestions'} found` :
           'Search by username'}
        </Text>
      </View>

      {/* Tab Selector */}
      <ButtonGroup
        buttons={tabs}
        selectedIndex={activeTab}
        onPress={setActiveTab}
        containerStyle={styles.tabContainer}
        buttonStyle={styles.tabButton}
        textStyle={styles.tabText}
        selectedButtonStyle={styles.selectedTabButton}
        selectedTextStyle={styles.selectedTabText}
      />

      {/* Pending Requests Badge */}
      {activeTab === 1 && pendingRequests.length > 0 && (
        <View style={styles.pendingRequestsHeader}>
          <Text style={styles.pendingRequestsTitle}>
            Pending Requests ({pendingRequests.length})
          </Text>
        </View>
      )}

      {activeTab === 3 ? (
        <SearchBar
          placeholder="Search by username... (Press enter to search)"
          value={searchText}
          onChangeText={(text: string) => setSearchText(text)}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          containerStyle={styles.searchContainer}
          inputContainerStyle={styles.searchInput}
          inputStyle={styles.searchInputText}
          searchIcon={searchIcon}
          clearIcon={clearIcon}
          showLoading={isSearching}
        />
      ) : activeTab === 0 && (
        <>
          <SearchBar
            placeholder="Search by name or location..."
            value={nearbySearchText}
            onChangeText={(text: string) => setNearbySearchText(text)}
            returnKeyType="search"
            containerStyle={styles.searchContainer}
            inputContainerStyle={styles.searchInput}
            inputStyle={styles.searchInputText}
            searchIcon={searchIcon}
            clearIcon={clearIcon}
            showLoading={loading}
          />

          <View style={styles.filterToggleContainer}>
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={toggleFilters}
              activeOpacity={0.7}
            >
              <Icon name="tune" size={20} color={theme.colors.primary} />
              <Text style={styles.filterToggleText}>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Text>
              <Icon
                name={showFilters ? 'expand-less' : 'expand-more'}
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.filtersContainer,
              {
                maxHeight: filterAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
                opacity: filterAnimation,
              },
            ]}
          >
            <View style={styles.filterSection}>
              <View style={styles.filterLabelContainer}>
                <Icon name="sports" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.filterLabel}>Sport</Text>
              </View>
              <ButtonGroup
                buttons={sportOptions.map(option => option.length > 8 ? option.substring(0, 8) + '...' : option)}
                selectedIndex={selectedSportIndex}
                onPress={setSelectedSportIndex}
                containerStyle={styles.buttonGroup}
                buttonStyle={styles.filterButton}
                textStyle={styles.buttonText}
                selectedButtonStyle={styles.selectedButton}
                innerBorderStyle={styles.buttonBorder}
              />
            </View>

            <View style={styles.filterSection}>
              <View style={styles.filterLabelContainer}>
                <Icon name="trending-up" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.filterLabel}>Skill Level</Text>
              </View>
              <ButtonGroup
                buttons={skillLevels.map(level => level.split(' ')[0])}
                selectedIndex={skillLevelIndex}
                onPress={setSkillLevelIndex}
                containerStyle={styles.buttonGroup}
                buttonStyle={styles.filterButton}
                textStyle={styles.buttonText}
                selectedButtonStyle={styles.selectedButton}
              />
            </View>

            <View style={styles.filterSection}>
              <View style={styles.filterLabelContainer}>
                <Icon name="location-on" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.filterLabel}>Search Radius: {formatDistance(searchRadius)}</Text>
              </View>
              <Slider
                value={searchRadius}
                onValueChange={setSearchRadius}
                minimumValue={1000}
                maximumValue={50000}
                step={1000}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
                minimumTrackTintColor={theme.colors.primary}
                style={styles.slider}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1km</Text>
                <Text style={styles.sliderLabel}>50km</Text>
              </View>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );

  const getCurrentData = () => {
    if (activeTab === 0) {
      return users.filter(user =>
        nearbySearchText === '' ||
        user.username.toLowerCase().includes(nearbySearchText.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(nearbySearchText.toLowerCase()) ||
        user.location_name?.toLowerCase().includes(nearbySearchText.toLowerCase())
      );
    } else if (activeTab === 1) {
      return friends;
    } else if (activeTab === 2) {
      return suggestions;
    } else {
      return searchResults;
    }
  };

  const getEmptyComponent = () => {
    if (activeTab === 0) {
      return !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Sports Buddies Found</Text>
          <Text style={styles.emptyText}>
            {nearbySearchText || selectedSportIndex > 0 || skillLevelIndex > 0
              ? 'Try adjusting your search filters or expanding your search radius'
              : 'No one is nearby right now. Try increasing your search radius or check back later'
            }
          </Text>
          <Button
            title="Refresh"
            buttonStyle={styles.refreshButton}
            titleStyle={styles.refreshButtonText}
            onPress={onRefresh}
            icon={<Ionicons name="refresh" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
          />
        </View>
      ) : (
        <View style={styles.searchingContainer}>
          <Ionicons name="search" size={48} color="#2196F3" />
          <Text style={styles.searchingText}>Searching for sports buddies...</Text>
        </View>
      );
    } else if (activeTab === 1) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Friends Yet</Text>
          <Text style={styles.emptyText}>
            Use the Search tab to find and add friends, or check out our Suggestions!
          </Text>
        </View>
      );
    } else if (activeTab === 2) {
      return !loadingSuggestions ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bulb-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Suggestions Found</Text>
          <Text style={styles.emptyText}>
            {!location 
              ? 'Enable location access to get personalized friend suggestions based on your area and sports interests.'
              : 'No suggestions available right now. Try expanding your search radius or check back later.'}
          </Text>
          {!location && (
            <Button
              title="Enable Location"
              buttonStyle={styles.refreshButton}
              titleStyle={styles.refreshButtonText}
              onPress={() => updateLocation()}
              icon={<Ionicons name="location" size={16} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
            />
          )}
        </View>
      ) : (
        <View style={styles.searchingContainer}>
          <Ionicons name="bulb" size={48} color="#2196F3" />
          <Text style={styles.searchingText}>Finding personalized suggestions...</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchText.length < 3 ? 'Start Searching' : 'No Users Found'}
          </Text>
          <Text style={styles.emptyText}>
            {searchText.length < 3
              ? 'Type at least 3 characters or press enter to search for users'
              : 'No users found matching your search. Try a different username.'
            }
          </Text>
        </View>
      );
    }
  };

  if (locationLoading && activeTab === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="location" size={48} color="#2196F3" />
        <Text style={styles.loadingText}>Getting your location...</Text>
        <Text style={styles.loadingSubtext}>
          We need your location to find nearby sports buddies
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FriendRequestNotification />
      <MatchInvitationNotification />
      <FlatList
        data={activeTab === 1 && pendingRequests.length > 0
          ? [...pendingRequests, ...getCurrentData()]
          : getCurrentData()
        }
        renderItem={({ item, index }) => {
          if (activeTab === 1 && index < pendingRequests.length) {
            return renderPendingRequest({ item: item as PendingRequest });
          }
          return renderUserItem({
            item: activeTab === 1 && pendingRequests.length > 0
              ? (getCurrentData()[index - pendingRequests.length] as Friend)
              : item as NearbyUser | UserSearchResult | Friend | FriendSuggestion
          });
        }}
        keyExtractor={(item, index) =>
          activeTab === 1 && index < pendingRequests.length
            ? `request-${(item as PendingRequest).id}`
            : `user-${('friend' in item ? item.friend.id : item.id)}-${index}`
        }
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={getEmptyComponent()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={getCurrentData().length === 0 ? styles.emptyList : styles.listContent}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  tabContainer: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
  },
  tabButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  selectedTabButton: {
    backgroundColor: theme.colors.primary,
  },
  selectedTabText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  pendingRequestsHeader: {
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  pendingRequestsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 25,
    paddingHorizontal: theme.spacing.md,
  },
  searchInputText: {
    fontSize: theme.fontSize.md,
  },
  filterToggleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterToggleText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginHorizontal: 8,
  },
  filtersContainer: {
    overflow: 'hidden',
  },
  filterSection: {
    marginVertical: 10,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  buttonGroup: {
    marginBottom: 5,
    borderRadius: 8,
    borderColor: '#e0e0e0',
  },
  filterButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 12,
    color: '#666',
  },
  selectedButton: {
    backgroundColor: '#2196F3',
  },
  buttonBorder: {
    width: 1,
    color: '#e0e0e0',
  },
  slider: {
    marginVertical: 10,
  },
  sliderThumb: {
    backgroundColor: '#2196F3',
    width: 20,
    height: 20,
  },
  sliderTrack: {
    backgroundColor: '#e0e0e0',
    height: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingBottom: 100,
  },
  userCard: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0,
  },
  cardHeader: {
    marginBottom: theme.spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    marginRight: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  fullName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distance: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 20,
  },
  badges: {
    alignItems: 'flex-end',
  },
  skillBadge: {
    paddingHorizontal: 10,
    marginVertical: 0,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  bioContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: 25,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  emptyList: {
    flexGrow: 1,
  },
});
