/**
 * NotificationSettings Component
 * 
 * Settings screen for managing push notification preferences.
 * Shows toggle for each notification event type, topic subscriptions, and quiet hours.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Bell, BellOff, Moon, Volume2, VolumeX } from 'lucide-react-native';
import { useNotificationContext } from '../../lib/notifications/NotificationProvider';
import type { NotificationEventType } from '../../lib/notifications/types';

// =============================================================================
// TYPES
// =============================================================================

interface EventCategoryConfig {
  title: string;
  description: string;
  events: {
    type: NotificationEventType;
    label: string;
    description?: string;
  }[];
}

// =============================================================================
// EVENT CATEGORIES
// =============================================================================

const EVENT_CATEGORIES: EventCategoryConfig[] = [
  {
    title: 'Aufgaben',
    description: 'Benachrichtigungen zu Aufgaben und Aufträgen',
    events: [
      {
        type: 'task.assigned',
        label: 'Neue Zuweisung',
        description: 'Wenn dir eine neue Aufgabe zugewiesen wird',
      },
      {
        type: 'task.updated',
        label: 'Aufgabe aktualisiert',
        description: 'Wenn eine deiner Aufgaben geändert wird',
      },
      {
        type: 'task.due_soon',
        label: 'Fällig bald',
        description: 'Erinnerung vor Fälligkeit',
      },
      {
        type: 'task.overdue',
        label: 'Überfällig',
        description: 'Wenn eine Aufgabe überfällig ist',
      },
    ],
  },
  {
    title: 'Nachrichten',
    description: 'Chat und Broadcast-Nachrichten',
    events: [
      {
        type: 'message.received',
        label: 'Neue Nachricht',
        description: 'Wenn du eine direkte Nachricht erhältst',
      },
      {
        type: 'message.broadcast',
        label: 'Broadcast',
        description: 'Wichtige Team-Mitteilungen',
      },
    ],
  },
  {
    title: 'Team',
    description: 'Team- und Zeitplan-Änderungen',
    events: [
      {
        type: 'team.member_joined',
        label: 'Neues Teammitglied',
        description: 'Wenn jemand deinem Team beitritt',
      },
      {
        type: 'team.schedule_changed',
        label: 'Zeitplan geändert',
        description: 'Änderungen am Arbeitsplan',
      },
    ],
  },
  {
    title: 'Dokumente',
    description: 'Dokumente und Unterschriften',
    events: [
      {
        type: 'document.uploaded',
        label: 'Neues Dokument',
        description: 'Wenn ein neues Dokument hochgeladen wird',
      },
      {
        type: 'document.signed',
        label: 'Unterschrift benötigt',
        description: 'Wenn ein Dokument deine Unterschrift benötigt',
      },
    ],
  },
  {
    title: 'System',
    description: 'App-Updates und Wartung',
    events: [
      {
        type: 'system.update_available',
        label: 'App-Update',
        description: 'Wenn eine neue App-Version verfügbar ist',
      },
      {
        type: 'system.maintenance',
        label: 'Wartung',
        description: 'Geplante Wartungsarbeiten',
      },
    ],
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function NotificationSettings(): JSX.Element {
  const {
    state,
    config,
    register,
    unregister,
    setEnabledEvents,
    subscribeToTopics,
    unsubscribeFromTopics,
    clearBadge,
  } = useNotificationContext();

  const [isLoading, setIsLoading] = useState(false);
  const [enabledEvents, setEnabledEventsLocal] = useState<NotificationEventType[]>(
    config.enabledEvents
  );

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleToggleNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      if (state.token) {
        // Disable: unregister token
        await unregister();
        Alert.alert('Deaktiviert', 'Push-Benachrichtigungen wurden deaktiviert.');
      } else {
        // Enable: register token
        const token = await register();
        if (token) {
          Alert.alert('Aktiviert', 'Push-Benachrichtigungen wurden aktiviert.');
        } else {
          Alert.alert(
            'Berechtigung erforderlich',
            'Bitte erlaube Benachrichtigungen in den Geräteeinstellungen.'
          );
        }
      }
    } catch (error) {
      Alert.alert('Fehler', 'Benachrichtigungen konnten nicht geändert werden.');
    } finally {
      setIsLoading(false);
    }
  }, [state.token, register, unregister]);

  const handleToggleEvent = useCallback(async (eventType: NotificationEventType) => {
    const newEvents = enabledEvents.includes(eventType)
      ? enabledEvents.filter((e) => e !== eventType)
      : [...enabledEvents, eventType];
    
    setEnabledEventsLocal(newEvents);
    await setEnabledEvents(newEvents);
  }, [enabledEvents, setEnabledEvents]);

  const handleToggleTopic = useCallback(async (topic: string, enabled: boolean) => {
    if (enabled) {
      await subscribeToTopics([topic]);
    } else {
      await unsubscribeFromTopics([topic]);
    }
  }, [subscribeToTopics, unsubscribeFromTopics]);

  const handleClearBadge = useCallback(async () => {
    await clearBadge();
    Alert.alert('Erledigt', 'Ungelesene Benachrichtigungen wurden zurückgesetzt.');
  }, [clearBadge]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const isEnabled = !!state.token;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Main Toggle */}
      <View style={styles.mainToggle}>
        <View style={styles.mainToggleInfo}>
          {isEnabled ? (
            <Bell size={32} color="#16A34A" />
          ) : (
            <BellOff size={32} color="#9CA3AF" />
          )}
          <View style={styles.mainToggleText}>
            <Text style={styles.mainToggleTitle}>Push-Benachrichtigungen</Text>
            <Text style={styles.mainToggleStatus}>
              {isEnabled ? 'Aktiviert' : 'Deaktiviert'}
            </Text>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Switch
            value={isEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
            thumbColor={isEnabled ? '#16A34A' : '#9CA3AF'}
          />
        )}
      </View>

      {/* Permission Status */}
      {state.permissionStatus === 'denied' && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Benachrichtigungen sind in den Geräteeinstellungen deaktiviert.
            Bitte aktiviere sie dort, um Push-Nachrichten zu erhalten.
          </Text>
        </View>
      )}

      {/* Unread Count */}
      {state.unreadCount > 0 && (
        <TouchableOpacity style={styles.badgeRow} onPress={handleClearBadge}>
          <Text style={styles.badgeText}>
            {state.unreadCount} ungelesene Benachrichtigung{state.unreadCount > 1 ? 'en' : ''}
          </Text>
          <Text style={styles.badgeClear}>Zurücksetzen</Text>
        </TouchableOpacity>
      )}

      {/* Event Categories */}
      {isEnabled && (
        <>
          <Text style={styles.sectionTitle}>Benachrichtigungstypen</Text>
          <Text style={styles.sectionDescription}>
            Wähle, über welche Ereignisse du benachrichtigt werden möchtest.
          </Text>

          {EVENT_CATEGORIES.map((category) => (
            <View key={category.title} style={styles.category}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              
              {category.events.map((event) => (
                <View key={event.type} style={styles.eventRow}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventLabel}>{event.label}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                  </View>
                  <Switch
                    value={enabledEvents.includes(event.type)}
                    onValueChange={() => handleToggleEvent(event.type)}
                    trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                    thumbColor={enabledEvents.includes(event.type) ? '#16A34A' : '#9CA3AF'}
                  />
                </View>
              ))}
            </View>
          ))}

          {/* Topics */}
          <Text style={styles.sectionTitle}>Themen-Abonnements</Text>
          <Text style={styles.sectionDescription}>
            Abonniere bestimmte Themenkanäle.
          </Text>

          <View style={styles.category}>
            {config.topics.map((topic) => (
              <View key={topic} style={styles.eventRow}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventLabel}>
                    {topic === 'all' ? 'Alle Benachrichtigungen' : topic}
                  </Text>
                </View>
                <Switch
                  value={state.subscribedTopics.includes(topic)}
                  onValueChange={(value) => handleToggleTopic(topic, value)}
                  trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                  thumbColor={state.subscribedTopics.includes(topic) ? '#16A34A' : '#9CA3AF'}
                />
              </View>
            ))}
          </View>

          {/* Quiet Hours Info */}
          {config.quietHours?.enabled && (
            <View style={styles.quietHours}>
              <Moon size={20} color="#6B7280" />
              <Text style={styles.quietHoursText}>
                Ruhezeit: {config.quietHours.start} - {config.quietHours.end}
                {config.quietHours.allowCritical && ' (kritische Nachrichten erlaubt)'}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Debug Info (Dev only) */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>Token: {state.token?.slice(0, 30)}...</Text>
          <Text style={styles.debugText}>Permission: {state.permissionStatus}</Text>
          <Text style={styles.debugText}>Topics: {state.subscribedTopics.join(', ')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainToggleText: {
    gap: 2,
  },
  mainToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  mainToggleStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  badgeClear: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  category: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#F9FAFB',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventLabel: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  eventDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  quietHours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 8,
  },
  quietHoursText: {
    fontSize: 14,
    color: '#6B7280',
  },
  debugSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#7F1D1D',
    fontFamily: 'monospace',
  },
});

export default NotificationSettings;
