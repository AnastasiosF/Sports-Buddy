import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Input,
  Card,
  Text,
  Header,
  Avatar,
  Button,
  Chip,
} from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLocation } from '../contexts/LocationContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { profileService } from '../services/profileService';
import { matchService } from '../services/matchService';
import { Profile } from '../types';

interface UserSearchParams {
  matchId?: string;
  sport_id?: string;
}

export const UserSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as UserSearchParams | undefined;
  const colors = useThemeColors();
  const { location: userLocation } = useLocation();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const searchParams: any = {};
      
      if (userLocation) {
        searchParams.location = `${userLocation.latitude},${userLocation.longitude}`;
        searchParams.radius = 10000; // 10km radius
      }
      
      if (params?.sport_id) {
        searchParams.sport_id = params.sport_id;
      }

      const results = await profileService.searchProfiles(searchParams);
      
      // Filter by search query (username or full_name)
      const filtered = results.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setUsers(filtered);
    } catch (error: any) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId: string) => {
    if (!params?.matchId) {
      Alert.alert('Error', 'No match selected for invitation');
      return;
    }

    setInvitingUsers(prev => new Set(prev).add(userId));
    
    try {
      await matchService.inviteToMatch(params.matchId, userId);
      
      const user = users.find(u => u.id === userId);
      Alert.alert(
        'Invitation Sent!',
        `Invitation sent to ${user?.username || 'user'}. They will receive a notification.`,
        [{ text: 'OK' }]
      );
      
      // Mark user as invited but keep them in the list
      setInvitedUsers(prev => new Set(prev).add(userId));
    } catch (error: any) {
      console.error('Error inviting user:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const renderUserCard = (user: Profile) => {
    const isInviting = invitingUsers.has(user.id);
    const isInvited = invitedUsers.has(user.id);
    const canInvite = params?.matchId;

    return (
      <Card key={user.id} containerStyle={styles.userCard}>
        <View style={styles.userHeader}>
          <Avatar
            size={50}
            rounded
            source={user.avatar_url ? { uri: user.avatar_url } : undefined}
            title={user.username[0].toUpperCase()}
            containerStyle={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user.username}</Text>
            {user.full_name && (
              <Text style={styles.fullName}>{user.full_name}</Text>
            )}
            {user.location_name && (
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={12} color="#666" />
                {' '}{user.location_name}
              </Text>
            )}
          </View>
          {canInvite && (
            <Button
              title={isInvited ? "Invited" : isInviting ? "Inviting..." : "Invite"}
              buttonStyle={[
                styles.inviteButton,
                { 
                  backgroundColor: isInvited ? '#4CAF50' : colors.primary 
                }
              ]}
              titleStyle={styles.inviteButtonText}
              loading={isInviting}
              disabled={isInviting || isInvited}
              onPress={() => inviteUser(user.id)}
              icon={
                <Ionicons 
                  name={isInvited ? "checkmark-circle-outline" : "person-add-outline"} 
                  size={16} 
                  color="#fff" 
                  style={{ marginRight: 4 }} 
                />
              }
            />
          )}
        </View>
        
        {user.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}
        
        {user.user_sports && user.user_sports.length > 0 && (
          <View style={styles.sportsContainer}>
            <Text style={styles.sportsLabel}>Sports:</Text>
            <View style={styles.sportsChips}>
              {user.user_sports.slice(0, 3).map((userSport) => (
                <Chip
                  key={userSport.id}
                  title={userSport.sport?.name || 'Unknown'}
                  buttonStyle={styles.sportChip}
                  titleStyle={styles.sportChipText}
                  size="sm"
                />
              ))}
              {user.user_sports.length > 3 && (
                <Chip
                  title={`+${user.user_sports.length - 3} more`}
                  buttonStyle={styles.moreChip}
                  titleStyle={styles.moreChipText}
                  size="sm"
                />
              )}
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        centerComponent={{ 
          text: params?.matchId ? 'Invite Players' : 'Search Users', 
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
        <Input
          placeholder="Search by username or name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color="#666" />}
          containerStyle={styles.searchContainer}
          inputContainerStyle={styles.searchInputContainer}
        />

        {params?.matchId && (
          <Card containerStyle={styles.infoCard}>
            <Text style={styles.infoText}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              {' '}Search and invite players to join your match. They'll receive a notification to accept or decline.
            </Text>
          </Card>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {loading && (
            <Card containerStyle={styles.loadingCard}>
              <Text style={styles.loadingText}>Searching users...</Text>
            </Card>
          )}

          {!loading && searchQuery.length > 2 && users.length === 0 && (
            <Card containerStyle={styles.emptyCard}>
              <Text style={styles.emptyText}>No users found matching "{searchQuery}"</Text>
            </Card>
          )}

          {!loading && searchQuery.length <= 2 && (
            <Card containerStyle={styles.emptyCard}>
              <Text style={styles.emptyText}>Type at least 3 characters to search for users</Text>
            </Card>
          )}

          {users.map(renderUserCard)}
        </ScrollView>

        {/* Finalize Button - only show if we're inviting to a match and have invited users */}
        {params?.matchId && invitedUsers.size > 0 && (
          <View style={styles.finalizeContainer}>
            <Button
              title={`Finalize (${invitedUsers.size} invited)`}
              buttonStyle={[styles.finalizeButton, { backgroundColor: colors.primary }]}
              titleStyle={styles.finalizeButtonText}
              onPress={() => {
                Alert.alert(
                  'Invitations Complete',
                  `You have invited ${invitedUsers.size} player(s) to your match. They will receive notifications to accept or decline.`,
                  [
                    { 
                      text: 'Done', 
                      onPress: () => navigation.goBack() 
                    }
                  ]
                );
              }}
              icon={
                <Ionicons 
                  name="checkmark-done-outline" 
                  size={20} 
                  color="#fff" 
                  style={{ marginRight: 8 }} 
                />
              }
            />
          </View>
        )}
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
  infoCard: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  userCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fullName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inviteButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inviteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sportsContainer: {
    marginTop: 8,
  },
  sportsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  sportsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sportChip: {
    backgroundColor: '#e0e0e0',
    marginRight: 4,
    marginBottom: 4,
  },
  sportChipText: {
    fontSize: 10,
    color: '#333',
  },
  moreChip: {
    backgroundColor: '#f0f0f0',
    marginRight: 4,
    marginBottom: 4,
  },
  moreChipText: {
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
  finalizeContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  finalizeButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  finalizeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});