/**
 * NotificationProvider
 * 
 * React context provider for push notifications.
 * Handles initialization, authentication integration, and deep link navigation.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import NotificationService from './NotificationService';
import type {
  NotificationServiceState,
  PushNotificationConfig,
  NotificationPayload,
  NotificationEventType,
} from './types';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface NotificationContextValue {
  // State
  state: NotificationServiceState;
  config: PushNotificationConfig;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: (options: InitializeOptions) => Promise<void>;
  register: () => Promise<string | null>;
  unregister: () => Promise<void>;
  updateAuthToken: (token: string | null) => void;
  subscribeToTopics: (topics: string[]) => Promise<void>;
  unsubscribeFromTopics: (topics: string[]) => Promise<void>;
  clearBadge: () => Promise<void>;
  setEnabledEvents: (events: NotificationEventType[]) => Promise<void>;
  scheduleNotification: (payload: NotificationPayload) => Promise<string>;
}

interface InitializeOptions {
  config?: Partial<PushNotificationConfig>;
  apiBaseUrl: string;
  authToken?: string;
}

// =============================================================================
// CONTEXT
// =============================================================================

const NotificationContext = createContext<NotificationContextValue | null>(null);

// =============================================================================
// PROVIDER PROPS
// =============================================================================

interface NotificationProviderProps {
  children: ReactNode;
  /**
   * API base URL for push token registration
   */
  apiBaseUrl: string;
  /**
   * Partial push configuration (merged with defaults)
   */
  config?: Partial<PushNotificationConfig>;
  /**
   * Auto-initialize on mount
   */
  autoInit?: boolean;
  /**
   * Auto-register for notifications after initialization
   */
  autoRegister?: boolean;
  /**
   * Initial auth token (if already logged in)
   */
  initialAuthToken?: string;
}

// =============================================================================
// PROVIDER IMPLEMENTATION
// =============================================================================

export function NotificationProvider({
  children,
  apiBaseUrl,
  config: initialConfig,
  autoInit = true,
  autoRegister = false,
  initialAuthToken,
}: NotificationProviderProps): JSX.Element {
  const router = useRouter();
  const segments = useSegments();
  
  // Service instance
  const service = useMemo(() => NotificationService.getInstance(), []);
  
  // State
  const [state, setState] = useState<NotificationServiceState>(service.getState());
  const [config, setConfig] = useState<PushNotificationConfig>(service.getConfig());
  const [isLoading, setIsLoading] = useState(autoInit);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // NAVIGATION HANDLER
  // ==========================================================================

  const handleNavigation = useCallback((
    route: string,
    params?: Record<string, unknown>
  ) => {
    try {
      console.log('[NotificationProvider] Navigating to:', route, params);
      
      // Replace dynamic segments with actual values
      let resolvedRoute = route;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          resolvedRoute = resolvedRoute.replace(`[${key}]`, String(value));
        });
      }
      
      // Use router to navigate
      router.push(resolvedRoute as any);
    } catch (err) {
      console.error('[NotificationProvider] Navigation failed:', err);
    }
  }, [router]);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  const initialize = useCallback(async (options: InitializeOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await service.initialize({
        config: options.config,
        apiBaseUrl: options.apiBaseUrl,
        authToken: options.authToken,
        navigationHandler: handleNavigation,
      });
      
      setState(service.getState());
      setConfig(service.getConfig());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Initialization failed';
      setError(message);
      console.error('[NotificationProvider] Init error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [service, handleNavigation]);

  // Auto-init on mount
  useEffect(() => {
    if (autoInit) {
      initialize({
        config: initialConfig,
        apiBaseUrl,
        authToken: initialAuthToken,
      }).then(() => {
        // Auto-register if configured and have initial token
        if (autoRegister && initialAuthToken) {
          service.registerForPushNotifications().then(() => {
            setState(service.getState());
          });
        }
      });
    }
    
    return () => {
      service.cleanup();
    };
  }, []); // Only run once on mount

  // ==========================================================================
  // UPDATE STATE ON CHANGES
  // ==========================================================================

  useEffect(() => {
    const updateState = () => setState(service.getState());
    
    // Listen for notifications to update state
    const removeReceived = service.addNotificationReceivedHandler(updateState);
    const removeResponse = service.addNotificationResponseHandler(updateState);
    
    return () => {
      removeReceived();
      removeResponse();
    };
  }, [service]);

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const register = useCallback(async () => {
    const token = await service.registerForPushNotifications();
    setState(service.getState());
    return token;
  }, [service]);

  const unregister = useCallback(async () => {
    await service.unregisterToken();
    setState(service.getState());
  }, [service]);

  const updateAuthToken = useCallback((token: string | null) => {
    service.setAuthToken(token);
  }, [service]);

  const subscribeToTopics = useCallback(async (topics: string[]) => {
    await service.subscribeToTopics(topics);
    setState(service.getState());
  }, [service]);

  const unsubscribeFromTopics = useCallback(async (topics: string[]) => {
    await service.unsubscribeFromTopics(topics);
    setState(service.getState());
  }, [service]);

  const clearBadge = useCallback(async () => {
    await service.clearBadge();
    setState(service.getState());
  }, [service]);

  const setEnabledEvents = useCallback(async (events: NotificationEventType[]) => {
    await service.setEnabledEvents(events);
    setState(service.getState());
  }, [service]);

  const scheduleNotification = useCallback(async (payload: NotificationPayload) => {
    return service.scheduleLocalNotification(payload);
  }, [service]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const contextValue = useMemo<NotificationContextValue>(() => ({
    state,
    config,
    isLoading,
    error,
    initialize,
    register,
    unregister,
    updateAuthToken,
    subscribeToTopics,
    unsubscribeFromTopics,
    clearBadge,
    setEnabledEvents,
    scheduleNotification,
  }), [
    state,
    config,
    isLoading,
    error,
    initialize,
    register,
    unregister,
    updateAuthToken,
    subscribeToTopics,
    unsubscribeFromTopics,
    clearBadge,
    setEnabledEvents,
    scheduleNotification,
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access notification context
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    );
  }
  
  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default NotificationProvider;
