/** [Ver001.000] */
/**
 * Notification Preferences Component
 * ==================================
 * UI for managing push notification settings.
 * 
 * Features:
 * - Enable/disable push notifications
 * - Category-specific preferences
 * - Browser permission status display
 * - Test notification button
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Check, AlertCircle, Loader2, Smartphone, ChevronRight } from 'lucide-react';

import {
  requestPermission,
  subscribe,
  unsubscribe,
  updatePreferences,
  sendTestNotification,
  initializePushNotifications,
  type PermissionStatus,
  type NotificationPreferences as PreferencesType,
  type NotificationCategory,
} from '../../services/pushNotifications';
import { useTENETStore } from '../../store';

// ============================================================================
// Category Configuration
// ============================================================================

interface CategoryConfig {
  id: NotificationCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'match_start',
    label: 'Match Starting',
    description: 'Get notified when a match is about to begin',
    icon: '🎮',
  },
  {
    id: 'match_end',
    label: 'Match Results',
    description: 'Receive final scores and match outcomes',
    icon: '🏆',
  },
  {
    id: 'odds_change',
    label: 'Odds Changes',
    description: 'Alerts for significant betting line movements',
    icon: '📊',
  },
  {
    id: 'bet_won',
    label: 'Winning Bets',
    description: 'Celebration notifications for winning wagers',
    icon: '💰',
  },
  {
    id: 'bet_lost',
    label: 'Losing Bets',
    description: 'Notifications for completed losing bets',
    icon: '📉',
  },
  {
    id: 'system',
    label: 'System Announcements',
    description: 'Platform updates and important announcements',
    icon: '🔔',
  },
];

// ============================================================================
// Helper Components
// ============================================================================

const PermissionBadge: React.FC<{ status: PermissionStatus }> = ({ status }) => {
  const styles = {
    granted: 'bg-green-500/20 text-green-400 border-green-500/30',
    denied: 'bg-red-500/20 text-red-400 border-red-500/30',
    default: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    unsupported: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels = {
    granted: 'Allowed',
    denied: 'Blocked',
    default: 'Not Requested',
    unsupported: 'Not Supported',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}> = ({ checked, onChange, disabled, size = 'md' }) => {
  const sizeClasses = size === 'sm' 
    ? 'w-10 h-5' 
    : 'w-12 h-6';
  
  const knobSize = size === 'sm'
    ? 'w-4 h-4 translate-x-0.5'
    : 'w-5 h-5 translate-x-0.5';
  
  const knobChecked = size === 'sm'
    ? 'translate-x-5'
    : 'translate-x-6';

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex ${sizeClasses} rounded-full transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${checked ? 'bg-blue-500' : 'bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0 ${knobSize}
          bg-white rounded-full shadow-sm
          transition-transform duration-200
          ${checked ? knobChecked : ''}
        `}
      />
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const NotificationPreferences: React.FC = () => {
  // Local state
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionStatus>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesType>({
    globalEnabled: true,
    categories: {
      match_start: true,
      match_end: true,
      odds_change: false,
      bet_won: true,
      bet_lost: true,
      system: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get store actions
  const setPushEnabled = useTENETStore((state) => state.setPushEnabled);
  const setPushSubscription = useTENETStore((state) => state.setPushSubscription);
  const setNotificationPreferences = useTENETStore((state) => state.setNotificationPreferences);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const state = await initializePushNotifications();
        
        setIsSupported(state.isSupported);
        setPermission(state.permission);
        setSubscribed(state.isSubscribed);
        setPreferences(state.preferences);
        
        // Sync with global store
        setPushEnabled(state.isSubscribed);
        if (state.subscription) {
          setPushSubscription(state.subscription);
        }
        setNotificationPreferences(state.preferences);
        
        if (state.error) {
          setError(state.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [setPushEnabled, setPushSubscription, setNotificationPreferences]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Handle enabling push notifications
  const handleEnablePush = async () => {
    setIsToggling(true);
    setError(null);
    
    try {
      // Request permission if needed
      if (permission === 'default') {
        const newPermission = await requestPermission();
        setPermission(newPermission);
        
        if (newPermission === 'denied') {
          setError('Permission denied. Please enable notifications in your browser settings.');
          return;
        }
      }
      
      if (permission === 'denied') {
        setError('Notifications are blocked. Please enable them in your browser settings.');
        return;
      }
      
      // Subscribe
      const subscription = await subscribe();
      
      if (subscription) {
        setSubscribed(true);
        setPushEnabled(true);
        setPushSubscription(subscription);
        setSuccessMessage('Push notifications enabled successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setIsToggling(false);
    }
  };

  // Handle disabling push notifications
  const handleDisablePush = async () => {
    setIsToggling(true);
    setError(null);
    
    try {
      const unsubscribed = await unsubscribe();
      
      if (unsubscribed) {
        setSubscribed(false);
        setPushEnabled(false);
        setPushSubscription(null);
        setSuccessMessage('Push notifications disabled');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setIsToggling(false);
    }
  };

  // Handle global toggle
  const handleGlobalToggle = async () => {
    if (subscribed) {
      await handleDisablePush();
    } else {
      await handleEnablePush();
    }
  };

  // Handle category toggle
  const handleCategoryToggle = useCallback(async (category: NotificationCategory, enabled: boolean) => {
    setIsLoading(true);
    
    try {
      const newPreferences = {
        ...preferences,
        categories: {
          ...preferences.categories,
          [category]: enabled,
        },
      };
      
      const updated = await updatePreferences({ categories: newPreferences.categories });
      setPreferences(updated);
      setNotificationPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  }, [preferences, setNotificationPreferences]);

  // Handle test notification
  const handleTestNotification = async () => {
    setIsSendingTest(true);
    setError(null);
    
    try {
      await sendTestNotification(
        'Test Notification',
        'This is a test from TENET Platform! 🎉'
      );
      setSuccessMessage('Test notification sent! Check your device.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test');
    } finally {
      setIsSendingTest(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-gray-700/50">
            <BellOff className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Push Notifications</h3>
            <p className="mt-1 text-gray-400">
              Your browser doesn&apos;t support push notifications.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try using Chrome, Firefox, or Edge for the best experience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Push Notifications</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage your notification preferences across all devices
          </p>
        </div>
        <PermissionBadge status={permission} />
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Main Toggle Card */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${subscribed ? 'bg-blue-500/20' : 'bg-gray-700/50'}`}>
              {subscribed ? (
                <Bell className="w-6 h-6 text-blue-400" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-white">
                {subscribed ? 'Notifications Enabled' : 'Enable Push Notifications'}
              </h3>
              <p className="text-sm text-gray-400">
                {subscribed 
                  ? 'You\'ll receive notifications on this device' 
                  : 'Get notified about matches, results, and more'}
              </p>
            </div>
          </div>
          
          <Toggle
            checked={subscribed}
            onChange={handleGlobalToggle}
            disabled={isToggling || permission === 'denied'}
          />
        </div>

        {/* Permission denied help */}
        {permission === 'denied' && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-200">
              <strong>Notifications blocked.</strong> To enable:
            </p>
            <ol className="mt-2 text-sm text-yellow-200/80 list-decimal list-inside space-y-1">
              <li>Click the lock/info icon in your browser&apos;s address bar</li>
              <li>Find &quot;Notifications&quot; in the site settings</li>
              <li>Change from &quot;Block&quot; to &quot;Allow&quot;</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </div>

      {/* Category Preferences */}
      {subscribed && (
        <div className="space-y-4">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Notification Categories
          </h3>
          
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <div>
                    <p className="font-medium text-gray-200">{category.label}</p>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                
                <Toggle
                  size="sm"
                  checked={preferences.categories[category.id]}
                  onChange={(checked) => handleCategoryToggle(category.id, checked)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Notification */}
      {subscribed && (
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleTestNotification}
            disabled={isSendingTest}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingTest ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {isSendingTest ? 'Sending...' : 'Send Test Notification'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Verify your notification settings are working correctly
          </p>
        </div>
      )}

      {/* Browser Support Info */}
      <div className="pt-4 border-t border-gray-700">
        <details className="group">
          <summary className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-400">
            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            Browser Compatibility
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-500 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Chrome — Full support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Firefox — Full support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Edge — Full support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">~</span>
              <span>Safari — Limited support (macOS only)</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default NotificationPreferences;
