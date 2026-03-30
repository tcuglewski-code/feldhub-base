/**
 * AppFabrik Push Notifications Service
 * 
 * Generic push notification wrapper with tenant configuration support.
 * Handles token registration, topic subscriptions, and deep-link navigation.
 */

export * from './NotificationService';
export * from './useNotifications';
export * from './NotificationProvider';
export * from './types';
export { default as NotificationService } from './NotificationService';
