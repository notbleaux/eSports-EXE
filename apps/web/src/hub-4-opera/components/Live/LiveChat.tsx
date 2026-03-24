/**
 * LiveChat - Chat UI (read-only v1, WebSocket in Week 1)
 * 
 * [Ver001.000]
 */
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Smile,
  Wifi,
  WifiOff,
  Shield,
  Star,
  Award,
  BadgeCheck,
  MoreVertical,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';
import type { LiveChatProps, ChatMessage, UserBadge } from './types';

const OPERA_COLOR = colors.hub.opera.base;
const OPERA_GLOW = colors.hub.opera.glow;

// Badge configuration
const BADGE_CONFIG: Record<UserBadge, { icon: typeof Shield; color: string; label: string }> = {
  mod: {
    icon: Shield,
    color: '#00d4ff',
    label: 'MOD',
  },
  vip: {
    icon: Star,
    color: '#ff4655',
    label: 'VIP',
  },
  sub: {
    icon: Award,
    color: '#9d4edd',
    label: 'SUB',
  },
  founder: {
    icon: BadgeCheck,
    color: '#ffd700',
    label: 'FOUNDER',
  },
  verified: {
    icon: BadgeCheck,
    color: '#00ff88',
    label: 'VERIFIED',
  },
};

// User badge component
const UserBadge: React.FC<{ badge: UserBadge }> = ({ badge }) => {
  const config = BADGE_CONFIG[badge];
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
      title={config.label}
    >
      <Icon className="w-3 h-3" />
    </span>
  );
};

// Format timestamp
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Chat message component
const ChatMessageItem: React.FC<{ message: ChatMessage; isConsecutive?: boolean }> = ({
  message,
  isConsecutive,
}) => {
  const hasBadge = !!message.user.badge;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'py-1.5 px-3 hover:bg-white/5 transition-colors',
        isConsecutive ? 'pl-12' : ''
      )}
    >
      {!isConsecutive && (
        <div className="flex items-center gap-2 mb-1">
          <img
            src={message.user.avatar}
            alt={message.user.name}
            className="w-6 h-6 rounded-full bg-white/10 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/24?text=${message.user.name.charAt(0)}`;
            }}
          />
          <div className="flex items-center gap-1.5">
            {hasBadge && <UserBadge badge={message.user.badge!} />}
            <span
              className="font-semibold text-sm cursor-pointer hover:underline"
              style={{ color: hasBadge ? BADGE_CONFIG[message.user.badge!].color : OPERA_COLOR }}
            >
              {message.user.name}
            </span>
          </div>
          <span className="text-[10px] text-white/30">{formatTime(message.timestamp)}</span>
        </div>
      )}
      <p className={cn('text-sm text-white/90 break-words', !isConsecutive ? 'pl-8' : '')}>
        {message.message}
      </p>
    </motion.div>
  );
};

// Connection status indicator
const ConnectionStatus: React.FC<{ isConnected: boolean; viewerCount?: number }> = ({
  isConnected,
  viewerCount,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-4 h-4 text-green-400" />
            </motion.div>
            <span className="text-xs text-white/60">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-xs text-white/60">Disconnected</span>
          </>
        )}
      </div>
      {viewerCount !== undefined && (
        <div className="flex items-center gap-1 text-xs text-white/50">
          <Users className="w-3 h-3" />
          <span>{viewerCount.toLocaleString()} watching</span>
        </div>
      )}
    </div>
  );
};

// Emoji picker (simplified - just common emojis)
const EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '🎉', '👏', '😢'];

const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  isOpen: boolean;
}> = ({ onSelect, isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full left-0 mb-2 p-2 rounded-lg bg-[#1a1a25] border border-white/10 shadow-xl"
        >
          <div className="flex gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const LiveChat: React.FC<LiveChatProps> = ({ matchId, messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isConnected] = useState(true); // v1: always "connected" for UI demo
  const [viewerCount] = useState(15432); // Mock viewer count

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send (v1: UI only, no actual sending)
  const handleSend = () => {
    if (!inputValue.trim()) return;
    // v1: Just clear input - no actual sending
    setInputValue('');
  };

  // Handle emoji select
  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm" style={{ color: OPERA_COLOR }}>
            Live Chat
          </h3>
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
            #{matchId.slice(0, 8)}
          </span>
        </div>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
          <MoreVertical className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} viewerCount={viewerCount} />

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin space-y-0.5"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${OPERA_COLOR}20` }}
            >
              <Send className="w-5 h-5" style={{ color: OPERA_COLOR }} />
            </div>
            <p className="text-sm text-white/60">Welcome to the chat!</p>
            <p className="text-xs text-white/40 mt-1">Be respectful and have fun.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isConsecutive =
              prevMessage && prevMessage.user.name === message.user.name;

            return (
              <ChatMessageItem
                key={message.id}
                message={message}
                isConsecutive={isConsecutive}
              />
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Say something..."
              className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#9d4edd]/50 transition-colors"
            />
            <button
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <Smile className="w-4 h-4 text-white/50" />
            </button>
            <EmojiPicker
              onSelect={handleEmojiSelect}
              isOpen={isEmojiPickerOpen}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'p-2.5 rounded-lg transition-all duration-200',
              inputValue.trim()
                ? 'bg-[#9d4edd] hover:opacity-90'
                : 'bg-white/10 cursor-not-allowed'
            )}
          >
            <Send
              className={cn(
                'w-4 h-4',
                inputValue.trim() ? 'text-white' : 'text-white/40'
              )}
            />
          </button>
        </div>
        <p className="text-[10px] text-white/30 mt-2 text-center">
          Chat is in read-only mode for v1
        </p>
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(157, 78, 221, 0.3);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(157, 78, 221, 0.5);
        }
      `}</style>
    </GlassCard>
  );
};

export default LiveChat;
