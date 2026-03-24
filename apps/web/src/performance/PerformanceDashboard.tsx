/**
 * Performance Dashboard
 * Real-time Web Vitals and performance metrics visualization
 * 
 * [Ver001.000]
 */
import React, { useEffect, useState, useCallback } from 'react';
import { performanceMonitor, WebVitalMetric, ResourceMetric, UserTimingMetric } from '../monitoring/PerformanceMonitor';
import { Activity, Zap, Clock, Layout, Server, Timer, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Web Vital thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: '' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
  TBT: { good: 200, poor: 600, unit: 'ms' },
  FPL: { good: 1000, poor: 2000, unit: 'ms' }
};

type VitalName = keyof typeof THRESHOLDS;

interface VitalDisplayProps {
  name: VitalName;
  metric?: WebVitalMetric;
}

const VitalCard: React.FC<VitalDisplayProps> = ({ name, metric }) => {
  const value = metric?.value ?? 0;
  const rating = metric?.rating ?? 'good';
  const threshold = THRESHOLDS[name];
  
  const getColor = () => {
    switch (rating) {
      case 'good': return 'text-green-400 border-green-400/30 bg-green-400/5';
      case 'needs-improvement': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5';
      case 'poor': return 'text-red-400 border-red-400/30 bg-red-400/5';
    }
  };

  const getIcon = () => {
    switch (name) {
      case 'LCP': return <Layout className="w-5 h-5" />;
      case 'INP': return <Zap className="w-5 h-5" />;
      case 'CLS': return <Layout className="w-5 h-5" />;
      case 'FCP': return <Clock className="w-5 h-5" />;
      case 'TTFB': return <Server className="w-5 h-5" />;
      case 'TBT': return <Timer className="w-5 h-5" />;
      case 'FPL': return <Activity className="w-5 h-5" />;
    }
  };

  const formatValue = () => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return Math.round(value).toLocaleString();
  };

  return (
    <div className={`p-4 rounded-xl border ${getColor()} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-semibold text-sm">{name}</span>
        </div>
        {rating === 'good' && <CheckCircle className="w-4 h-4" />}
        {rating === 'needs-improvement' && <Info className="w-4 h-4" />}
        {rating === 'poor' && <AlertTriangle className="w-4 h-4" />}
      </div>
      <div className="text-2xl font-mono font-bold">
        {metric ? formatValue() : '--'}
        <span className="text-sm ml-1 opacity-60">{threshold.unit}</span>
      </div>
      <div className="text-xs mt-1 opacity-60">
        Target: {threshold.good}{threshold.unit}
      </div>
    </div>
  );
};

interface ResourceTableProps {
  resources: ResourceMetric[];
}

const ResourceTable: React.FC<ResourceTableProps> = ({ resources }) => {
  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No slow resources detected
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-white/10">
            <th className="pb-2 font-medium text-white/60">Resource</th>
            <th className="pb-2 font-medium text-white/60">Type</th>
            <th className="pb-2 font-medium text-white/60">Duration</th>
            <th className="pb-2 font-medium text-white/60">Size</th>
          </tr>
        </thead>
        <tbody>
          {resources.slice(0, 10).map((resource, idx) => (
            <tr key={idx} className="border-b border-white/5">
              <td className="py-2 font-mono text-xs truncate max-w-[200px]">
                {resource.name.split('/').pop()}
              </td>
              <td className="py-2">{resource.initiatorType}</td>
              <td className={`py-2 font-mono ${resource.duration > 3000 ? 'text-red-400' : 'text-yellow-400'}`}>
                {Math.round(resource.duration)}ms
              </td>
              <td className="py-2 font-mono">
                {(resource.transferSize / 1024).toFixed(1)} KB
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface TimingTableProps {
  timings: UserTimingMetric[];
}

const TimingTable: React.FC<TimingTableProps> = ({ timings }) => {
  if (timings.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No user timings recorded
      </div>
    );
  }

  // Group and aggregate timings
  const grouped = timings.reduce((acc, timing) => {
    if (!acc[timing.name]) {
      acc[timing.name] = [];
    }
    acc[timing.name].push(timing);
    return acc;
  }, {} as Record<string, UserTimingMetric[]>);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-white/10">
            <th className="pb-2 font-medium text-white/60">Mark Name</th>
            <th className="pb-2 font-medium text-white/60">Count</th>
            <th className="pb-2 font-medium text-white/60">Avg Duration</th>
            <th className="pb-2 font-medium text-white/60">Max</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([name, marks]) => {
            const durations = marks.map(m => m.duration);
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            const max = Math.max(...durations);
            
            return (
              <tr key={name} className="border-b border-white/5">
                <td className="py-2 font-mono text-xs">{name}</td>
                <td className="py-2">{marks.length}</td>
                <td className={`py-2 font-mono ${avg > 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {avg.toFixed(1)}ms
                </td>
                <td className="py-2 font-mono">{max.toFixed(1)}ms</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'resources' | 'timings'>('vitals');

  const refreshMetrics = useCallback(() => {
    setMetrics(performanceMonitor.getMetrics());
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshMetrics, 1000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  const webVitalsRecord = metrics.webVitals.reduce((acc, vital) => {
    acc[vital.name] = vital;
    return acc;
  }, {} as Record<string, WebVitalMetric>);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-purple-600/90 hover:bg-purple-500/90 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
        title="Performance Dashboard"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[500px] max-w-[calc(100vw-2rem)] max-h-[600px] bg-[#0a0a0f]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold">Performance Monitor</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshMetrics}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['vitals', 'resources', 'timings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[400px]">
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THRESHOLDS) as VitalName[]).map(name => (
                <VitalCard 
                  key={name} 
                  name={name} 
                  metric={webVitalsRecord[name]} 
                />
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-3 rounded-lg bg-white/5">
              <div className="text-sm font-medium mb-2">Performance Summary</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-green-400/10">
                  <div className="text-lg font-bold text-green-400">
                    {metrics.webVitals.filter(v => v.rating === 'good').length}
                  </div>
                  <div className="text-xs text-white/60">Good</div>
                </div>
                <div className="p-2 rounded bg-yellow-400/10">
                  <div className="text-lg font-bold text-yellow-400">
                    {metrics.webVitals.filter(v => v.rating === 'needs-improvement').length}
                  </div>
                  <div className="text-xs text-white/60">Needs Work</div>
                </div>
                <div className="p-2 rounded bg-red-400/10">
                  <div className="text-lg font-bold text-red-400">
                    {metrics.webVitals.filter(v => v.rating === 'poor').length}
                  </div>
                  <div className="text-xs text-white/60">Poor</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/60">
                Slow Resources ({metrics.slowResources.length})
              </span>
            </div>
            <ResourceTable resources={metrics.slowResources} />
          </div>
        )}

        {activeTab === 'timings' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/60">
                User Timings ({metrics.userTimings.length})
              </span>
            </div>
            <TimingTable timings={metrics.userTimings} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 text-xs text-white/40 text-center">
        Updates every second • Click refresh for latest
      </div>
    </div>
  );
};

export default PerformanceDashboard;
