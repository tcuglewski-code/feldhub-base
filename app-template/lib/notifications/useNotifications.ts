/**
 * useNotifications Hook
 * 
 * React hook for interacting with the NotificationService.
 * Provides easy access to notification state and actions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification, NotificationResponse } from 'expo-notifications';
import NotificationService from './NotificationService';
import type {
  NotificationServiceState,
  NotificationPayload,
  NotificationEventType,
  PushNotificationConfig,
} from './types';

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseNotificationsReturn {
  // State
  initialized: boolean;
  permissionStatus: NotificationServiceState['permissionStatus'];
  token: string | null;
  unreadCount: number;
  lastNotification: NotificationPayload | null;
  subscribedTopics: string[];
  
  // Actions
  requestPermissions: () => Promise<boolean>;
  register: () => Promise<string | null>;
  unregister: () => Promise<void>;
  subscribeToTopics: (topics: string[]) => Promise<void>;
  unsubscribeFromTopics: (topics: string[]) => Promise<void>;
  clearBadge: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  setEnabledEvents: (events: NotificationEventType[]) => Promise<void>;
  isEventEnabled: (event: NotificationEventType) => boolean;
  scheduleNotification: (
    payload: NotificationPayload,
    trigger?: Parameters<typeof NotificationService.prototype.scheduleLocalNotification>[1]
  ) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  
  // Config
  config: PushNotificationConfig;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useNotifications(): UseNotificationsReturn {
  const service = NotificationService.getInstance();
  
  // State
  const [state, setState] = useState<NotificationServiceState>(service.getState());
  const [config] = useState<PushNotificationConfig>(service.getConfig());
  
  // Update state periodically and on events
  const updateState = useCallback(() => {
    setState(service.getState());
  }, [service]);

  // Setup effect
  useEffect(() => {
    // Initial state
    updateState();

    // Listen for notification events to update state
    const removeReceivedHandler = service.addNotificationReceivedHandler(() => {
      updateState();
    });

    const removeResponseHandler = service.addNotificationResponseHandler(() => {
      updateState();
    });

    // Poll state periodically (for badge updates, etc.)
    const interval = setInterval(updateState, 5000);

    return () => {
      removeReceivedHandler();
      removeResponseHandler();
      clearInterval(interval);
    };
  }, [service, updateState]);

  // ==========================================================================
  // MEMOIZED ACTIONS
  // ==========================================================================

  const requestPermissions = useCallback(async () => {
    const result = await service.requestPermissions();
    updateState();
    return result;
  }, [service, updateState]);

  const register = useCallback(async () => {
    const token = await service.registerForPushNotifications();
    updateState();
    return token;
  }, [service, updateState]);

  const unregister = useCallback(async () => {
    await service.unregisterToken();
    updateState();
  }, [service, updateState]);

  const subscribeToTopics = useCallback(async (topics: string[]) => {
    await service.subscribeToTopics(topics);
    updateState();
  }, [service, updateState]);

  const unsubscribeFromTopics = useCallback(async (topics: string[]) => {
    await service.unsubscribeFromTopics(topics);
    updateState();
  }, [service, updateState]);

  const clearBadge = useCallback(async () => {
    await service.clearBadge();
    updateState();
  }, [service, updateState]);

  const setBadgeCount = useCallback(async (count: number) => {
    await service.setBadgeCount(count);
    updateState();
  }, [service, updateState]);

  const setEnabledEvents = useCallback(async (events: NotificationEventType[]) => {
    await service.setEnabledEvents(events);
    updateState();
  }, [service, updateState]);

  const isEventEnabled = useCallback((event: NotificationEventType) => {
    return service.isEventEnabled(event);
  }, [service]);

  const scheduleNotification = useCallback(async (
    payload: NotificationPayload,
    trigger?: Parameters<typeof NotificationService.prototype.scheduleLocalNotification>[1]
  ) => {
    return service.scheduleLocalNotification(payload, trigger);
  }, [service]);

  const cancelNotification = useCallback(async (id: string) => {
    await service.cancelNotification(id);
  }, [service]);

  const cancelAllNotifications = useCallback(async () => {
    await service.cancelAllNotifications();
  }, [service]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    initialized: state.initialized,
    permissionStatus: state.permissionStatus,
    token: state.token,
    unreadCount: state.unreadCount,
    lastNotification: state.lastNotification,
    subscribedTopics: state.subscribedTopics,
    
    // Actions
    requestPermissions,
    register,
    unregister,
    subscribeToTopics,
    unsubscribeFromTopics,
    clearBadge,
    setBadgeCount,
    setEnabledEvents,
    isEventEnabled,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    
    // Config
    config,
  };
}

// =============================================================================
// NOTIFICATION LISTENER HOOKS
// =============================================================================

/**
 * Hook to listen for notification received events
 */
export function useNotificationReceived(
  handler: (notification: Notification) => void
): void {
  const service = NotificationService.getInstance();
  const handlerRef = useRef(handler);
  
  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const remove = service.addNotificationReceivedHandler((notification) => {
      handlerRef.current(notification);
    });
    return remove;
  }, [service]);
}

/**
 * Hook to listen for notification response events (user tapped)
 */
export function useNotificationResponse(
  handler: (response: NotificationResponse) => void
): void {
  const service = NotificationService.getInstance();
  const handlerRef = useRef(handler);
  
  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const remove = service.addNotificationResponseHandler((response) => {
      handlerRef.current(response);
    });
    return remove;
  }, [service]);
}

export default useNotifications;
