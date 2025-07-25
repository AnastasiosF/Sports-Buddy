import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Button, Avatar, ListItem, Card } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Profile } from '@sports-buddy/shared-types';
import { profileService } from '../services/profileService';
import { FriendRequestNotification } from '../components';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut, profile, updateProfile } = useAuth();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch the full profile data here
    // For now, we'll use the profile from auth context
    setUserProfile(profile);
    setLoading(false);
  }, [profile]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setUserProfile(profile);
      setLoading(false);
    }, [profile])
  );

  const onRefresh = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      // Fetch fresh profile data
      const freshProfile = await profileService.getProfile(user.id);
      setUserProfile(freshProfile);
      
      // Update the auth context with fresh data
      await updateProfile({});
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      Alert.alert('Refresh Failed', 'Unable to refresh profile data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('ProfileSetup' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FriendRequestNotification />
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']} // Android
            tintColor="#2196F3" // iOS
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <Card containerStyle={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              size="large"
              rounded
              source={
                userProfile?.avatar_url
                  ? { uri: userProfile.avatar_url }
                  : undefined
              }
              title={userProfile?.username?.charAt(0).toUpperCase() || 'U'}
              containerStyle={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.username}>
                {userProfile?.username || 'Username not set'}
              </Text>
              <Text style={styles.fullName}>
                {userProfile?.full_name || 'Full name not set'}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>

          {userProfile?.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioLabel}>Bio</Text>
              <Text style={styles.bioText}>{userProfile.bio}</Text>
            </View>
          )}

          <Button
            title="Edit Profile"
            buttonStyle={styles.editButton}
            titleStyle={styles.editButtonText}
            onPress={handleEditProfile}
            icon={
              <Ionicons
                name="create-outline"
                size={16}
                color="white"
                style={{ marginRight: 8 }}
              />
            }
          />
        </Card>

        {/* Profile Details */}
        <Card containerStyle={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>

          <ListItem bottomDivider>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <ListItem.Content>
              <ListItem.Title>Age</ListItem.Title>
              <ListItem.Subtitle>
                {userProfile?.age ? `${userProfile.age} years old` : 'Not specified'}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>

          <ListItem bottomDivider>
            <Ionicons name="trophy-outline" size={20} color="#666" />
            <ListItem.Content>
              <ListItem.Title>Skill Level</ListItem.Title>
              <ListItem.Subtitle style={styles.skillLevel}>
                {userProfile?.skill_level ?
                  userProfile.skill_level.charAt(0).toUpperCase() + userProfile.skill_level.slice(1)
                  : 'Not specified'
                }
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>

          <ListItem bottomDivider>
            <Ionicons name="location-outline" size={20} color="#666" />
            <ListItem.Content>
              <ListItem.Title>Location</ListItem.Title>
              <ListItem.Subtitle>
                {userProfile?.location_name || 'Location not set'}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>

          <ListItem bottomDivider>
            <Ionicons name="basketball-outline" size={20} color="#666" />
            <ListItem.Content>
              <ListItem.Title>Preferred Sports</ListItem.Title>
              <ListItem.Subtitle>
                {userProfile?.user_sports && userProfile.user_sports.length > 0
                  ? userProfile.user_sports
                      .filter(userSport => userSport.preferred)
                      .map(userSport => userSport.sport?.name || 'Unknown Sport')
                      .join(', ') || 'No preferred sports'
                  : 'No preferred sports'
                }
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>

          <ListItem>
            <Ionicons name="trending-up-outline" size={20} color="#666" />
            <ListItem.Content>
              <ListItem.Title>Sports Skills</ListItem.Title>
              <ListItem.Subtitle>
                {userProfile?.user_sports && userProfile.user_sports.length > 0
                  ? userProfile.user_sports
                      .map(userSport => {
                        const sportName = userSport.sport?.name || 'Unknown';
                        const skillLevel = userSport.skill_level || 'intermediate';
                        return `${sportName}: ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}`;
                      })
                      .join(' • ')
                  : 'No skill levels set'
                }
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        </Card>

        {/* App Settings */}
        <Card containerStyle={styles.settingsCard}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-outline" size={20} color="#666" />
            <Text style={styles.settingText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={20} color="#666" />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          buttonStyle={styles.signOutButton}
          titleStyle={styles.signOutButtonText}
          onPress={handleSignOut}
          icon={
            <Ionicons
              name="log-out-outline"
              size={16}
              color="white"
              style={{ marginRight: 8 }}
            />
          }
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    margin: 15,
    marginBottom: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  fullName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  bioSection: {
    marginBottom: 15,
  },
  bioLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  editButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingVertical: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsCard: {
    margin: 15,
    marginTop: 0,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  skillLevel: {
    textTransform: 'capitalize',
  },
  settingsCard: {
    margin: 15,
    marginTop: 0,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#f44336',
    borderRadius: 25,
    marginHorizontal: 15,
    marginTop: 10,
    paddingVertical: 12,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100, // Extra space for FAB
  },
});
