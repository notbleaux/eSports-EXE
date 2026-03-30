/**
 * ValorantLanding - Valorant-styled Landing Page
 * Tactical dark theme with red accents
 * 
 * [Ver001.000] - Initial Valorant landing page
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Target, 
  BarChart3, 
  Users, 
  Trophy, 
  Zap,
  ChevronRight,
  Play,
  Settings
} from 'lucide-react';
import { ButtonV2 } from '@/components/ui/ButtonV2';
import { PanelV2 } from '@/components/ui/PanelV2';
import { ToggleV2 } from '@/components/ui/ToggleV2';

// Hub configurations for Valorant theme
const HUBS = [
  {
    id: 'sator',
    name: 'SATOR',
    subtitle: 'Analytics',
    description: 'Advanced player metrics and predictive modeling',
    icon: BarChart3,
    color: '#00d4ff',
    path: '/analytics',
  },
  {
    id: 'rotas',
    name: 'ROTAS',
    subtitle: 'Statistics',
    description: 'Historical data and performance tracking',
    icon: Target,
    color: '#ff4444',
    path: '/stats',
  },
  {
    id: 'arepo',
    name: 'AREPO',
    subtitle: 'Community',
    description: 'Tournaments, forums, and social features',
    icon: Users,
    color: '#ffaa00',
    path: '/community',
  },
  {
    id: 'opera',
    name: 'OPERA',
    subtitle: 'Pro Scene',
    description: 'Professional esports and circuit standings',
    icon: Trophy,
    color: '#ff00ff',
    path: '/pro-scene',
  },
  {
    id: 'tenet',
    name: 'TENET',
    subtitle: 'Hub Central',
    description: 'Navigation and system overview',
    icon: Zap,
    color: '#8b5cf6',
    path: '/hubs',
  },
];

export const ValorantLanding: React.FC = () => {
  const [liveMode, setLiveMode] = useState(false);
  const [showStats, setShowStats] = useState(true);

  return (
    <div className="min-h-screen bg-valorant-bg-base text-valorant-text-primary">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-valorant-bg-base/95 backdrop-blur-sm border-b border-valorant-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-valorant-accent-red rounded-sm flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold uppercase tracking-wider">
                NJZ<span className="text-valorant-accent-red">ite</span>GeisTe
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {HUBS.slice(0, 4).map((hub) => (
                <Link
                  key={hub.id}
                  to={hub.path}
                  className="text-sm uppercase tracking-wider text-valorant-text-secondary hover:text-valorant-text-primary transition-colors"
                >
                  {hub.name}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <ButtonV2 variant="primary" size="sm" glow>
              Launch App
            </ButtonV2>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-valorant-accent-red/10 border border-valorant-border-red rounded-sm mb-6">
                <span className="w-2 h-2 bg-valorant-accent-red rounded-full animate-pulse" />
                <span className="text-xs uppercase tracking-wider text-valorant-accent-red">
                  v2.1 Now Live
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none mb-6">
                Tactical
                <br />
                <span className="text-valorant-accent-red">Analytics</span>
              </h1>

              <p className="text-lg text-valorant-text-secondary mb-8 max-w-lg">
                Advanced esports analytics platform for Valorant and CS2. 
                Real-time data, predictive modeling, and professional-grade insights.
              </p>

              <div className="flex flex-wrap gap-4">
                <ButtonV2 variant="primary" size="lg" glow leftIcon={<Play className="w-5 h-5" />}>
                  Get Started
                </ButtonV2>
                <ButtonV2 variant="outline" size="lg" rightIcon={<ChevronRight className="w-5 h-5" />}>
                  View Demo
                </ButtonV2>
              </div>

              {/* Stats Row */}
              {showStats && (
                <div className="flex gap-8 mt-12 pt-8 border-t border-valorant-border-subtle">
                  <div>
                    <div className="text-3xl font-bold text-valorant-text-primary">50K+</div>
                    <div className="text-sm text-valorant-text-muted uppercase tracking-wider">Players</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-valorant-text-primary">12K+</div>
                    <div className="text-sm text-valorant-text-muted uppercase tracking-wider">Matches</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-valorant-text-primary">99.9%</div>
                    <div className="text-sm text-valorant-text-muted uppercase tracking-wider">Uptime</div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right - Control Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <PanelV2 
                variant="accent" 
                header="System Status"
                className="border-valorant-border-red"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-valorant-text-secondary">Live Data Feed</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-valorant-status-success rounded-full animate-pulse" />
                      <span className="text-xs text-valorant-status-success uppercase">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-valorant-text-secondary">API Latency</span>
                    <span className="text-valorant-accent-teal font-mono">24ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-valorant-text-secondary">Active Users</span>
                    <span className="text-valorant-text-primary font-mono">1,247</span>
                  </div>
                </div>
              </PanelV2>

              <PanelV2 header="Quick Controls">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-valorant-text-secondary">Live Mode</span>
                    <ToggleV2 
                      checked={liveMode} 
                      onChange={setLiveMode}
                      accent="red"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-valorant-text-secondary">Show Stats</span>
                    <ToggleV2 
                      checked={showStats} 
                      onChange={setShowStats}
                      accent="teal"
                    />
                  </div>
                </div>
              </PanelV2>

              <PanelV2 variant="bordered" className="border-dashed">
                <div className="flex items-center gap-3 text-valorant-text-muted">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Configure dashboard widgets</span>
                </div>
              </PanelV2>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hub Grid Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-valorant-bg-elevated">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
              Choose Your <span className="text-valorant-accent-red">Hub</span>
            </h2>
            <p className="text-valorant-text-secondary max-w-2xl mx-auto">
              Five specialized platforms covering every aspect of esports analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HUBS.map((hub, index) => (
              <motion.div
                key={hub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link to={hub.path}>
                  <PanelV2 
                    hoverGlow
                    className="h-full cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-sm flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${hub.color}20` }}
                      >
                        <hub.icon 
                          className="w-6 h-6" 
                          style={{ color: hub.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold uppercase tracking-wider text-valorant-text-primary">
                            {hub.name}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-valorant-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-valorant-accent-red uppercase tracking-wider mb-2">
                          {hub.subtitle}
                        </p>
                        <p className="text-sm text-valorant-text-secondary">
                          {hub.description}
                        </p>
                      </div>
                    </div>
                  </PanelV2>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-valorant-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-valorant-accent-red rounded-sm" />
              <span className="font-bold uppercase tracking-wider">
                NJZ<span className="text-valorant-accent-red">ite</span>GeisTe
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-valorant-text-muted">
              <Link to="/privacy" className="hover:text-valorant-text-primary transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-valorant-text-primary transition-colors">
                Terms
              </Link>
              <Link to="/contact" className="hover:text-valorant-text-primary transition-colors">
                Contact
              </Link>
            </div>

            <div className="text-xs text-valorant-text-muted uppercase tracking-wider">
              © 2026 NJZiteGeisTe. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ValorantLanding;
