/** [Ver001.000] */
/**
 * LiveBroadcast Component
 * =======================
 * Real-time help overlay with broadcast channel subscription,
 * message priority handling, and dismissible notifications.
 * 
 * Features:
 * - Real-time help overlay
 * - Broadcast channel subscription
 * - Message priority handling (critical, high, normal, low)
 * - Dismissible notifications with animation
 * - Screen reader announcements for accessibility
 * - Auto-dismiss for non-critical messages
 * - Keyboard navigation support
 * 
 * Dependencies:
 * - useBroadcast hook
 * - TL-A1-1-B Context Detection Engine (context types)
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { 
  X, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle,
  Megaphone,
  Bell
} from 'lucide-react';
import { useBroadcast, useHelpBroadcast } from '../../hooks/useBroadcast';
import type { 
  BroadcastMessage, 
  BroadcastPriority,
  LiveBroadcastProps,
  BroadcastNotificationProps 
} from '../../lib/broadcast/types';

// ============================================================================
// Constants
// ============================================================================

const PRIORITY_CONFIG: Record<BroadcastPriority, {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  ariaLive: 'assertive' | 'polite';
}> = {
  critical: {
    icon: <AlertCircle className="w-5 h-5" />,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-400 dark:border-red-500',
    textColor: 'text-red-900 dark:text-red-100',
    iconColor: 'text-red-600 dark:text-red-400',
    ariaLive: 'assertive',
  },
  high: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-400 dark:border-orange-500',
    textColor: 'text-orange-900 dark:text-orange-100',
    iconColor: 'text-orange-600 dark:text-orange-400',
    ariaLive: 'assertive',
  },
  normal: {
    icon: <Info className="w-5 h-5" />,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-400 dark:border-blue-500',
    textColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
    ariaLive: 'polite',
  },
  low: {
    icon: <Bell className="w-5 h-5" />,
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-800 dark:text-gray-200',
    iconColor: 'text-gray-500 dark:text-gray-400',
    ariaLive: 'polite',
  },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  help_offer: <HelpCircle className="w-5 h-5" />,
  error_alert: <AlertCircle className="w-5 h-5" />,
  tip: <Info className="w-5 h-5" />,
  system: <Megaphone className="w-5 h-5" />,
  announcement: <Megaphone className="w-5 h-5" />,
};

const POSITION_CLASSES: Record<NonNullable<LiveBroadcastProps['position']>, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

// ============================================================================
// BroadcastNotification Component
// ============================================================================

const BroadcastNotification: React.FC<BroadcastNotificationProps> = ({
  message,
  onDismiss,
  onClick,
  index,
}) => {
  const config = PRIORITY_CONFIG[message.priority];
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Handle auto-dismiss
  useEffect(() => {
    if (message.duration && message.duration > 0) {
      const updateInterval = 100; // Update every 100ms
      const decrementPerInterval = (100 * updateInterval) / message.duration;

      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const next = prev - decrementPerInterval;
          if (next <= 0) {
            handleDismiss();
            return 0;
          }
          return next;
        });
      }, updateInterval);

      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, message.duration);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [message.duration]);

  // Focus management - auto-focus critical messages
  useEffect(() => {
    if (message.priority === 'critical' && notificationRef.current) {
      notificationRef.current.focus();
    }
  }, [message.priority]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation
    setTimeout(() => {
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && message.dismissible) {
      handleDismiss();
    }
    if (e.key === 'Enter' && onClick) {
      onClick();
    }
  }, [handleDismiss, onClick, message.dismissible]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Get the appropriate icon
  const typeIcon = TYPE_ICONS[message.type] || config.icon;

  return (
    <div
      ref={notificationRef}
      role="alert"
      aria-live={config.ariaLive}
      aria-atomic="true"
      tabIndex={message.priority === 'critical' ? 0 : -1}
      className={`
        relative w-80 max-w-[calc(100vw-2rem)]
        rounded-lg shadow-lg border-2
        ${config.bgColor}
        ${config.borderColor}
        transform transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        ${onClick ? 'cursor-pointer' : ''}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
      `}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: isExiting ? undefined : 'slideIn 0.3s ease-out',
      }}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      data-testid={`broadcast-notification-${message.id}`}
      data-priority={message.priority}
    >
      {/* Progress bar for auto-dismiss */}
      {message.duration && message.duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-none"
          style={{ 
            width: `${progress}%`,
            right: 'auto',
          }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${config.iconColor}`} aria-hidden="true">
            {typeIcon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${config.textColor}`}>
              {message.title}
            </h4>
            <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
              {message.content}
            </p>
            
            {/* Context info (if available) */}
            {message.context && (
              <p className="text-xs mt-2 opacity-70">
                Context: {message.context.currentFeature || message.context.currentPage}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          {message.dismissible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className={`
                flex-shrink-0 -mr-1 -mt-1 p-1 rounded
                hover:bg-black/5 dark:hover:bg-white/10
                transition-colors
                ${config.textColor}
                focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500
              `}
              aria-label={`Dismiss notification: ${message.title}`}
              data-testid={`dismiss-${message.id}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CSS for slide in animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// LiveBroadcast Component
// ============================================================================

export const LiveBroadcast: React.FC<LiveBroadcastProps> = ({
  position = 'top-right',
  maxVisible = 3,
  showUnreadBadge = true,
  accessibilityAnnouncements = true,
  onMessageDismiss,
  onMessageClick,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [announcedMessages, setAnnouncedMessages] = useState<Set<string>>(new Set());
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Get WebSocket URL from environment
  const wsUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL 
    ? `${import.meta.env.VITE_WS_URL}/ws`
    : 'ws://localhost:8000/ws';

  // Use the broadcast hook
  const {
    messages,
    unreadMessages,
    unreadCount,
    dismiss,
    dismissAll,
    markAsRead,
    isConnected,
  } = useBroadcast({
    url: wsUrl,
    channels: ['help', 'system'],
    autoConnect: true,
  });

  // Filter out dismissed messages and limit visible
  const visibleMessages = messages
    .filter(m => !dismissedIds.has(m.id))
    .slice(0, maxVisible);

  // Handle dismiss
  const handleDismiss = useCallback((message: BroadcastMessage) => {
    setDismissedIds(prev => new Set([...prev, message.id]));
    dismiss(message.id);
    onMessageDismiss?.(message);
  }, [dismiss, onMessageDismiss]);

  // Handle dismiss all
  const handleDismissAll = useCallback(() => {
    const idsToDismiss = visibleMessages.map(m => m.id);
    setDismissedIds(prev => new Set([...prev, ...idsToDismiss]));
    dismissAll();
  }, [visibleMessages, dismissAll]);

  // Handle message click
  const handleMessageClick = useCallback((message: BroadcastMessage) => {
    markAsRead(message.id);
    onMessageClick?.(message);
  }, [markAsRead, onMessageClick]);

  // Screen reader announcements
  useEffect(() => {
    if (!accessibilityAnnouncements) return;

    const newMessages = messages.filter(m => 
      !announcedMessages.has(m.id) && 
      !dismissedIds.has(m.id) &&
      (m.priority === 'critical' || m.priority === 'high')
    );

    if (newMessages.length > 0 && liveRegionRef.current) {
      const announcement = newMessages
        .map(m => `${m.priority} priority: ${m.title}. ${m.content}`)
        .join('. ');
      
      liveRegionRef.current.textContent = announcement;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);

      setAnnouncedMessages(prev => 
        new Set([...prev, ...newMessages.map(m => m.id)])
      );
    }
  }, [messages, announcedMessages, dismissedIds, accessibilityAnnouncements]);

  // Don't render if no visible messages
  if (visibleMessages.length === 0) {
    return (
      /* Hidden live region for screen reader announcements */
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    );
  }

  return (
    <>
      {/* Screen reader live region */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      {/* Notification container */}
      <div
        className={`
          fixed z-50 flex flex-col gap-3
          ${POSITION_CLASSES[position]}
          max-h-[calc(100vh-2rem)] overflow-y-auto
          scrollbar-hide
        `}
        role="region"
        aria-label="Live broadcast notifications"
        data-testid="live-broadcast-container"
      >
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="text-xs text-center text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 rounded px-2 py-1">
            Reconnecting...
          </div>
        )}

        {/* Unread badge */}
        {showUnreadBadge && unreadCount > visibleMessages.length && (
          <div className="text-xs text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded px-2 py-1">
            {unreadCount - visibleMessages.length} more notification{unreadCount - visibleMessages.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Notification list */}
        {visibleMessages.map((message, index) => (
          <BroadcastNotification
            key={message.id}
            message={message}
            onDismiss={() => handleDismiss(message)}
            onClick={() => handleMessageClick(message)}
            index={index}
          />
        ))}

        {/* Dismiss all button (if multiple) */}
        {visibleMessages.length > 1 && (
          <button
            onClick={handleDismissAll}
            className="
              text-xs text-center text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-300
              bg-white/80 dark:bg-gray-800/80
              rounded px-3 py-1.5
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
            aria-label="Dismiss all notifications"
          >
            Dismiss all
          </button>
        )}
      </div>
    </>
  );
};

// ============================================================================
// Hook-based LiveBroadcast (alternative usage)
// ============================================================================

export interface UseLiveBroadcastOptions extends LiveBroadcastProps {
  wsUrl?: string;
  userId?: string;
  channels?: string[];
}

/**
 * Hook version that returns the component and controls
 */
export function useLiveBroadcast(options: UseLiveBroadcastOptions = {}) {
  const { wsUrl, userId, channels = ['help'], ...componentProps } = options;

  const url = wsUrl || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL 
    ? `${import.meta.env.VITE_WS_URL}/ws`
    : 'ws://localhost:8000/ws');

  const broadcast = useHelpBroadcast(url, { userId });

  const Component = useCallback(() => (
    <LiveBroadcast {...componentProps} />
  ), [componentProps]);

  return {
    Component,
    ...broadcast,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { BroadcastNotification };
export default LiveBroadcast;
