/**
 * Admin Dashboard Page — Phase 5
 *
 * Central hub for data verification, review queue management, and system monitoring.
 *
 * [Ver002.000]
 */

import { useState } from 'react';
import { useReviewQueue } from '@/lib/api-client';
import { ReviewQueuePanel, StatCard } from '@/components/AdminPanel';
import { motion } from 'framer-motion';

type AdminTab = 'overview' | 'review-queue' | 'health';

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const { data } = useReviewQueue();
  const items = data?.data || [];

  // Calculate stats
  const stats = {
    total: items.length,
    highPriority: items.filter((i: any) => i.confidence < 0.5).length,
    avgConfidence: items.length > 0
      ? ((items.reduce((sum: number, i: any) => sum + i.confidence, 0) / items.length) * 100).toFixed(0)
      : '0',
    pendingReview: items.filter((i: any) => i.confidence < 0.85).length,
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'review-queue', label: `Review Queue (${stats.highPriority})` },
    { id: 'health', label: 'System Health' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/50">Data verification, quality assurance, and system monitoring</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
                tab === t.id
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Items in Queue"
                value={stats.total.toString()}
                color="white"
              />
              <StatCard
                label="High Priority (< 50%)"
                value={stats.highPriority.toString()}
                color="red"
              />
              <StatCard
                label="Pending Review (< 85%)"
                value={stats.pendingReview.toString()}
                color="white"
              />
              <StatCard
                label="Average Confidence"
                value={`${stats.avgConfidence}%`}
                color="green"
              />
            </div>

            {/* Quick Actions */}
            <div className="p-6 border border-white/10 bg-white/[0.02] rounded-lg">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTab('review-queue')}
                  className="px-4 py-3 bg-red-500/20 border border-red-500/50 rounded text-sm font-bold text-red-400 hover:bg-red-500/30 transition-all"
                >
                  Review High Priority Items
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded text-sm font-bold text-white/70 hover:bg-white/10 transition-all"
                >
                  Export Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded text-sm font-bold text-white/70 hover:bg-white/10 transition-all"
                >
                  System Status
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Review Queue Tab */}
        {tab === 'review-queue' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ReviewQueuePanel />
          </motion.div>
        )}

        {/* Health Tab */}
        {tab === 'health' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="p-6 border border-white/10 bg-white/[0.02] rounded-lg">
              <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
              <div className="space-y-3">
                <StatusIndicator
                  label="API Service"
                  status="connected"
                  lastCheck="Just now"
                />
                <StatusIndicator
                  label="WebSocket Service"
                  status="connected"
                  lastCheck="Just now"
                />
                <StatusIndicator
                  label="TeneT Verification"
                  status="connected"
                  lastCheck="Just now"
                />
                <StatusIndicator
                  label="Data Pipeline (Path A)"
                  status="active"
                  lastCheck="Live"
                />
                <StatusIndicator
                  label="Data Pipeline (Path B)"
                  status="active"
                  lastCheck="Live"
                />
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ServiceCard
                title="API Gateway"
                endpoint="http://localhost:8000/api"
                status="operational"
              />
              <ServiceCard
                title="WebSocket Service"
                endpoint="ws://localhost:8002"
                status="operational"
              />
              <ServiceCard
                title="TeneT Verification"
                endpoint="http://localhost:8001"
                status="operational"
              />
              <ServiceCard
                title="Database"
                endpoint="PostgreSQL · Supabase"
                status="operational"
              />
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-4 border border-white/5 bg-white/[0.01] rounded text-center text-xs text-white/40 font-mono"
        >
          <p>NJZ eSports Admin Panel • Phase 5 • {new Date().toLocaleString()}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

interface StatusIndicatorProps {
  label: string;
  status: 'connected' | 'disconnected' | 'active' | 'inactive' | 'error';
  lastCheck: string;
}

function StatusIndicator({ label, status, lastCheck }: StatusIndicatorProps) {
  const statusColors = {
    connected: 'bg-kunst-green',
    disconnected: 'bg-red-400',
    active: 'bg-kunst-green',
    inactive: 'bg-white/20',
    error: 'bg-red-500',
  };

  const statusLabels = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    active: 'Active',
    inactive: 'Inactive',
    error: 'Error',
  };

  return (
    <div className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.01] rounded">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${
          ['connected', 'active'].includes(status) ? 'animate-pulse' : ''
        }`} />
        <span className="text-white/70">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-xs text-white/50">{statusLabels[status]}</p>
        <p className="text-xs text-white/30">{lastCheck}</p>
      </div>
    </div>
  );
}

interface ServiceCardProps {
  title: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'down';
}

function ServiceCard({ title, endpoint, status }: ServiceCardProps) {
  const statusColors = {
    operational: 'border-kunst-green/30 bg-kunst-green/[0.05]',
    degraded: 'border-yellow-500/30 bg-yellow-500/[0.05]',
    down: 'border-red-500/30 bg-red-500/[0.05]',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-4 border ${statusColors[status]} rounded-lg`}
    >
      <p className="font-bold text-white mb-1">{title}</p>
      <p className="text-xs text-white/50 mb-2">{endpoint}</p>
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${
          status === 'operational' ? 'bg-kunst-green' :
          status === 'degraded' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
        <span className="text-white/60 capitalize">{status}</span>
      </div>
    </motion.div>
  );
}
