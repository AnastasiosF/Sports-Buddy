import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { 
  Text, 
  Button, 
  CheckBox, 
  Card,
  ButtonGroup,
  Header,
  Badge
} from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { sportsService } from '../../services/sportsService';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { Sport, UserSport, SkillLevel } from '../../types';

interface SportSelection {
  sport: Sport;
  selected: boolean;
  skillLevel: SkillLevel;
  preferred: boolean;
}

export const SportsSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [sports, setSports] = useState<SportSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const skillLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const skillLevelButtons = skillLevels.map(level => level.charAt(0).toUpperCase() + level.slice(1));

  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      const sportsData = await sportsService.getAllSports();
      const sportsSelections: SportSelection[] = sportsData.map(sport => ({
        sport,
        selected: false,
        skillLevel: 'beginner',
        preferred: false,
      }));
      setSports(sportsSelections);
    } catch (error) {
      console.error('Failed to load sports:', error);
      Alert.alert('Error', 'Failed to load sports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSportSelection = (sportId: string) => {
    setSports(prev => prev.map(item =>
      item.sport.id === sportId
        ? { ...item, selected: !item.selected }
        : item
    ));
  };

  const updateSkillLevel = (sportId: string, skillLevelIndex: number) => {
    setSports(prev => prev.map(item =>
      item.sport.id === sportId
        ? { ...item, skillLevel: skillLevels[skillLevelIndex] }
        : item
    ));
  };

  const togglePreferred = (sportId: string) => {
    setSports(prev => prev.map(item =>
      item.sport.id === sportId
        ? { ...item, preferred: !item.preferred }
        : item
    ));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSports();
    setRefreshing(false);
  };

  const handleSaveSelections = async () => {
    const selectedSports = sports.filter(item => item.selected);
    
    setSaving(true);
    try {
      // Use bulk update endpoint
      const sportIds = selectedSports.map(selection => selection.sport.id);
      
      // For now, we'll use a general skill level for all sports
      // Individual skill levels per sport will be a future enhancement
      const generalSkillLevel = selectedSports.length > 0 ? selectedSports[0].skillLevel : 'intermediate';
      
      await profileService.updateUserSports(sportIds, generalSkillLevel);

      const message = selectedSports.length === 0 
        ? 'All sports have been removed from your profile.'
        : `${selectedSports.length} sport${selectedSports.length !== 1 ? 's' : ''} saved to your profile!`;

      Alert.alert(
        'Success!', 
        message,
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to save sports selections:', error);
      Alert.alert('Error', error.message || 'Failed to save your selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderSportItem = ({ item }: { item: SportSelection }) => {
    const skillLevelIndex = skillLevels.indexOf(item.skillLevel);

    return (
      <Card containerStyle={styles.sportCard}>
        <Card.Title>{item.sport.name}</Card.Title>
        <Card.Divider />
        <View style={styles.sportHeader}>
          <View style={styles.sportInfo}>
            {item.sport.description && (
              <Text style={styles.sportDescription}>{item.sport.description}</Text>
            )}
            <Text style={styles.playersInfo}>
              {item.sport.min_players} - {item.sport.max_players || '∞'} players
            </Text>
          </View>
          <CheckBox
            checked={item.selected}
            onPress={() => toggleSportSelection(item.sport.id)}
            containerStyle={styles.checkbox}
          />
        </View>

        {item.selected && (
          <View style={styles.selectionOptions}>
            <View style={styles.skillLevelContainer}>
              <Text style={styles.optionLabel}>Skill Level:</Text>
              <ButtonGroup
                buttons={skillLevelButtons}
                selectedIndex={skillLevelIndex}
                onPress={(index) => updateSkillLevel(item.sport.id, index)}
                containerStyle={styles.skillButtonGroup}
                buttonStyle={styles.skillButton}
                textStyle={styles.skillButtonText}
                selectedButtonStyle={styles.selectedSkillButton}
              />
            </View>

            <CheckBox
              title="Mark as preferred sport"
              checked={item.preferred}
              onPress={() => togglePreferred(item.sport.id)}
              containerStyle={styles.preferredCheckbox}
              textStyle={styles.preferredText}
            />
          </View>
        )}
      </Card>
    );
  };

  const selectedCount = sports.filter(item => item.selected).length;
  const preferredCount = sports.filter(item => item.selected && item.preferred).length;

  return (
    <View style={styles.container}>
      <Header
        centerComponent={{
          text: 'Select Your Sports',
          style: { color: 'white', fontSize: 18, fontWeight: 'bold' }
        }}
        backgroundColor="#2196F3"
      />

      <View style={styles.content}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Choose Your Sports</Text>
          <Text style={styles.subtitle}>
            Select the sports you're interested in playing. You can update these later.
          </Text>
          
          {selectedCount > 0 && (
            <View style={styles.selectionSummary}>
              <Badge
                value={`${selectedCount} selected`}
                status="primary"
                containerStyle={styles.summaryBadge}
              />
              {preferredCount > 0 && (
                <Badge
                  value={`${preferredCount} preferred`}
                  status="success"
                  containerStyle={styles.summaryBadge}
                />
              )}
            </View>
          )}
        </View>

        <FlatList
          data={sports}
          renderItem={renderSportItem}
          keyExtractor={(item) => item.sport.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']} // Android
              tintColor="#2196F3" // iOS
            />
          }
        />

        <View style={styles.footer}>
          <Button
            title={saving ? "Saving..." : selectedCount === 0 ? "Clear All Sports" : "Save Selections"}
            onPress={handleSaveSelections}
            disabled={saving}
            buttonStyle={[
              styles.saveButton,
              saving && styles.disabledButton
            ]}
            loading={saving}
          />
          
          <Button
            title="Skip for Now"
            onPress={() => navigation.goBack()}
            buttonStyle={styles.skipButton}
            titleStyle={styles.skipButtonText}
            disabled={saving}
          />
        </View>
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
  },
  headerInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBadge: {
    marginRight: 10,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 100, // Space for footer
  },
  sportCard: {
    borderRadius: 10,
    marginBottom: 20,
  },
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sportInfo: {
    flex: 1,
    marginRight: 15,
  },
  sportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  playersInfo: {
    fontSize: 12,
    color: '#999',
  },
  checkbox: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  selectionOptions: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  skillLevelContainer: {
    marginBottom: 15,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  skillButtonGroup: {
    borderRadius: 5,
    height: 35,
  },
  skillButton: {
    backgroundColor: 'white',
    paddingVertical: 5,
  },
  skillButtonText: {
    fontSize: 12,
  },
  selectedSkillButton: {
    backgroundColor: '#2196F3',
  },
  preferredCheckbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  preferredText: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  skipButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    paddingVertical: 15,
  },
  skipButtonText: {
    color: 'white',
  },
});