import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  SearchBar, 
  Badge,
  ButtonGroup,
  Slider
} from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useMatchInvitations } from '../contexts/MatchInvitationsContext';
import { locationService } from '../services/locationService';
import { sportsService } from '../services/sportsService';
import { matchService } from '../services/matchService';
import { FriendRequestNotification, MatchInvitationNotification } from '../components';
import { JoinRequestsNotification } from '../components/JoinRequestsNotification';
import { useAppTheme } from '../hooks/useThemeColors';
import { Match, Sport, formatDistance, formatDateTime, formatDuration } from '../types';

interface NearbyMatch extends Match {
  distance: number;
}

export const NearbyMatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { location, loading: locationLoading, updateLocation } = useLocation();
  const { user } = useAuth();
  const { requestToJoinMatch } = useMatchInvitations();
  const theme = useAppTheme();
  const [matches, setMatches] = useState<NearbyMatch[]>([]);
  const [userMatches, setUserMatches] = useState<{ created: Match[], participated: Match[] }>({ created: [], participated: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSportIndex, setSelectedSportIndex] = useState(0);
  const [skillLevelIndex, setSkillLevelIndex] = useState(0);
  const [searchRadius, setSearchRadius] = useState(10000); // 10km default
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setSearchText(''); // Clear search when switching tabs
  };

  const sportOptions = ['All Sports', ...sports.map(sport => sport.name)];
  const skillLevels = ['Any Level', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const tabs = ['Nearby', 'My Created', 'My Joined'];

  const styles = createStyles(theme);

  // Memoize icon objects to prevent SearchBar re-renders
  const searchIcon = useMemo(() => ({ name: 'search', size: 20, color: theme.colors.textSecondary }), [theme.colors.textSecondary]);
  const clearIcon = useMemo(() => ({ name: 'clear', size: 20, color: theme.colors.textSecondary }), [theme.colors.textSecondary]);

  useEffect(() => {
    loadSports();
  }, []);

  useEffect(() => {
    if (location && activeTab === 0) {
      searchNearbyMatches();
    } else if (activeTab === 1 || activeTab === 2) {
      loadUserMatches();
    }
  }, [location, selectedSportIndex, skillLevelIndex, searchRadius, activeTab]);

  const loadSports = async () => {
    try {
      const sportsData = await sportsService.getAllSports();
      setSports(sportsData);
    } catch (error) {
      console.error('Failed to load sports:', error);
    }
  };

  const searchNearbyMatches = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please allow location access to find nearby matches.');
      return;
    }

    setLoading(true);
    try {
      const params = {
        location: `${location.latitude},${location.longitude}`,
        radius: searchRadius,
        sport_id: selectedSportIndex > 0 ? sports[selectedSportIndex - 1]?.id : undefined,
        skill_level: skillLevelIndex > 0 ? skillLevels[skillLevelIndex].toLowerCase() : undefined,
      };

      const matchesData = await matchService.getMatches(params);
      // Add distance property to matches
      const matchesWithDistance = matchesData.map(match => ({
        ...match,
        distance: 0, // Distance would be calculated by backend
      }));
      setMatches(matchesWithDistance);
    } catch (error) {
      console.error('Failed to search nearby matches:', error);
      Alert.alert('Search Failed', 'Unable to find nearby matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserMatches = async () => {
    try {
      setLoading(true);
      const userMatchesData = await matchService.getUserMatches();
      setUserMatches(userMatchesData);
    } catch (error) {
      console.error('Failed to load user matches:', error);
      Alert.alert('Load Failed', 'Unable to load your matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 0) {
      await updateLocation();
      await searchNearbyMatches();
    } else {
      await loadUserMatches();
    }
    setRefreshing(false);
  }, [activeTab, location, selectedSportIndex, skillLevelIndex, searchRadius]);

  const filteredMatches = matches.filter(match => 
    searchText === '' || 
    match.title.toLowerCase().includes(searchText.toLowerCase()) ||
    match.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    match.location_name.toLowerCase().includes(searchText.toLowerCase()) ||
    match.sport?.name.toLowerCase().includes(searchText.toLowerCase()) ||
    match.creator?.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredCreatedMatches = userMatches.created.filter(match =>
    searchText === '' ||
    match.title.toLowerCase().includes(searchText.toLowerCase()) ||
    match.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    match.location_name.toLowerCase().includes(searchText.toLowerCase()) ||
    match.sport?.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredParticipatedMatches = userMatches.participated.filter(match =>
    searchText === '' ||
    match.title.toLowerCase().includes(searchText.toLowerCase()) ||
    match.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    match.location_name.toLowerCase().includes(searchText.toLowerCase()) ||
    match.sport?.name.toLowerCase().includes(searchText.toLowerCase()) ||
    match.creator?.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 0:
        return filteredMatches;
      case 1:
        return filteredCreatedMatches;
      case 2:
        return filteredParticipatedMatches;
      default:
        return [];
    }
  };

  const getCurrentEmptyMessage = () => {
    if (loading) {
      switch (activeTab) {
        case 0:
          return 'Searching for matches nearby...';
        case 1:
          return 'Loading your created matches...';
        case 2:
          return 'Loading your joined matches...';
        default:
          return 'Loading...';
      }
    }
    
    // Check if we're showing filtered results
    if (searchText.trim() !== '') {
      return `No matches found for "${searchText}"`;
    }
    
    switch (activeTab) {
      case 0:
        return 'No matches found in your area';
      case 1:
        return 'You haven\'t created any matches yet';
      case 2:
        return 'You haven\'t joined any matches yet';
      default:
        return 'No matches found';
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    try {
      await requestToJoinMatch(matchId);
      await searchNearbyMatches(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to request to join match:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'full': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  const renderMatchItem = ({ item }: { item: NearbyMatch }) => (
    <Card containerStyle={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.matchInfo}>
          <Text style={styles.matchTitle}>{item.title}</Text>
          <Text style={styles.sportName}>{item.sport?.name}</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.distance}>{formatDistance(item.distance)} away</Text>
            <Text style={styles.locationName}>{item.location_name}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <Badge
            value={item.status.toUpperCase()}
            status={getStatusColor(item.status)}
            containerStyle={styles.statusBadge}
          />
          {item.skill_level_required !== 'any' && (
            <Badge
              value={item.skill_level_required.toUpperCase()}
              status="primary"
              containerStyle={styles.skillBadge}
            />
          )}
        </View>
      </View>

      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      <View style={styles.matchDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>When:</Text>
          <Text style={styles.detailValue}>{formatDateTime(item.scheduled_at)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{formatDuration(item.duration)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Players:</Text>
          <Text style={styles.detailValue}>
            {item.participants?.length || 0} / {item.max_participants}
          </Text>
        </View>
        
        {item.creator && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created by:</Text>
            <Text style={styles.detailValue}>{item.creator.username}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="View Details"
          buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.textSecondary }]}
          titleStyle={{ color: theme.colors.surface }}
          onPress={() => {
            (navigation as any).navigate('MatchDetails', { matchId: item.id });
          }}
        />
        {item.status === 'open' && (
          <Button
            title="Request to Join"
            buttonStyle={[styles.actionButton, styles.joinButton]}
            titleStyle={{ fontSize: 12 }}
            onPress={() => handleJoinMatch(item.id)}
            icon={<Ionicons name="person-add" size={14} color={theme.colors.surface} style={{ marginRight: theme.spacing.xs }} />}
          />
        )}
      </View>
    </Card>
  );

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FriendRequestNotification />
      <MatchInvitationNotification />
      <JoinRequestsNotification />
      <View style={styles.header}>
        <Text h4 style={styles.title}>Matches</Text>
        
        <ButtonGroup
          buttons={tabs}
          selectedIndex={activeTab}
          onPress={handleTabChange}
          containerStyle={styles.tabContainer}
          selectedButtonStyle={styles.selectedTab}
          textStyle={styles.tabText}
          selectedTextStyle={styles.selectedTabText}
        />
        
        <SearchBar
          placeholder={`Search ${tabs[activeTab].toLowerCase()} matches...`}
          value={searchText}
          onChangeText={(text: string) => setSearchText(text)}
          returnKeyType="search"
          containerStyle={styles.searchContainer}
          inputContainerStyle={styles.searchInput}
          searchIcon={searchIcon}
          clearIcon={clearIcon}
        />
        
        {activeTab === 0 && (
          <>
            <Text style={styles.filterLabel}>Sport:</Text>
            <ButtonGroup
              buttons={sportOptions}
              selectedIndex={selectedSportIndex}
              onPress={setSelectedSportIndex}
              containerStyle={styles.buttonGroup}
              buttonStyle={styles.filterButton}
              textStyle={styles.buttonText}
              selectedButtonStyle={styles.selectedButton}
              innerBorderStyle={styles.buttonBorder}
            />

            <Text style={styles.filterLabel}>Skill Level:</Text>
            <ButtonGroup
              buttons={skillLevels}
              selectedIndex={skillLevelIndex}
              onPress={setSkillLevelIndex}
              containerStyle={styles.buttonGroup}
              buttonStyle={styles.filterButton}
              textStyle={styles.buttonText}
              selectedButtonStyle={styles.selectedButton}
            />

            <Text style={styles.filterLabel}>
              Search Radius: {formatDistance(searchRadius)}
            </Text>
            <Slider
              value={searchRadius}
              onValueChange={setSearchRadius}
              minimumValue={1000} // 1km
              maximumValue={50000} // 50km
              step={1000}
              thumbStyle={styles.sliderThumb}
              trackStyle={styles.sliderTrack}
        style={styles.slider}
            />
          </>
        )}
      </View>

      <FlatList
        data={getCurrentData() as NearbyMatch[]}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {getCurrentEmptyMessage()}
            </Text>
            {!loading && (
              <Button
                title="Refresh Location"
                onPress={onRefresh}
                buttonStyle={styles.refreshButton}
              />
            )}
          </View>
        }
        contentContainerStyle={matches.length === 0 ? styles.emptyList : undefined}
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
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  tabContainer: {
    marginBottom: theme.spacing.md,
    borderRadius: 25,
    backgroundColor: theme.colors.border,
    borderWidth: 0,
    marginHorizontal: theme.spacing.sm,
  },
  selectedTab: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  selectedTabText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.border,
  },
  filterLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  buttonGroup: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  filterButton: {
    backgroundColor: theme.colors.surface,
  },
  buttonText: {
    fontSize: theme.fontSize.xs,
  },
  selectedButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonBorder: {
    width: 1,
    color: theme.colors.border,
  },
  slider: {
    marginVertical: theme.spacing.sm,
  },
  sliderThumb: {
    backgroundColor: theme.colors.primary,
  },
  sliderTrack: {
    backgroundColor: theme.colors.border,
  },
  matchCard: {
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sportName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  locationContainer: {
    marginTop: theme.spacing.xs,
  },
  distance: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  locationName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  badges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: theme.spacing.xs,
  },
  skillBadge: {
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  matchDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: theme.spacing.xs,
  },
  joinButton: {
    backgroundColor: theme.colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
});