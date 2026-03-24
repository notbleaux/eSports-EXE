/**
 * NotificationToggle Component
 * ============================
 * Toggle button for enabling/disabling push notifications with data-testid.
 * 
 * [Ver001.000]
 */

import React from 'react';
import { Bell, BellOff } from 'lucide-react';

export interface NotificationToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
  enabled,
  onToggle,
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      data-testid="enable-push-notifications"
      data-enabled={enabled}
      onClick={onToggle}
      disabled={disabled}
      aria-label={enabled ? 'Disable push notifications' : 'Enable push notifications'}
      aria-pressed={enabled}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        transition-all duration-200
        ${enabled 
          ? 'bg-blue-500 text-white hover:bg-blue-600' 
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {enabled ? (
        <Bell className={iconSizes[size]} />
      ) : (
        <BellOff className={iconSizes[size]} />
      )}
    </button>
  );
};

export default NotificationToggle;
