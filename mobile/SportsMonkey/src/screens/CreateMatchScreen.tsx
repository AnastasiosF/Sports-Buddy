import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import {
  Input,
  Button,
  Card,
  Text,
  Header,
  ButtonGroup,
} from '@rneui/themed';
import { CheckBox } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useLocation } from '../contexts/LocationContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { sportsService } from '../services/sportsService';
import { matchService, CreateMatchRequest } from '../services/matchService';
import { Sport, SkillLevelFilter } from '../types';
import { ModernDateTimePicker } from '../components/ModernDateTimePicker';

const skillLevels: SkillLevelFilter[] = ['any', 'beginner', 'intermediate', 'advanced', 'expert'];
const skillLevelLabels = ['Any', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const CreateMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { location: userLocation } = useLocation();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [duration, setDuration] = useState('60');
  const [maxParticipants, setMaxParticipants] = useState('4');
  const [skillLevelIndex, setSkillLevelIndex] = useState(0);
  const [locationName, setLocationName] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [customLocation, setCustomLocation] = useState({ latitude: 0, longitude: 0 });
  const [isPrivateMatch, setIsPrivateMatch] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    loadSports();
    if (userLocation) {
      reverseGeocode(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation]);

  const loadSports = async () => {
    try {
      const sportsData = await sportsService.getAllSports();
      setSports(sportsData);
    } catch (error) {
      console.error('Error loading sports:', error);
      Alert.alert('Error', 'Failed to load sports');
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result[0]) {
        const address = result[0];
        const locationStr = [
          address.name,
          address.street,
          address.city,
          address.region
        ].filter(Boolean).join(', ');
        setLocationName(locationStr);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const addHours = (hours: number) => {
    const newDate = new Date(scheduledDate);
    newDate.setHours(newDate.getHours() + hours);
    setScheduledDate(newDate);
  };

  const addDays = (days: number) => {
    const newDate = new Date(scheduledDate);
    newDate.setDate(newDate.getDate() + days);
    setScheduledDate(newDate);
  };

  const selectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to select your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCustomLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a match title');
      return false;
    }
    
    if (!selectedSport) {
      Alert.alert('Validation Error', 'Please select a sport');
      return false;
    }

    if (!locationName.trim()) {
      Alert.alert('Validation Error', 'Please set a location for the match');
      return false;
    }

    if (scheduledDate <= new Date()) {
      Alert.alert('Validation Error', 'Please select a future date and time');
      return false;
    }

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid duration');
      return false;
    }

    if (!maxParticipants || parseInt(maxParticipants) < 2) {
      Alert.alert('Validation Error', 'Minimum 2 participants required');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const matchLocation = useCurrentLocation 
        ? { latitude: userLocation?.latitude || 0, longitude: userLocation?.longitude || 0 }
        : customLocation;

      // Append privacy info to description for now
      const finalDescription = description.trim() 
        ? `${description.trim()}${isPrivateMatch ? ' [PRIVATE]' : ''}`
        : (isPrivateMatch ? '[PRIVATE]' : undefined);

      const matchData: CreateMatchRequest = {
        sport_id: selectedSport!.id,
        title: title.trim(),
        description: finalDescription,
        location: [matchLocation.longitude, matchLocation.latitude],
        location_name: locationName.trim(),
        scheduled_at: scheduledDate.toISOString(),
        duration: parseInt(duration),
        max_participants: parseInt(maxParticipants),
        skill_level_required: skillLevels[skillLevelIndex],
      };

      const createdMatch = await matchService.createMatch(matchData);
      
      if (isPrivateMatch) {
        Alert.alert(
          'Private Match Created!', 
          'Your private match has been created. You need to invite players for them to join.',
          [
            { 
              text: 'Invite Players Now', 
              onPress: () => (navigation as any).navigate('UserSearch', { 
                matchId: createdMatch.id,
                sport_id: selectedSport!.id 
              })
            }
          ]
        );
      } else {
        Alert.alert(
          'Open Match Created!', 
          'Your match is now visible to other players. You can also invite specific players if you want.',
          [
            { text: 'Done', onPress: () => navigation.goBack() },
            { 
              text: 'Invite Players', 
              onPress: () => (navigation as any).navigate('UserSearch', { 
                matchId: createdMatch.id,
                sport_id: selectedSport!.id 
              })
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating match:', error);
      Alert.alert('Error', error.message || 'Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        centerComponent={{ 
          text: 'Create Match', 
          style: { color: '#fff', fontSize: 20, fontWeight: 'bold' } 
        }}
        leftComponent={{
          icon: 'arrow-back',
          color: '#fff',
          onPress: () => navigation.goBack(),
        }}
        backgroundColor={colors.primary}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Match Details</Text>
          
          <Input
            label="Match Title"
            placeholder="e.g., Weekend Tennis Match"
            value={title}
            onChangeText={setTitle}
            leftIcon={<Ionicons name="trophy-outline" size={20} color={colors.primary} />}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Description (Optional)"
            placeholder="Add more details about the match..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            leftIcon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />}
            containerStyle={styles.inputContainer}
          />
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Sport Selection</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportsContainer}>
            {sports.map((sport) => (
              <Button
                key={sport.id}
                title={sport.name}
                buttonStyle={[
                  styles.sportButton,
                  selectedSport?.id === sport.id && styles.selectedSportButton
                ]}
                titleStyle={[
                  styles.sportButtonText,
                  selectedSport?.id === sport.id && styles.selectedSportButtonText
                ]}
                onPress={() => setSelectedSport(sport)}
              />
            ))}
          </ScrollView>
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          <ModernDateTimePicker
            value={scheduledDate}
            onChange={setScheduledDate}
            mode="datetime"
            minimumDate={new Date()}
            title="Select Match Date & Time"
            color={colors.primary}
          />
          
          <Text style={styles.quickSelectLabel}>Quick Select:</Text>
          <View style={styles.quickSelectContainer}>
            <Button
              title="In 1 hour"
              buttonStyle={styles.quickSelectButton}
              titleStyle={styles.quickSelectText}
              onPress={() => {
                const newDate = new Date();
                newDate.setHours(newDate.getHours() + 1);
                setScheduledDate(newDate);
              }}
            />
            <Button
              title="Tomorrow"
              buttonStyle={styles.quickSelectButton}
              titleStyle={styles.quickSelectText}
              onPress={() => {
                const newDate = new Date();
                newDate.setDate(newDate.getDate() + 1);
                setScheduledDate(newDate);
              }}
            />
            <Button
              title="This Weekend"
              buttonStyle={styles.quickSelectButton}
              titleStyle={styles.quickSelectText}
              onPress={() => {
                const newDate = new Date();
                const daysUntilSaturday = (6 - newDate.getDay()) % 7;
                newDate.setDate(newDate.getDate() + daysUntilSaturday);
                newDate.setHours(10, 0, 0, 0);
                setScheduledDate(newDate);
              }}
            />
          </View>
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Match Settings</Text>
          
          <Input
            label="Duration (minutes)"
            placeholder="60"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            leftIcon={<Ionicons name="timer-outline" size={20} color={colors.primary} />}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Max Participants"
            placeholder="4"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="numeric"
            leftIcon={<Ionicons name="people-outline" size={20} color={colors.primary} />}
            containerStyle={styles.inputContainer}
          />

          <Text style={styles.skillLevelLabel}>Required Skill Level</Text>
          <ButtonGroup
            buttons={skillLevelLabels}
            selectedIndex={skillLevelIndex}
            onPress={setSkillLevelIndex}
            containerStyle={styles.skillLevelContainer}
            selectedButtonStyle={{ backgroundColor: colors.primary }}
          />

          <Text style={styles.visibilityLabel}>Match Visibility</Text>
          <View style={styles.visibilityContainer}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                !isPrivateMatch && styles.selectedVisibilityOption,
                { borderColor: colors.primary }
              ]}
              onPress={() => setIsPrivateMatch(false)}
            >
              <Ionicons 
                name="globe-outline" 
                size={20} 
                color={!isPrivateMatch ? colors.primary : '#666'} 
              />
              <Text style={[
                styles.visibilityOptionText,
                !isPrivateMatch && { color: colors.primary }
              ]}>
                Open
              </Text>
              <Text style={styles.visibilityDescription}>
                Anyone can find and join this match
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.visibilityOption,
                isPrivateMatch && styles.selectedVisibilityOption,
                { borderColor: colors.primary }
              ]}
              onPress={() => setIsPrivateMatch(true)}
            >
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={isPrivateMatch ? colors.primary : '#666'} 
              />
              <Text style={[
                styles.visibilityOptionText,
                isPrivateMatch && { color: colors.primary }
              ]}>
                Private
              </Text>
              <Text style={styles.visibilityDescription}>
                Only invited players can join
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <CheckBox
            title="Use my current location"
            checked={useCurrentLocation}
            onPress={() => setUseCurrentLocation(!useCurrentLocation)}
            containerStyle={styles.checkboxContainer}
          />

          {!useCurrentLocation && (
            <Button
              title="Select Location"
              icon={<Ionicons name="location-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
              buttonStyle={styles.locationButton}
              onPress={selectLocation}
            />
          )}

          <Input
            label="Location Name"
            placeholder="e.g., Central Park Tennis Court"
            value={locationName}
            onChangeText={setLocationName}
            leftIcon={<Ionicons name="location-outline" size={20} color={colors.primary} />}
            containerStyle={styles.inputContainer}
          />
        </Card>

        <Button
          title="Create Match"
          loading={loading}
          buttonStyle={[styles.createButton, { backgroundColor: colors.primary }]}
          titleStyle={styles.createButtonText}
          icon={<Ionicons name="add-circle-outline" size={24} color="#fff" style={{ marginRight: 8 }} />}
          onPress={handleCreate}
        />
      </ScrollView>
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
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 8,
  },
  sportsContainer: {
    marginBottom: 8,
  },
  sportButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedSportButton: {
    backgroundColor: '#007AFF',
  },
  sportButtonText: {
    color: '#333',
    fontSize: 14,
  },
  selectedSportButtonText: {
    color: '#fff',
  },
  dateTimeDisplay: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: '#333',
  },
  dateTimeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInput: {
    flex: 0.48,
  },
  timeInput: {
    flex: 0.48,
  },
  quickSelectLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickSelectButton: {
    flex: 0.3,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  quickSelectText: {
    color: '#333',
    fontSize: 12,
  },
  skillLevelLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 10,
    color: '#86939e',
  },
  skillLevelContainer: {
    marginBottom: 8,
    borderRadius: 8,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    marginBottom: 8,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginBottom: 16,
  },
  createButton: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 10,
    color: '#86939e',
  },
  visibilityContainer: {
    marginBottom: 16,
  },
  visibilityOption: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  selectedVisibilityOption: {
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
  },
  visibilityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

