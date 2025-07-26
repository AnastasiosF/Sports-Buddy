import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Input,
  Card,
  Text,
  Header,
  Avatar,
  Button,
  Chip,
  ButtonGroup,
} from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../contexts/LocationContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { matchService, GetMatchesParams } from '../services/matchService';
import { sportsService } from '../services/sportsService';
import { Match, Sport } from '../types';

const searchTypes = ['Nearby', 'Creator'];

export const MatchSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { location: userLocation } = useLocation();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTypeIndex, setSearchTypeIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useState(10000); // 10km default

  useEffect(() => {
    loadSports();
    // For nearby search (index 0), load immediately with location
    // For creator search (index 1), require search query
    if (searchTypeIndex === 0 || (searchTypeIndex === 1 && searchQuery.length > 2)) {
      searchMatches();
    } else {
      setMatches([]);
    }
  }, [searchQuery, searchTypeIndex, selectedSport, radius]);

  const loadSports = async () => {
    try {
      const sportsData = await sportsService.getAllSports();
      setSports(sportsData);
    } catch (error) {
      console.error('Error loading sports:', error);
    }
  };

  const searchMatches = async () => {
    setLoading(true);
    try {
      const params: GetMatchesParams = {
        status: 'open',
      };

      if (searchTypeIndex === 0) {
        // Nearby search - requires location
        if (userLocation) {
          params.location = `${userLocation.latitude},${userLocation.longitude}`;
          params.radius = radius;
        }
        // Optional search query for nearby matches
        if (searchQuery.length > 2) {
          params.search = searchQuery;
          params.search_type = 'location';
        }
      } else if (searchTypeIndex === 1) {
        // Creator search - requires search query
        if (searchQuery.length > 2) {
          params.search = searchQuery;
          params.search_type = 'creator';
        }
      }

      // Add sport filter if selected
      if (selectedSport) {
        params.sport_id = selectedSport.id;
      }

      const allMatches = await matchService.getMatches(params);
      
      // Backend now handles most filtering, so we just set the results
      setMatches(allMatches);
    } catch (error: any) {
      console.error('Error searching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchMatches();
    setRefreshing(false);
  };

  const joinMatch = async (matchId: string) => {
    try {
      await matchService.joinMatch(matchId);
      // Refresh the list to update the match status
      await searchMatches();
    } catch (error: any) {
      console.error('Error joining match:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const getParticipantCount = (match: Match) => {
    return match.participants?.filter(p => p.status === 'confirmed').length || 0;
  };

  const isMatchFull = (match: Match) => {
    return getParticipantCount(match) >= match.max_participants;
  };

  const renderMatchCard = (match: Match) => {
    const participantCount = getParticipantCount(match);
    const isFull = isMatchFull(match);
    const isPrivate = match.description?.includes('[PRIVATE]');

    return (
      <Card key={match.id} containerStyle={styles.matchCard}>
        {/* Match Header */}
        <View style={styles.matchHeader}>
          <View style={styles.matchInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.matchTitle}>{match.title}</Text>
              {isPrivate && (
                <Ionicons name="lock-closed" size={16} color="#f39c12" style={styles.privateIcon} />
              )}
            </View>
            <Text style={styles.sportName}>{match.sport?.name}</Text>
            <Text style={styles.matchTime}>
              <Ionicons name="time-outline" size={14} color="#666" />
              {' '}{formatDate(match.scheduled_at)}
            </Text>
            <Text style={styles.matchLocation}>
              <Ionicons name="location-outline" size={14} color="#666" />
              {' '}{match.location_name}
            </Text>
            {(match as any).distance && (
              <Text style={styles.matchDistance}>
                <Ionicons name="walk-outline" size={14} color="#666" />
                {' '}{((match as any).distance / 1000).toFixed(1)}km away
              </Text>
            )}
          </View>
          
          <View style={styles.matchActions}>
            <Text style={[
              styles.participantCount,
              isFull && styles.fullMatch
            ]}>
              {participantCount}/{match.max_participants}
            </Text>
            <Button
              title={isFull ? "Full" : "Join"}
              buttonStyle={[
                styles.joinButton,
                isFull ? styles.fullButton : { backgroundColor: colors.primary }
              ]}
              titleStyle={styles.joinButtonText}
              disabled={isFull}
              onPress={() => joinMatch(match.id)}
            />
          </View>
        </View>

        {/* Creator Info */}
        <View style={styles.creatorSection}>
          <Avatar
            size={30}
            rounded
            source={match.creator?.avatar_url ? { uri: match.creator.avatar_url } : undefined}
            title={match.creator?.username[0]?.toUpperCase() || '?'}
            containerStyle={styles.creatorAvatar}
          />
          <Text style={styles.creatorText}>
            Organized by <Text style={styles.creatorName}>{match.creator?.username}</Text>
          </Text>
        </View>

        {/* Match Details */}
        {match.description && !isPrivate && (
          <Text style={styles.matchDescription}>{match.description}</Text>
        )}
        
        <View style={styles.matchDetails}>
          <Chip
            title={`${match.duration} min`}
            size="sm"
            buttonStyle={styles.detailChip}
            titleStyle={styles.detailChipText}
          />
          <Chip
            title={match.skill_level_required === 'any' ? 'Any Level' : match.skill_level_required}
            size="sm"
            buttonStyle={styles.detailChip}
            titleStyle={styles.detailChipText}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        centerComponent={{ 
          text: 'Search Matches', 
          style: { color: '#fff', fontSize: 20, fontWeight: 'bold' } 
        }}
        leftComponent={{
          icon: 'arrow-back',
          color: '#fff',
          onPress: () => navigation.goBack(),
        }}
        backgroundColor={colors.primary}
      />

      <View style={styles.content}>
        {/* Search Type Selection */}
        <ButtonGroup
          buttons={searchTypes}
          selectedIndex={searchTypeIndex}
          onPress={setSearchTypeIndex}
          containerStyle={styles.searchTypeContainer}
          selectedButtonStyle={{ backgroundColor: colors.primary }}
          textStyle={styles.searchTypeText}
        />

        {/* Search Input */}
        <Input
          placeholder={searchTypeIndex === 0 ? "Search nearby matches (optional)..." : "Search by creator username..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color="#666" />}
          containerStyle={styles.searchContainer}
          inputContainerStyle={styles.searchInputContainer}
        />

        {/* Sport Filter */}
        <Text style={styles.filterLabel}>Filter by Sport (Optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportsFilter}>
          <Button
            title="All Sports"
            buttonStyle={[
              styles.sportFilterButton,
              !selectedSport && styles.selectedSportFilter
            ]}
            titleStyle={[
              styles.sportFilterText,
              !selectedSport && styles.selectedSportFilterText
            ]}
            onPress={() => setSelectedSport(null)}
          />
          {sports.map((sport) => (
            <Button
              key={sport.id}
              title={sport.name}
              buttonStyle={[
                styles.sportFilterButton,
                selectedSport?.id === sport.id && styles.selectedSportFilter
              ]}
              titleStyle={[
                styles.sportFilterText,
                selectedSport?.id === sport.id && styles.selectedSportFilterText
              ]}
              onPress={() => setSelectedSport(sport)}
            />
          ))}
        </ScrollView>

        {/* Results */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading && matches.length === 0 && (
            <Card containerStyle={styles.loadingCard}>
              <Text style={styles.loadingText}>Searching matches...</Text>
            </Card>
          )}

          {!loading && searchQuery.length > 2 && matches.length === 0 && (
            <Card containerStyle={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No matches found for "{searchQuery}"
              </Text>
            </Card>
          )}

          {!loading && searchQuery.length <= 2 && searchTypeIndex === 1 && (
            <Card containerStyle={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Type at least 3 characters to search for creators
              </Text>
            </Card>
          )}

          {!loading && searchTypeIndex === 0 && !userLocation && (
            <Card containerStyle={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Location permission required for nearby search
              </Text>
            </Card>
          )}

          {matches.map(renderMatchCard)}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchTypeContainer: {
    marginBottom: 16,
    borderRadius: 8,
  },
  searchTypeText: {
    fontSize: 12,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  sportsFilter: {
    marginBottom: 16,
  },
  sportFilterButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedSportFilter: {
    backgroundColor: '#007AFF',
  },
  sportFilterText: {
    color: '#333',
    fontSize: 12,
  },
  selectedSportFilterText: {
    color: '#fff',
  },
  matchCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  privateIcon: {
    marginLeft: 8,
  },
  sportName: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  matchLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  matchDistance: {
    fontSize: 12,
    color: '#999',
  },
  matchActions: {
    alignItems: 'center',
  },
  participantCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  fullMatch: {
    color: '#f39c12',
  },
  joinButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  fullButton: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorAvatar: {
    marginRight: 8,
  },
  creatorText: {
    fontSize: 12,
    color: '#666',
  },
  creatorName: {
    fontWeight: '600',
    color: '#333',
  },
  matchDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  matchDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailChip: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 4,
  },
  detailChipText: {
    fontSize: 10,
    color: '#666',
  },
  loadingCard: {
    borderRadius: 12,
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyCard: {
    borderRadius: 12,
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});