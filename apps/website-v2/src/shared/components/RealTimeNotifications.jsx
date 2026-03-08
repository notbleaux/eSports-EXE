import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trophy, Target, TrendingUp } from 'lucide-react';

/**
 * RealTimeNotifications - Live match alerts and updates
 * Priority 2 Feature: Increase engagement with real-time updates
 * Tech: WebSocket simulation with Service Worker ready architecture
 */
export const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate real-time updates (replace with actual WebSocket)
  useEffect(() => {
    if (!isEnabled) return;

    // Mock real-time data stream
    const mockEvents = [
      { id: 1, type: 'match_start', title: 'Match Started', message: 'Fnatic vs LOUD - VCT Masters', icon: Trophy, color: 'text-signal-cyan' },
      { id: 2, type: 'milestone', title: 'Player Milestone', message: 'TenZ reached 10,000 kills', icon: Target, color: 'text-aged-gold' },
      { id: 3, type: 'trending', title: 'Trending Match', message: 'Sentinels vs Cloud9 - Overtime!', icon: TrendingUp, color: 'text-alert-amber' },
    ];

    // Simulate incoming notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const event = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        const newNotification = {
          ...event,
          id: Date.now(),
          timestamp: new Date().toISOString(),
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 5));
        setUnreadCount(prev => prev + 1);
      }
    }, 15000); // Every 15 seconds (demo purposes)

    return () => clearInterval(interval);
  }, [isEnabled]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const enableNotifications = () => {
    setIsEnabled(true);
    // Request browser permission (real implementation)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SATOR Notifications Enabled', {
        body: 'You will receive live match updates',
        icon: '/favicon.svg'
      });
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle Button */}
      <motion.button
        onClick={() => isEnabled ? setNotifications([]) : enableNotifications()}
        className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-void-light/80 backdrop-blur-sm border border-porcelain/10 text-porcelain hover:border-signal-cyan transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Bell size={18} className={isEnabled ? 'text-signal-cyan' : 'text-slate'} />
        <span className="text-sm font-medium hidden sm:inline">
          {isEnabled ? 'Live Updates' : 'Enable Alerts'}
        </span>
        
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-alert-amber text-void-black text-xs font-bold flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-void-light/95 backdrop-blur-lg rounded-xl border border-porcelain/10 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-porcelain/10">
              <span className="text-sm font-medium text-porcelain">Live Updates</span>
              <button
                onClick={clearAll}
                className="text-xs text-slate hover:text-porcelain transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-start gap-3 p-4 border-b border-porcelain/5 hover:bg-void/50 transition-colors"
                  >
                    <div className={`mt-0.5 ${notification.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-porcelain truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-void-mid mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-slate hover:text-porcelain transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeNotifications;