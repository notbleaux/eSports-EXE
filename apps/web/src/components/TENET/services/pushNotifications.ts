/** [Ver001.000] */
/**
 * Push Notifications Service
 * ==========================
 * Web Push Protocol client implementation for NJZiteGeisTe Platform.
 * 
 * Handles:
 * - Browser permission requests
 * - Push subscription management
 * - Service worker registration
 * - Preference synchronization with backend
 */

import { logger } from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
}

export type NotificationCategory = 
  | 'match_start' 
  | 'match_end' 
  | 'odds_change' 
  | 'bet_won' 
  | 'bet_lost' 
  | 'system';

export interface NotificationPreferences {
  globalEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
}

export type PermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PushServiceState {
  isSupported: boolean;
  permission: PermissionStatus;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const VAPID_PUBLIC_KEY_URL = `${API_BASE_URL}/api/notifications/vapid-public-key`;
const SUBSCRIBE_URL = `${API_BASE_URL}/api/notifications/subscribe`;
const UNSUBSCRIBE_URL = `${API_BASE_URL}/api/notifications/unsubscribe`;
const PREFERENCES_URL = `${API_BASE_URL}/api/notifications/preferences`;

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  globalEnabled: true,
  categories: {
    match_start: true,
    match_end: true,
    odds_change: false,
    bet_won: true,
    bet_lost: true,
    system: true,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert URL-safe base64 string to Uint8Array.
 * Required for VAPID applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status.
 */
export function getPermissionStatus(): PermissionStatus {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission as PermissionStatus;
}

// ============================================================================
// Service Worker Management
// ============================================================================

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker.
 * Must be called before any push operations.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    logger.warn('[PushNotifications] Push not supported in this browser');
    return null;
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    logger.info('[PushNotifications] Service worker registered:', serviceWorkerRegistration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    return serviceWorkerRegistration;
  } catch (error) {
    logger.error('[PushNotifications] Service worker registration failed:', error);
    throw new Error('Failed to register service worker');
  }
}

/**
 * Get the current service worker registration.
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (serviceWorkerRegistration) {
    return serviceWorkerRegistration;
  }

  if (!isPushSupported()) {
    return null;
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.ready;
    return serviceWorkerRegistration;
  } catch (error) {
    logger.error('[PushNotifications] Failed to get service worker:', error);
    return null;
  }
}

// ============================================================================
// VAPID Key Management
// ============================================================================

let vapidPublicKey: string | null = null;

/**
 * Fetch VAPID public key from the server.
 */
export async function getVapidPublicKey(): Promise<string | null> {
  if (vapidPublicKey) {
    return vapidPublicKey;
  }

  try {
    const response = await fetch(VAPID_PUBLIC_KEY_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    vapidPublicKey = data.public_key;
    return vapidPublicKey;
  } catch (error) {
    logger.error('[PushNotifications] Failed to fetch VAPID key:', error);
    return null;
  }
}

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Request notification permission from the user.
 * Returns the new permission status.
 */
export async function requestPermission(): Promise<PermissionStatus> {
  if (!isPushSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    logger.info('[PushNotifications] Permission requested:', permission);
    return permission as PermissionStatus;
  } catch (error) {
    logger.error('[PushNotifications] Permission request failed:', error);
    return 'denied';
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Subscribe to push notifications.
 * Requests permission if needed, then creates push subscription.
 */
export async function subscribe(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  // Check/request permission
  let permission = getPermissionStatus();
  if (permission === 'default') {
    permission = await requestPermission();
  }
  
  if (permission === 'denied') {
    throw new Error('Notification permission denied');
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      throw new Error('Service worker not registered');
    }

    // Get VAPID public key
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      throw new Error('VAPID key not available');
    }

    // Subscribe to push
    const pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
    });

    logger.info('[PushNotifications] Push subscription created:', pushSubscription.endpoint);

    // Convert to our format
    const subscription: PushSubscription = {
      endpoint: pushSubscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(pushSubscription.getKey('p256dh')!) as any)),
        auth: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(pushSubscription.getKey('auth')!) as any)),
      },
      userAgent: navigator.userAgent,
    };

    // Send to backend
    const response = await fetch(SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });

    if (!response.ok) {
      throw new Error(`Subscription failed: HTTP ${response.status}`);
    }

    logger.info('[PushNotifications] Subscription stored on server');
    return subscription;

  } catch (error) {
    logger.error('[PushNotifications] Subscription failed:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribe(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    const pushSubscription = await registration.pushManager.getSubscription();
    if (!pushSubscription) {
      logger.info('[PushNotifications] No active subscription found');
      return true;
    }

    // Unsubscribe from push manager
    const unsubscribed = await pushSubscription.unsubscribe();
    
    if (unsubscribed) {
      // Notify backend
      await fetch(UNSUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
      });
      
      logger.info('[PushNotifications] Unsubscribed successfully');
    }

    return unsubscribed;
  } catch (error) {
    logger.error('[PushNotifications] Unsubscribe failed:', error);
    throw error;
  }
}

/**
 * Check if user is currently subscribed to push notifications.
 */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    logger.error('[PushNotifications] Failed to check subscription:', error);
    return false;
  }
}

/**
 * Get current push subscription.
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return null;
    }

    const pushSubscription = await registration.pushManager.getSubscription();
    if (!pushSubscription) {
      return null;
    }

    return {
      endpoint: pushSubscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(pushSubscription.getKey('p256dh')!) as any)),
        auth: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(pushSubscription.getKey('auth')!) as any)),
      },
      userAgent: navigator.userAgent,
    };
  } catch (error) {
    logger.error('[PushNotifications] Failed to get subscription:', error);
    return null;
  }
}

// ============================================================================
// Preferences Management
// ============================================================================

/**
 * Fetch notification preferences from the server.
 */
export async function fetchPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await fetch(PREFERENCES_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return {
      globalEnabled: data.global_enabled,
      categories: {
        match_start: data.categories.match_start ?? true,
        match_end: data.categories.match_end ?? true,
        odds_change: data.categories.odds_change ?? false,
        bet_won: data.categories.bet_won ?? true,
        bet_lost: data.categories.bet_lost ?? true,
        system: data.categories.system ?? true,
      },
    };
  } catch (error) {
    logger.error('[PushNotifications] Failed to fetch preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update notification preferences on the server.
 */
export async function updatePreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const payload: any = {};
    
    if (preferences.globalEnabled !== undefined) {
      payload.global_enabled = preferences.globalEnabled;
    }
    
    if (preferences.categories) {
      payload.categories = preferences.categories;
    }

    const response = await fetch(PREFERENCES_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    logger.info('[PushNotifications] Preferences updated');
    
    return {
      globalEnabled: data.global_enabled,
      categories: {
        match_start: data.categories.match_start ?? true,
        match_end: data.categories.match_end ?? true,
        odds_change: data.categories.odds_change ?? false,
        bet_won: data.categories.bet_won ?? true,
        bet_lost: data.categories.bet_lost ?? true,
        system: data.categories.system ?? true,
      },
    };
  } catch (error) {
    logger.error('[PushNotifications] Failed to update preferences:', error);
    throw error;
  }
}

// ============================================================================
// Test Notification
// ============================================================================

/**
 * Send a test notification (for debugging).
 */
export async function sendTestNotification(
  title: string = 'Test Notification',
  body: string = 'This is a test notification from NJZiteGeisTe Platform'
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    logger.info('[PushNotifications] Test notification sent:', data);
    return data.success ?? false;
  } catch (error) {
    logger.error('[PushNotifications] Test notification failed:', error);
    throw error;
  }
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize push notifications.
 * Registers service worker and checks subscription status.
 */
export async function initializePushNotifications(): Promise<PushServiceState> {
  const state: PushServiceState = {
    isSupported: isPushSupported(),
    permission: getPermissionStatus(),
    isSubscribed: false,
    subscription: null,
    preferences: DEFAULT_PREFERENCES,
    isLoading: true,
    error: null,
  };

  if (!state.isSupported) {
    state.isLoading = false;
    state.error = 'Push notifications not supported in this browser';
    return state;
  }

  try {
    // Register service worker
    await registerServiceWorker();
    
    // Check subscription status
    state.isSubscribed = await isSubscribed();
    
    if (state.isSubscribed) {
      state.subscription = await getCurrentSubscription();
    }
    
    // Load preferences
    state.preferences = await fetchPreferences();
    
  } catch (error) {
    logger.error('[PushNotifications] Initialization failed:', error);
    state.error = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    state.isLoading = false;
  }

  return state;
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Listen for messages from the service worker.
 */
export function onServiceWorkerMessage(
  callback: (event: MessageEvent) => void
): () => void {
  if (!isPushSupported()) {
    return () => {};
  }

  navigator.serviceWorker.addEventListener('message', callback);
  
  return () => {
    navigator.serviceWorker.removeEventListener('message', callback);
  };
}

// Default export
export default {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  registerServiceWorker,
  subscribe,
  unsubscribe,
  isSubscribed,
  getCurrentSubscription,
  fetchPreferences,
  updatePreferences,
  sendTestNotification,
  initializePushNotifications,
  onServiceWorkerMessage,
};
