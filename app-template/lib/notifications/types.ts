/**
 * Push Notification Type Definitions
 */

import type { NotificationResponse, Notification } from 'expo-notifications';

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Notification event types that can trigger push notifications.
 * Configure which events are enabled per tenant in tenant.ts
 */
export type NotificationEventType =
  // Task/Assignment events
  | 'task.assigned'
  | 'task.updated'
  | 'task.completed'
  | 'task.due_soon'
  | 'task.overdue'
  // Time tracking events
  | 'time.reminder'
  | 'time.week_summary'
  // Team events
  | 'team.member_joined'
  | 'team.schedule_changed'
  // Document events
  | 'document.uploaded'
  | 'document.signed'
  // Message events
  | 'message.received'
  | 'message.broadcast'
  // Sync events
  | 'sync.conflict'
  | 'sync.failed'
  // System events
  | 'system.update_available'
  | 'system.maintenance'
  // Custom (tenant-specific)
  | string;

/**
 * Push notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Push notification channel for Android
 */
export interface NotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance: 'min' | 'low' | 'default' | 'high' | 'max';
  sound?: boolean;
  vibration?: boolean;
  badge?: boolean;
}

/**
 * Deep link configuration for navigation
 */
export interface NotificationDeepLink {
  route: string;
  params?: Record<string, unknown>;
}

/**
 * Payload structure for push notifications
 */
export interface NotificationPayload {
  id?: string;
  title: string;
  body: string;
  eventType: NotificationEventType;
  priority?: NotificationPriority;
  deepLink?: NotificationDeepLink;
  data?: Record<string, unknown>;
  channelId?: string;
  badge?: number;
  sound?: boolean;
  imageUrl?: string;
  actions?: NotificationAction[];
}

/**
 * Notification action button
 */
export interface NotificationAction {
  id: string;
  label: string;
  deepLink?: NotificationDeepLink;
}

// =============================================================================
// TENANT CONFIGURATION
// =============================================================================

/**
 * Push notification tenant configuration
 * Extended from basic tenant.ts push config
 */
export interface PushNotificationConfig {
  enabled: boolean;
  requestOnLogin: boolean;
  topics: string[];
  
  /**
   * Event types that trigger notifications (tenant can enable/disable)
   */
  enabledEvents: NotificationEventType[];
  
  /**
   * Quiet hours (no notifications during this time)
   */
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "07:00"
    allowCritical: boolean;
  };
  
  /**
   * Custom notification channels for Android
   */
  channels?: NotificationChannel[];
  
  /**
   * Route mapping for event types → deep links
   */
  routeMapping?: Partial<Record<NotificationEventType, string>>;
}

/**
 * Default push notification configuration
 */
export const defaultPushConfig: PushNotificationConfig = {
  enabled: true,
  requestOnLogin: true,
  topics: ['all'],
  enabledEvents: [
    'task.assigned',
    'task.updated',
    'task.due_soon',
    'message.received',
    'message.broadcast',
    'system.update_available',
  ],
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    allowCritical: true,
  },
  channels: [
    {
      id: 'default',
      name: 'Allgemein',
      description: 'Allgemeine Benachrichtigungen',
      importance: 'default',
      sound: true,
      vibration: true,
      badge: true,
    },
    {
      id: 'tasks',
      name: 'Aufgaben',
      description: 'Benachrichtigungen zu Aufgaben',
      importance: 'high',
      sound: true,
      vibration: true,
      badge: true,
    },
    {
      id: 'messages',
      name: 'Nachrichten',
      description: 'Chat-Nachrichten',
      importance: 'high',
      sound: true,
      vibration: true,
      badge: true,
    },
    {
      id: 'system',
      name: 'System',
      description: 'System-Benachrichtigungen',
      importance: 'low',
      sound: false,
      vibration: false,
      badge: false,
    },
  ],
  routeMapping: {
    'task.assigned': '/(tabs)/auftraege/[id]',
    'task.updated': '/(tabs)/auftraege/[id]',
    'task.due_soon': '/(tabs)/auftraege/[id]',
    'task.overdue': '/(tabs)/auftraege',
    'message.received': '/(tabs)/messages/[id]',
    'message.broadcast': '/(tabs)/messages',
    'system.update_available': '/(tabs)/einstellungen',
  },
};

// =============================================================================
// SERVICE STATE
// =============================================================================

/**
 * Push token registration state
 */
export interface TokenRegistration {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  registeredAt: number;
  lastUpdatedAt: number;
}

/**
 * Notification service state
 */
export interface NotificationServiceState {
  initialized: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  token: string | null;
  tokenRegistration: TokenRegistration | null;
  subscribedTopics: string[];
  unreadCount: number;
  lastNotification: NotificationPayload | null;
}

// =============================================================================
// HANDLER TYPES
// =============================================================================

/**
 * Handler for received notifications (while app is foregrounded)
 */
export type NotificationReceivedHandler = (
  notification: Notification
) => void | Promise<void>;

/**
 * Handler for notification responses (user tapped notification)
 */
export type NotificationResponseHandler = (
  response: NotificationResponse
) => void | Promise<void>;

/**
 * Navigation function type for deep linking
 */
export type NavigationHandler = (
  route: string,
  params?: Record<string, unknown>
) => void | Promise<void>;
