import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import {
  Text,
  Input,
  Button,
  Avatar,
  Header,
  ButtonGroup,
  Slider,
  Divider
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { profileService } from '../../services/profileService';
import { locationService } from '../../services/locationService';
import { sportsService } from '../../services/sportsService';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { Profile, SkillLevel, Sport, UserSport } from '../../types';

interface ProfileFormData {
  full_name: string;
  bio: string;
  age: number;
  skill_level: SkillLevel;
}

export const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { location, updateLocation } = useLocation();

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    bio: '',
    age: 25,
    skill_level: 'intermediate',
  });

  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);

  const skillLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const skillLevelButtons = skillLevels.map(level =>
    level.charAt(0).toUpperCase() + level.slice(1)
  );

  useEffect(() => {
    loadCurrentProfile();
    loadSports();
  }, []);

  const loadCurrentProfile = async () => {
    if (!user?.id) return;

    try {
      const profile = await profileService.getProfile(user.id);
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        age: profile.age || 25,
        skill_level: profile.skill_level || 'intermediate',
      });
      setLocationName(profile.location_name || '');

      // Load user's selected sports
      if (profile.user_sports) {
        const sportIds = profile.user_sports.map(us => us.sport_id);
        setSelectedSports(sportIds);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Continue with empty form if profile doesn't exist yet
    }
  };

  const loadSports = async () => {
    try {
      const sportsData = await sportsService.getAllSports();
      setSports(sportsData);
    } catch (error) {
      console.error('Failed to load sports:', error);
    } finally {
      setLoadingSports(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!location) {
      Alert.alert(
        'Location Access Required',
        'Please enable location access to set your location for finding nearby sports partners.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update Location', onPress: updateLocation },
        ]
      );
      return;
    }

    setUpdatingLocation(true);
    try {
      const response = await locationService.updateUserLocation(location, locationName);
      setLocationName(response.profile.location_name || '');
      Alert.alert('Success', 'Your location has been updated!');
    } catch (error: any) {
      console.error('Failed to update location:', error);
      Alert.alert('Error', error.message || 'Failed to update location. Please try again.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const toggleSportSelection = (sportId: string) => {
    setSelectedSports(prev => {
      if (prev.includes(sportId)) {
        return prev.filter(id => id !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Basic validation
    if (!formData.full_name.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    if (formData.age < 13 || formData.age > 100) {
      Alert.alert('Validation Error', 'Please enter a valid age between 13 and 100.');
      return;
    }

    setLoading(true);
    try {
      const profileUpdates: Partial<Profile> = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        age: formData.age,
        skill_level: formData.skill_level,
      };

      // Add location name only (not coordinates) to avoid geometry parsing issues
      if (locationName.trim()) {
        profileUpdates.location_name = locationName.trim();
      }

      console.log('Updating profile with data:', profileUpdates);
      console.log('User ID:', user.id);

      const updatedProfile = await profileService.updateProfile(user.id, profileUpdates);

      console.log('Profile updated successfully:', updatedProfile);

      // If we have valid location coordinates, update them separately
      if (location && location.latitude && location.longitude) {
        try {
          const lat = parseFloat(location.latitude.toString());
          const lng = parseFloat(location.longitude.toString());

          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            await locationService.updateUserLocation(location, locationName);
            console.log('Location updated successfully');
          }
        } catch (locationError) {
          console.warn('Failed to update location, but profile was saved:', locationError);
          // Don't fail the whole operation if location update fails
        }
      }

      // Update user sports if any are selected
      if (selectedSports.length > 0) {
        try {
          // Add each selected sport individually
          for (const sportId of selectedSports) {
            await profileService.addUserSport(
              sportId,
              formData.skill_level,
              true // preferred
            );
          }
          console.log('User sports updated successfully');
        } catch (sportsError) {
          console.warn('Failed to update sports, but profile was saved:', sportsError);
          // Don't fail the whole operation if sports update fails
        }
      }

      Alert.alert(
        'Profile Updated!',
        'Your profile has been successfully updated.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });

      let errorMessage = 'Failed to update profile. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid profile data. Please check your inputs.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const skillLevelIndex = skillLevels.indexOf(formData.skill_level);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        centerComponent={{
          text: 'Setup Your Profile',
          style: { color: 'white', fontSize: 18, fontWeight: 'bold' }
        }}
        backgroundColor="#2196F3"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.avatarContainer}>
            <Avatar
              rounded
              size="large"
              title={formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.[0]?.toUpperCase() || '?'}
              containerStyle={styles.avatar}
            />
            <Text style={styles.avatarNote}>Avatar can be updated later</Text>
          </View>

          <Input
            label="Full Name *"
            value={formData.full_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
            placeholder="Enter your full name"
            containerStyle={styles.inputContainer}
            inputContainerStyle={styles.inputInnerContainer}
            leftIcon={{ name: 'person', color: '#666' }}
          />

          <Input
            label="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            placeholder="Tell others about yourself and your interests..."
            multiline
            numberOfLines={3}
            containerStyle={styles.inputContainer}
            inputContainerStyle={[styles.inputInnerContainer, styles.textAreaContainer]}
            leftIcon={{ name: 'description', color: '#666' }}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Age: {Math.round(formData.age)} years old
            </Text>
            <Slider
              value={formData.age}
              onValueChange={(value) => setFormData(prev => ({ ...prev, age: value }))}
              minimumValue={13}
              maximumValue={80}
              step={1}
              style={styles.slider}
            />
          </View>

          <View style={styles.skillLevelContainer}>
            <Text style={styles.skillLevelLabel}>Overall Skill Level:</Text>
            <ButtonGroup
              buttons={skillLevelButtons}
              selectedIndex={skillLevelIndex}
              onPress={(index) => setFormData(prev => ({ ...prev, skill_level: skillLevels[index] }))}
              containerStyle={styles.skillButtonGroup}
              buttonStyle={styles.skillButton}
              textStyle={styles.skillButtonText}
              selectedButtonStyle={styles.selectedSkillButton}
            />
            <Text style={styles.skillNote}>
              This is your general skill level. You can set specific skill levels for individual sports later.
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Sports</Text>

          {loadingSports ? (
            <Text style={styles.loadingText}>Loading sports...</Text>
          ) : (
            <>
              <Text style={styles.sportsNote}>
                Select the sports you're interested in playing:
              </Text>

              <View style={styles.sportsContainer}>
                {sports.map((sport) => (
                  <TouchableOpacity
                    key={sport.id}
                    style={[
                      styles.sportChip,
                      selectedSports.includes(sport.id) && styles.selectedSportChip
                    ]}
                    onPress={() => toggleSportSelection(sport.id)}
                  >
                    <Text style={[
                      styles.sportChipText,
                      selectedSports.includes(sport.id) && styles.selectedSportChipText
                    ]}>
                      {sport.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.selectedSportsText}>
                {selectedSports.length} sport{selectedSports.length !== 1 ? 's' : ''} selected
              </Text>
            </>
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Input
            label="Location Name (Optional)"
            value={locationName}
            onChangeText={setLocationName}
            placeholder="e.g., Downtown LA, Central Park, etc."
            containerStyle={styles.inputContainer}
            inputContainerStyle={styles.inputInnerContainer}
            leftIcon={{ name: 'location-on', color: '#666' }}
          />

          <Button
            title={updatingLocation ? "Updating Location..." : "Update My Location"}
            onPress={handleUpdateLocation}
            buttonStyle={styles.locationButton}
            titleStyle={styles.locationButtonText}
            loading={updatingLocation}
          />

          <Text style={styles.locationNote}>
            {location
              ? "✓ Location access granted. This helps you find nearby sports partners."
              : "⚠️ Location access needed to find people and matches near you."
            }
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Saving..." : "Save Profile"}
          onPress={handleSaveProfile}
          disabled={loading}
          buttonStyle={styles.saveButton}
          loading={loading}
        />

        <Button
          title="Skip for Now"
          type="clear"
          onPress={() => navigation.goBack()}
          titleStyle={styles.skipButtonText}
          disabled={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: '#2196F3',
    marginBottom: 10,
  },
  avatarNote: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputInnerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
  },
  textAreaContainer: {
    height: 80,
    paddingTop: 10,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  slider: {
    marginHorizontal: 10,
  },
  sliderThumb: {
    backgroundColor: '#2196F3',
  },
  sliderTrack: {
    backgroundColor: '#e0e0e0',
  },
  skillLevelContainer: {
    marginBottom: 10,
  },
  skillLevelLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  skillButtonGroup: {
    borderRadius: 5,
    marginBottom: 10,
  },
  skillButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  skillButtonText: {
    fontSize: 12,
  },
  selectedSkillButton: {
    backgroundColor: '#2196F3',
  },
  skillNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  locationButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginBottom: 10,
  },
  locationButtonText: {
    color: 'white',
  },
  locationNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 10,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  sportsNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  sportChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedSportChip: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sportChipText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSportChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedSportsText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
