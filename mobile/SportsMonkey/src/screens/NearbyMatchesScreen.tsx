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
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { locationService } from '../services/locationService';
import { sportsService } from '../services/sportsService';
import { matchService } from '../services/matchService';
import { FriendRequestNotification } from '../components';
import { Match, Sport, formatDistance, formatDateTime, formatDuration } from '../types';

interface NearbyMatch extends Match {
  distance: number;
}

export const NearbyMatchesScreen: React.FC = () => {
  const { location, loading: locationLoading, updateLocation } = useLocation();
  const { user } = useAuth();
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

  // Memoize icon objects to prevent SearchBar re-renders
  const searchIcon = useMemo(() => ({ name: 'search', size: 20, color: '#666' }), []);
  const clearIcon = useMemo(() => ({ name: 'clear', size: 20, color: '#666' }), []);

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
        radius: searchRadius.toString(),
        sport_id: selectedSportIndex > 0 ? sports[selectedSportIndex - 1]?.id : undefined,
        skill_level: skillLevelIndex > 0 ? skillLevels[skillLevelIndex].toLowerCase() : undefined,
      };

      const matchesData = await matchService.getMatches(params);
      setMatches(matchesData);
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
      await matchService.joinMatch(matchId);
      Alert.alert('Success', 'You have joined the match!');
      await searchNearbyMatches(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to join match:', error);
      Alert.alert('Error', error.message || 'Failed to join match. Please try again.');
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
          buttonStyle={[styles.actionButton, { backgroundColor: '#6c757d' }]}
          titleStyle={{ color: 'white' }}
          onPress={() => {
            // Navigate to match details
            console.log('View match details:', item.id);
          }}
        />
        {item.status === 'open' && (
          <Button
            title="Join Match"
            buttonStyle={[styles.actionButton, styles.joinButton]}
            onPress={() => handleJoinMatch(item.id)}
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
              containerStyle={styles.slider}
            />
          </>
        )}
      </View>

      <FlatList
        data={getCurrentData()}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    paddingTop: 15,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#2196F3',
  },
  tabContainer: {
    marginBottom: 15,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    borderWidth: 0,
    marginHorizontal: 10,
  },
  selectedTab: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
  },
  tabText: {
    color: '#666',
    fontSize: 14,
  },
  selectedTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  buttonGroup: {
    marginBottom: 10,
    borderRadius: 5,
  },
  filterButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: 12,
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
  },
  sliderTrack: {
    backgroundColor: '#e0e0e0',
  },
  matchCard: {
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 15,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sportName: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 5,
  },
  locationContainer: {
    marginTop: 5,
  },
  distance: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  locationName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: 5,
  },
  skillBadge: {
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  matchDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  joinButton: {
    backgroundColor: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
  },
  emptyList: {
    flexGrow: 1,
  },
});