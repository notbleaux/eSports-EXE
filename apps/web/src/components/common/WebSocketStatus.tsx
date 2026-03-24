/**
 * WebSocketStatus Component
 * =========================
 * Displays WebSocket connection status with data-testid for E2E testing.
 * 
 * [Ver001.000]
 */

import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface WebSocketStatusProps {
  status: ConnectionStatus;
  className?: string;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  status,
  className = '',
}) => {
  const config = {
    connected: {
      icon: <Wifi className="w-4 h-4" />,
      text: 'Connected',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
    },
    connecting: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      text: 'Connecting...',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
    },
    disconnected: {
      icon: <WifiOff className="w-4 h-4" />,
      text: 'Disconnected',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
    },
    error: {
      icon: <WifiOff className="w-4 h-4" />,
      text: 'Connection Error',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
    },
  };

  const current = config[status];

  return (
    <div
      data-testid="ws-status"
      data-status={status}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        border ${current.borderColor} ${current.bgColor}
        text-sm font-medium ${current.color}
        transition-all duration-200
        ${className}
      `}
    >
      {current.icon}
      <span>{current.text}</span>
    </div>
  );
};

export default WebSocketStatus;
