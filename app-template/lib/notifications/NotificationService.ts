/**
 * AppFabrik Push Notification Service
 * 
 * Singleton service for managing push notifications with tenant configuration.
 * Handles permission requests, token management, topic subscriptions, and deep linking.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import type {
  NotificationPayload,
  PushNotificationConfig,
  NotificationServiceState,
  TokenRegistration,
  NotificationReceivedHandler,
  NotificationResponseHandler,
  NavigationHandler,
  NotificationChannel,
  NotificationEventType,
} from './types';
import { defaultPushConfig } from './types';

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  TOKEN: '@appfabrik/push-token',
  TOKEN_REGISTRATION: '@appfabrik/token-registration',
  SUBSCRIBED_TOPICS: '@appfabrik/subscribed-topics',
  NOTIFICATION_PREFS: '@appfabrik/notification-prefs',
  UNREAD_COUNT: '@appfabrik/unread-count',
};

// =============================================================================
// NOTIFICATION SERVICE
// =============================================================================

class NotificationService {
  private static instance: NotificationService;
  
  // State
  private state: NotificationServiceState = {
    initialized: false,
    permissionStatus: 'undetermined',
    token: null,
    tokenRegistration: null,
    subscribedTopics: [],
    unreadCount: 0,
    lastNotification: null,
  };
  
  // Configuration
  private config: PushNotificationConfig = defaultPushConfig;
  private apiBaseUrl: string = '';
  private authToken: string | null = null;
  
  // Handlers
  private notificationReceivedHandlers: Set<NotificationReceivedHandler> = new Set();
  private notificationResponseHandlers: Set<NotificationResponseHandler> = new Set();
  private navigationHandler: NavigationHandler | null = null;
  
  // Subscriptions
  private notificationSubscription: Notifications.Subscription | null = null;
  private responseSubscription: Notifications.Subscription | null = null;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  // ==========================================================================
  // SINGLETON
  // ==========================================================================

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initialize the notification service
   */
  public async initialize(options: {
    config?: Partial<PushNotificationConfig>;
    apiBaseUrl: string;
    authToken?: string;
    navigationHandler?: NavigationHandler;
  }): Promise<void> {
    if (this.state.initialized) {
      console.log('[NotificationService] Already initialized');
      return;
    }

    console.log('[NotificationService] Initializing...');

    // Merge config
    this.config = { ...defaultPushConfig, ...options.config };
    this.apiBaseUrl = options.apiBaseUrl;
    this.authToken = options.authToken || null;
    this.navigationHandler = options.navigationHandler || null;

    // Check if enabled
    if (!this.config.enabled) {
      console.log('[NotificationService] Notifications disabled in config');
      this.state.initialized = true;
      return;
    }

    // Configure notification handler behavior
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const payload = this.parseNotificationPayload(notification);
        
        // Check quiet hours
        if (this.isInQuietHours(payload?.priority)) {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: payload?.sound !== false,
          shouldSetBadge: true,
        };
      },
    });

    // Setup Android channels
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    // Load persisted state
    await this.loadPersistedState();

    // Setup listeners
    this.setupListeners();

    // Check permission status
    const { status } = await Notifications.getPermissionsAsync();
    this.state.permissionStatus = status;

    this.state.initialized = true;
    console.log('[NotificationService] Initialized successfully');
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    const channels = this.config.channels || defaultPushConfig.channels!;
    
    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: this.mapImportance(channel.importance),
        sound: channel.sound ? 'default' : undefined,
        vibrationPattern: channel.vibration ? [0, 250, 250, 250] : undefined,
        enableVibrate: channel.vibration,
      });
    }
  }

  private mapImportance(importance: NotificationChannel['importance']): Notifications.AndroidImportance {
    const map: Record<NotificationChannel['importance'], Notifications.AndroidImportance> = {
      min: Notifications.AndroidImportance.MIN,
      low: Notifications.AndroidImportance.LOW,
      default: Notifications.AndroidImportance.DEFAULT,
      high: Notifications.AndroidImportance.HIGH,
      max: Notifications.AndroidImportance.MAX,
    };
    return map[importance];
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(): void {
    // Notification received (foreground)
    this.notificationSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[NotificationService] Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Notification response (user tapped)
    this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[NotificationService] Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );

    // App state changes (for badge updates)
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Load persisted state from AsyncStorage
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const [token, registration, topics, unreadCount] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN_REGISTRATION),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIBED_TOPICS),
        AsyncStorage.getItem(STORAGE_KEYS.UNREAD_COUNT),
      ]);

      if (token) this.state.token = token;
      if (registration) this.state.tokenRegistration = JSON.parse(registration);
      if (topics) this.state.subscribedTopics = JSON.parse(topics);
      if (unreadCount) this.state.unreadCount = parseInt(unreadCount, 10);
    } catch (error) {
      console.warn('[NotificationService] Failed to load persisted state:', error);
    }
  }

  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================

  /**
   * Request push notification permissions
   */
  public async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('[NotificationService] Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      this.state.permissionStatus = 'granted';
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    this.state.permissionStatus = status;

    return status === 'granted';
  }

  /**
   * Check if permissions are granted
   */
  public hasPermission(): boolean {
    return this.state.permissionStatus === 'granted';
  }

  // ==========================================================================
  // TOKEN MANAGEMENT
  // ==========================================================================

  /**
   * Get or create push token and register with server
   */
  public async registerForPushNotifications(): Promise<string | null> {
    if (!this.config.enabled) {
      console.log('[NotificationService] Notifications disabled');
      return null;
    }

    if (!Device.isDevice) {
      console.warn('[NotificationService] Push notifications require a physical device');
      return null;
    }

    // Request permissions if needed
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('[NotificationService] Permission denied');
      return null;
    }

    try {
      // Get project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId 
        ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.error('[NotificationService] No project ID found');
        return null;
      }

      // Get Expo push token
      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('[NotificationService] Got push token:', token);

      // Store token locally
      this.state.token = token;
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

      // Register with server
      await this.registerTokenWithServer(token);

      // Subscribe to default topics
      await this.subscribeToTopics(this.config.topics);

      return token;
    } catch (error) {
      console.error('[NotificationService] Failed to register:', error);
      return null;
    }
  }

  /**
   * Register token with backend server
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    if (!this.apiBaseUrl || !this.authToken) {
      console.log('[NotificationService] No API config, skipping server registration');
      return;
    }

    const registration: TokenRegistration = {
      token,
      platform: Platform.OS as 'ios' | 'android',
      deviceId: Constants.deviceId ?? 'unknown',
      registeredAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}/push/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(registration),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      this.state.tokenRegistration = registration;
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOKEN_REGISTRATION,
        JSON.stringify(registration)
      );

      console.log('[NotificationService] Token registered with server');
    } catch (error) {
      console.warn('[NotificationService] Server registration failed:', error);
      // Continue anyway - token is stored locally
    }
  }

  /**
   * Unregister push token (on logout)
   */
  public async unregisterToken(): Promise<void> {
    if (!this.state.token) return;

    try {
      // Unregister from server
      if (this.apiBaseUrl && this.authToken) {
        await fetch(`${this.apiBaseUrl}/push/unregister`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ token: this.state.token }),
        });
      }
    } catch (error) {
      console.warn('[NotificationService] Server unregister failed:', error);
    }

    // Clear local state
    this.state.token = null;
    this.state.tokenRegistration = null;
    this.state.subscribedTopics = [];
    
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.TOKEN_REGISTRATION,
      STORAGE_KEYS.SUBSCRIBED_TOPICS,
    ]);
  }

  // ==========================================================================
  // TOPICS
  // ==========================================================================

  /**
   * Subscribe to notification topics
   */
  public async subscribeToTopics(topics: string[]): Promise<void> {
    if (!this.state.token || !this.apiBaseUrl || !this.authToken) return;

    try {
      await fetch(`${this.apiBaseUrl}/push/topics/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          token: this.state.token,
          topics,
        }),
      });

      this.state.subscribedTopics = [
        ...new Set([...this.state.subscribedTopics, ...topics]),
      ];
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SUBSCRIBED_TOPICS,
        JSON.stringify(this.state.subscribedTopics)
      );

      console.log('[NotificationService] Subscribed to topics:', topics);
    } catch (error) {
      console.warn('[NotificationService] Topic subscription failed:', error);
    }
  }

  /**
   * Unsubscribe from notification topics
   */
  public async unsubscribeFromTopics(topics: string[]): Promise<void> {
    if (!this.state.token || !this.apiBaseUrl || !this.authToken) return;

    try {
      await fetch(`${this.apiBaseUrl}/push/topics/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          token: this.state.token,
          topics,
        }),
      });

      this.state.subscribedTopics = this.state.subscribedTopics.filter(
        (t) => !topics.includes(t)
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SUBSCRIBED_TOPICS,
        JSON.stringify(this.state.subscribedTopics)
      );
    } catch (error) {
      console.warn('[NotificationService] Topic unsubscribe failed:', error);
    }
  }

  // ==========================================================================
  // NOTIFICATION HANDLING
  // ==========================================================================

  /**
   * Handle notification received in foreground
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const payload = this.parseNotificationPayload(notification);
    if (payload) {
      this.state.lastNotification = payload;
      
      // Check if event type is enabled
      if (!this.isEventEnabled(payload.eventType)) {
        console.log('[NotificationService] Event type disabled:', payload.eventType);
        return;
      }
    }

    // Increment unread count
    this.incrementUnreadCount();

    // Call registered handlers
    this.notificationReceivedHandlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error('[NotificationService] Handler error:', error);
      }
    });
  }

  /**
   * Handle notification response (user interaction)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const payload = this.parseNotificationPayload(response.notification);

    // Handle navigation
    if (payload?.deepLink && this.navigationHandler) {
      this.navigationHandler(payload.deepLink.route, payload.deepLink.params);
    } else if (payload?.eventType && this.config.routeMapping) {
      const route = this.config.routeMapping[payload.eventType];
      if (route && this.navigationHandler) {
        const params = payload.data as Record<string, unknown> | undefined;
        this.navigationHandler(route, params);
      }
    }

    // Call registered handlers
    this.notificationResponseHandlers.forEach((handler) => {
      try {
        handler(response);
      } catch (error) {
        console.error('[NotificationService] Response handler error:', error);
      }
    });
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(state: AppStateStatus): void {
    if (state === 'active') {
      // Clear badge when app becomes active
      this.clearBadge();
    }
  }

  /**
   * Parse notification into payload structure
   */
  private parseNotificationPayload(
    notification: Notifications.Notification
  ): NotificationPayload | null {
    try {
      const { title, body, data } = notification.request.content;
      
      return {
        id: notification.request.identifier,
        title: title || '',
        body: body || '',
        eventType: (data?.eventType as NotificationEventType) || 'system.update_available',
        priority: data?.priority as NotificationPayload['priority'],
        deepLink: data?.deepLink as NotificationPayload['deepLink'],
        data: data as Record<string, unknown>,
        sound: data?.sound !== false,
      };
    } catch (error) {
      console.warn('[NotificationService] Failed to parse notification:', error);
      return null;
    }
  }

  // ==========================================================================
  // EVENT FILTERING
  // ==========================================================================

  /**
   * Check if an event type is enabled
   */
  public isEventEnabled(eventType: NotificationEventType): boolean {
    return this.config.enabledEvents.includes(eventType);
  }

  /**
   * Enable/disable event types
   */
  public async setEnabledEvents(events: NotificationEventType[]): Promise<void> {
    this.config.enabledEvents = events;
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_PREFS,
      JSON.stringify({ enabledEvents: events })
    );
  }

  /**
   * Check if currently in quiet hours
   */
  private isInQuietHours(priority?: string): boolean {
    if (!this.config.quietHours?.enabled) return false;
    if (priority === 'critical' && this.config.quietHours.allowCritical) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.config.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.config.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  }

  // ==========================================================================
  // BADGE MANAGEMENT
  // ==========================================================================

  /**
   * Get current unread count
   */
  public getUnreadCount(): number {
    return this.state.unreadCount;
  }

  /**
   * Increment unread count
   */
  private async incrementUnreadCount(): Promise<void> {
    this.state.unreadCount += 1;
    await Notifications.setBadgeCountAsync(this.state.unreadCount);
    await AsyncStorage.setItem(
      STORAGE_KEYS.UNREAD_COUNT,
      this.state.unreadCount.toString()
    );
  }

  /**
   * Clear badge and reset unread count
   */
  public async clearBadge(): Promise<void> {
    this.state.unreadCount = 0;
    await Notifications.setBadgeCountAsync(0);
    await AsyncStorage.setItem(STORAGE_KEYS.UNREAD_COUNT, '0');
  }

  /**
   * Set specific badge count
   */
  public async setBadgeCount(count: number): Promise<void> {
    this.state.unreadCount = count;
    await Notifications.setBadgeCountAsync(count);
    await AsyncStorage.setItem(STORAGE_KEYS.UNREAD_COUNT, count.toString());
  }

  // ==========================================================================
  // LOCAL NOTIFICATIONS
  // ==========================================================================

  /**
   * Schedule a local notification
   */
  public async scheduleLocalNotification(
    payload: NotificationPayload,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: {
          eventType: payload.eventType,
          deepLink: payload.deepLink,
          ...payload.data,
        },
        sound: payload.sound !== false,
        badge: payload.badge,
        ...(Platform.OS === 'android' && payload.channelId
          ? { channelId: payload.channelId }
          : {}),
      },
      trigger: trigger || null,
    });

    return identifier;
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Add notification received handler
   */
  public addNotificationReceivedHandler(
    handler: NotificationReceivedHandler
  ): () => void {
    this.notificationReceivedHandlers.add(handler);
    return () => this.notificationReceivedHandlers.delete(handler);
  }

  /**
   * Add notification response handler
   */
  public addNotificationResponseHandler(
    handler: NotificationResponseHandler
  ): () => void {
    this.notificationResponseHandlers.add(handler);
    return () => this.notificationResponseHandlers.delete(handler);
  }

  /**
   * Set navigation handler for deep links
   */
  public setNavigationHandler(handler: NavigationHandler): void {
    this.navigationHandler = handler;
  }

  // ==========================================================================
  // AUTH TOKEN MANAGEMENT
  // ==========================================================================

  /**
   * Update auth token (after login/refresh)
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  /**
   * Get current service state
   */
  public getState(): NotificationServiceState {
    return { ...this.state };
  }

  /**
   * Get current config
   */
  public getConfig(): PushNotificationConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Cleanup subscriptions
   */
  public cleanup(): void {
    this.notificationSubscription?.remove();
    this.responseSubscription?.remove();
    this.appStateSubscription?.remove();
    this.notificationReceivedHandlers.clear();
    this.notificationResponseHandlers.clear();
  }
}

export default NotificationService;
