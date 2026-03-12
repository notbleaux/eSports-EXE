/**
 * TENET Control Panel
 * Master controls for all hubs with system status indicators
 * [Ver001.000]
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Power,
  RefreshCw,
  Terminal,
  Settings,
  Shield,
  Wifi,
  Database,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { useNavigate } from 'react-router-dom';

// Hub configuration for navigation
const HUBS_CONFIG = [
  { id: 'sator', name: 'SATOR', subtitle: 'Observatory', color: '#ffd700', path: '/sator', icon: '◎' },
  { id: 'rotas', name: 'ROTAS', subtitle: 'Harmonic Layer', color: '#00d4ff', path: '/rotas', icon: '◈' },
  { id: 'arepo', name: 'AREPO', subtitle: 'Directory', color: '#0066ff', path: '/arepo', icon: '◉' },
  { id: 'opera', name: 'OPERA', subtitle: 'Nexus', color: '#9d4edd', path: '/opera', icon: '◆' },
];

// TENET hub colors
const TENET_COLORS = {
  primary: '#ffffff',
  glow: 'rgba(255, 255, 255, 0.3)',
  muted: '#c0c0d0',
};

export function ControlPanel({
  systemStatus,
  logs,
  isLoading,
  onRefresh,
  onExecuteCommand,
  lastUpdate,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hubs');
  const [selectedHub, setSelectedHub] = useState(null);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'connected':
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  // Navigate to hub
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 rounded-lg bg-white/5">
        {[
          { id: 'hubs', label: 'Hubs', icon: Activity },
          { id: 'logs', label: 'Logs', icon: Terminal },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${activeTab === tab.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Hub Control Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'hubs' && (
          <motion.div
            key="hubs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* System Overview */}
            <GlassCard
              hoverGlow={TENET_COLORS.glow}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: TENET_COLORS.primary }} />
                  <h3 className="font-semibold text-white">System Overview</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Updated: {formatTime(lastUpdate)}
                  </span>
                  <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(systemStatus.connections).map(([key, status]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      {key === 'websocket' && <Wifi className="w-4 h-4 text-gray-400" />}
                      {key === 'api' && <Activity className="w-4 h-4 text-gray-400" />}
                      {key === 'database' && <Database className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm text-gray-300 capitalize">{key}</span>
                    </div>
                    {getStatusIcon(status)}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Hub Status Cards */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Hub Status
              </h4>
              
              {HUBS_CONFIG.map((hub) => {
                const hubStatus = systemStatus.hubs[hub.id];
                const isSelected = selectedHub === hub.id;
                
                return (
                  <motion.div
                    key={hub.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GlassCard
                      hoverGlow={`${hub.color}40`}
                      className={`
                        p-4 cursor-pointer transition-all
                        ${isSelected ? 'border-opacity-100' : 'border-opacity-50'}
                      `}
                      style={{
                        borderColor: isSelected ? hub.color : undefined,
                        boxShadow: isSelected ? `0 0 20px ${hub.color}30` : undefined,
                      }}
                      onClick={() => {
                        setSelectedHub(isSelected ? null : hub.id);
                        handleNavigate(hub.path);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{
                              backgroundColor: `${hub.color}20`,
                              color: hub.color,
                            }}
                          >
                            {hub.icon}
                          </div>
                          <div>
                            <h5 className="font-semibold text-white">{hub.name}</h5>
                            <p className="text-xs text-gray-400">{hub.subtitle}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Load</div>
                            <div
                              className="text-sm font-mono font-semibold"
                              style={{ color: hubStatus.load > 70 ? '#ff6b6b' : hub.color }}
                            >
                              {hubStatus.load.toFixed(0)}%
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Latency</div>
                            <div className="text-sm font-mono text-white">
                              {hubStatus.latency.toFixed(0)}ms
                            </div>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GlassCard
              hoverGlow={TENET_COLORS.glow}
              className="p-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5" style={{ color: TENET_COLORS.primary }} />
                <h3 className="font-semibold text-white">System Logs</h3>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {logs.slice(0, 20).map((log) => {
                  const hub = HUBS_CONFIG.find(h => h.id === log.hub);
                  
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 text-sm"
                    >
                      <span className="text-gray-500 font-mono text-xs">
                        {formatTime(log.timestamp)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${hub?.color || TENET_COLORS.primary}20`,
                          color: hub?.color || TENET_COLORS.primary,
                        }}
                      >
                        {log.hub.toUpperCase()}
                      </span>
                      <span
                        className={`
                          px-2 py-0.5 rounded text-xs font-medium
                          ${log.level === 'error' ? 'bg-red-500/20 text-red-400' : ''}
                          ${log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                          ${log.level === 'info' ? 'bg-blue-500/20 text-blue-400' : ''}
                        `}
                      >
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-gray-300">{log.message}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <GlassCard hoverGlow={TENET_COLORS.glow} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5" style={{ color: TENET_COLORS.primary }} />
                <h3 className="font-semibold text-white">System Settings</h3>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Auto-refresh', description: 'Update hub status every 3 seconds', default: true },
                  { label: 'Debug Mode', description: 'Show additional diagnostic information', default: false },
                  { label: 'Notifications', description: 'Show system notifications', default: true },
                  { label: 'Compact View', description: 'Reduce spacing in control panel', default: false },
                ].map((setting) => (
                  <div
                    key={setting.label}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div>
                      <div className="text-sm text-white">{setting.label}</div>
                      <div className="text-xs text-gray-400">{setting.description}</div>
                    </div>
                    <button
                      className={`
                        w-12 h-6 rounded-full transition-colors relative
                        ${setting.default ? 'bg-white/30' : 'bg-white/10'}
                      `}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                          ${setting.default ? 'left-7' : 'left-1'}
                        `}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard hoverGlow={TENET_COLORS.glow} className="p-4">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                Quick Actions
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Restart All', icon: Power, color: '#ff6b6b' },
                  { label: 'Clear Cache', icon: RefreshCw, color: '#ffd700' },
                  { label: 'Backup', icon: Database, color: '#00d4ff' },
                  { label: 'Diagnostics', icon: Activity, color: '#9d4edd' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => onExecuteCommand('tenet', action.label)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <Icon className="w-4 h-4" style={{ color: action.color }} />
                      <span className="text-sm text-white">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ControlPanel;
