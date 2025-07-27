import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Badge,
  ListItem,
  Divider,
} from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useMatchInvitations } from '../contexts/MatchInvitationsContext';
import { useThemeColors, useAppTheme } from '../hooks/useThemeColors';
import { matchService } from '../services/matchService';
import { Match, MatchParticipant, formatDateTime, formatDuration } from '../types';

type MatchDetailsRouteProp = RouteProp<{ MatchDetails: { matchId: string } }, 'MatchDetails'>;

export const MatchDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<MatchDetailsRouteProp>();
  const { user } = useAuth();
  const { requestToJoinMatch, sendMatchInvitation } = useMatchInvitations();
  const colors = useThemeColors();
  const theme = useAppTheme();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { matchId } = route.params;

  useEffect(() => {
    loadMatchDetails();
  }, [matchId]);

  const loadMatchDetails = async () => {
    try {
      const matchData = await matchService.getMatch(matchId);
      setMatch(matchData);
    } catch (error: any) {
      console.error('Failed to load match details:', error);
      Alert.alert('Error', 'Failed to load match details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatchDetails();
    setRefreshing(false);
  };

  const handleJoinMatch = async () => {
    if (!match) return;

    setActionLoading(true);
    try {
      await requestToJoinMatch(match.id);
      await loadMatchDetails(); // Refresh to show updated status
    } catch (error: any) {
      console.error('Failed to join match:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvitePlayers = () => {
    if (!match) return;
    (navigation as any).navigate('UserSearch', {
      matchId: match.id,
      sport_id: match.sport_id
    });
  };

  const handleEditMatch = () => {
    if (!match) return;
    // Navigate to edit screen (to be implemented)
    Alert.alert('Coming Soon', 'Match editing will be available in a future update.');
  };

  const handleOpenMap = () => {
    if (!match || !match.location) return;

    const { latitude, longitude } = match.location;
    const label = encodeURIComponent(match.location_name);
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open map application');
    });
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

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'declined': return 'error';
      default: return 'primary';
    }
  };

  const styles = createStyles(theme);

  const isUserCreator = match?.created_by === user?.id;
  const isUserParticipant = match?.participants?.some(p => p.user_id === user?.id);
  const confirmedParticipants = match?.participants?.filter(p => p.status === 'confirmed') || [];
  const pendingParticipants = match?.participants?.filter(p => p.status === 'pending') || [];
  const canJoin = match?.status === 'open' && !isUserCreator && !isUserParticipant;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading match details...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text>Match not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header Card */}
      <Card containerStyle={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.matchTitle}>{match.title}</Text>
            <Text style={styles.sportName}>{match.sport?.name}</Text>
          </View>
          <View style={styles.badges}>
            <Badge
              value={match.status.toUpperCase()}
              status={getStatusColor(match.status)}
              containerStyle={styles.statusBadge}
            />
            {match.skill_level_required !== 'any' && (
              <Badge
                value={match.skill_level_required.toUpperCase()}
                status="primary"
                containerStyle={styles.skillBadge}
              />
            )}
          </View>
        </View>

        {match.description && (
          <>
            <Divider style={styles.divider} />
            <Text style={styles.description}>{match.description}</Text>
          </>
        )}
      </Card>

      {/* Match Details Card */}
      <Card containerStyle={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Match Details</Text>

        <ListItem containerStyle={styles.detailItem}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <ListItem.Content>
            <ListItem.Title style={styles.detailLabel}>When</ListItem.Title>
            <ListItem.Subtitle style={styles.detailValue}>
              {formatDateTime(match.scheduled_at)}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>

        <ListItem containerStyle={styles.detailItem}>
          <Ionicons name="hourglass-outline" size={20} color={colors.primary} />
          <ListItem.Content>
            <ListItem.Title style={styles.detailLabel}>Duration</ListItem.Title>
            <ListItem.Subtitle style={styles.detailValue}>
              {formatDuration(match.duration)}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>

        <ListItem containerStyle={styles.detailItem} onPress={handleOpenMap}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <ListItem.Content>
            <ListItem.Title style={styles.detailLabel}>Location</ListItem.Title>
            <ListItem.Subtitle style={styles.detailValue}>
              {match.location_name}
            </ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>

        <ListItem containerStyle={styles.detailItem}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <ListItem.Content>
            <ListItem.Title style={styles.detailLabel}>Participants</ListItem.Title>
            <ListItem.Subtitle style={styles.detailValue}>
              {confirmedParticipants.length} / {match.max_participants} confirmed
              {pendingParticipants.length > 0 && ` (${pendingParticipants.length} pending)`}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      </Card>

      {/* Organizer Card */}
      <Card containerStyle={styles.organizerCard}>
        <Text style={styles.sectionTitle}>Organized by</Text>
        <ListItem containerStyle={styles.organizerItem}>
          <Avatar
            rounded
            size="medium"
            source={match.creator?.avatar_url ? { uri: match.creator.avatar_url } : undefined}
            title={match.creator?.username[0]?.toUpperCase() || '?'}
            containerStyle={styles.organizerAvatar}
          />
          <ListItem.Content>
            <ListItem.Title style={styles.organizerName}>
              {match.creator?.full_name || match.creator?.username || 'Unknown'}
            </ListItem.Title>
            <ListItem.Subtitle style={styles.organizerUsername}>
              @{match.creator?.username || 'unknown'}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      </Card>

      {/* Participants Card */}
      {confirmedParticipants.length > 0 && (
        <Card containerStyle={styles.participantsCard}>
          <Text style={styles.sectionTitle}>
            Confirmed Participants ({confirmedParticipants.length})
          </Text>
          {confirmedParticipants.map((participant: MatchParticipant, index: number) => (
            <ListItem key={participant.id} containerStyle={styles.participantItem}>
              <Avatar
                rounded
                size="small"
                source={participant.user?.avatar_url ? { uri: participant.user.avatar_url } : undefined}
                title={participant.user?.username[0]?.toUpperCase() || '?'}
                containerStyle={styles.participantAvatar}
              />
              <ListItem.Content>
                <ListItem.Title style={styles.participantName}>
                  {participant.user?.full_name || participant.user?.username || 'Unknown'}
                </ListItem.Title>
                <ListItem.Subtitle style={styles.participantUsername}>
                  @{participant.user?.username || 'unknown'}
                </ListItem.Subtitle>
              </ListItem.Content>
              <Badge
                value={participant.status.toUpperCase()}
                status={getParticipantStatusColor(participant.status)}
                containerStyle={styles.participantStatusBadge}
              />
            </ListItem>
          ))}
        </Card>
      )}

      {/* Pending Participants Card */}
      {pendingParticipants.length > 0 && isUserCreator && (
        <Card containerStyle={styles.participantsCard}>
          <Text style={styles.sectionTitle}>
            Pending Participants ({pendingParticipants.length})
          </Text>
          {pendingParticipants.map((participant: MatchParticipant) => (
            <ListItem key={participant.id} containerStyle={styles.participantItem}>
              <Avatar
                rounded
                size="small"
                source={participant.user?.avatar_url ? { uri: participant.user.avatar_url } : undefined}
                title={participant.user?.username[0]?.toUpperCase() || '?'}
                containerStyle={styles.participantAvatar}
              />
              <ListItem.Content>
                <ListItem.Title style={styles.participantName}>
                  {participant.user?.full_name || participant.user?.username || 'Unknown'}
                </ListItem.Title>
                <ListItem.Subtitle style={styles.participantUsername}>
                  @{participant.user?.username || 'unknown'}
                </ListItem.Subtitle>
              </ListItem.Content>
              <Badge
                value={participant.status.toUpperCase()}
                status={getParticipantStatusColor(participant.status)}
                containerStyle={styles.participantStatusBadge}
              />
            </ListItem>
          ))}
        </Card>
      )}

      {/* Action Buttons */}
      <Card containerStyle={styles.actionsCard}>
        {canJoin && (
          <Button
            title="Request to Join"
            buttonStyle={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleJoinMatch}
            loading={actionLoading}
            icon={<Ionicons name="add" size={16} color="white" style={{ marginRight: theme.spacing.xs }} />}
          />
        )}

        {isUserCreator && (
          <>
            <Button
              title="Invite Players"
              buttonStyle={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleInvitePlayers}
              icon={<Ionicons name="person-add" size={16} color="white" style={{ marginRight: theme.spacing.xs }} />}
            />
            <Button
              title="Edit Match"
              buttonStyle={[styles.actionButton, { backgroundColor: colors.textDisabled }]}
              onPress={handleEditMatch}
              icon={<Ionicons name="create-outline" size={16} color="white" style={{ marginRight: theme.spacing.xs }} />}
            />
          </>
        )}

        <Button
          title="Open in Maps"
          buttonStyle={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={handleOpenMap}
          icon={<Ionicons name="map" size={16} color="white" style={{ marginRight: theme.spacing.xs }} />}
        />
      </Card>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  headerCard: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  matchTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sportName: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  badges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    marginBottom: theme.spacing.sm,
  },
  skillBadge: {
    marginBottom: 0,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  detailsCard: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.subtitle,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  detailLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  detailValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  organizerCard: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  organizerItem: {
    paddingHorizontal: 0,
  },
  organizerAvatar: {
    backgroundColor: theme.colors.primary,
  },
  organizerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  organizerUsername: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  participantsCard: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  participantItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  participantAvatar: {
    backgroundColor: theme.colors.success,
  },
  participantName: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text,
  },
  participantUsername: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  participantStatusBadge: {
    marginLeft: theme.spacing.sm,
  },
  actionsCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  actionButton: {
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
  },
});
