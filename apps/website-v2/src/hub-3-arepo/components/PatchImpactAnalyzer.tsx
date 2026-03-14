/**
 * PatchImpactAnalyzer Component
 * Cross-reference: Patch changes + Performance impact
 * Combines OPERA (patch changes) + SATOR (before/after performance)
 * 
 * [Ver001.000]
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitCommit, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Calendar,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Target,
  Percent,
  Zap,
  Database,
  ChevronUp,
  ChevronDown,
  Scale
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCrossReferenceEngine } from '../hooks/useArepoData';
import type { PatchPerformanceImpact } from '@/api/crossReference';

interface PatchImpactAnalyzerProps {
  hubColor?: string;
  hubGlow?: string;
}

const PatchImpactAnalyzer: React.FC<PatchImpactAnalyzerProps> = ({
  hubColor = '#0066ff',
  hubGlow = 'rgba(0, 102, 255, 0.4)'
}) => {
  const [patchVersion, setPatchVersion] = useState('');
  const [agentName, setAgentName] = useState('');
  const [result, setResult] = useState<PatchPerformanceImpact | null>(null);
  
  const { 
    getPatchPerformanceImpact, 
    isLoading, 
    error 
  } = useCrossReferenceEngine();

  const handleAnalyze = useCallback(async () => {
    if (!patchVersion.trim() || !agentName.trim()) return;
    
    const data = await getPatchPerformanceImpact(patchVersion, agentName);
    if (data) {
      setResult(data);
    }
  }, [patchVersion, agentName, getPatchPerformanceImpact]);

  const handleClear = () => {
    setPatchVersion('');
    setAgentName('');
    setResult(null);
  };

  const getImpactColor = (category: string) => {
    switch (category) {
      case 'major_buff':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' };
      case 'minor_buff':
        return { bg: 'bg-green-400/10', text: 'text-green-300', border: 'border-green-400/30' };
      case 'neutral':
        return { bg: 'bg-slate/10', text: 'text-slate', border: 'border-slate/30' };
      case 'minor_nerf':
        return { bg: 'bg-orange-400/10', text: 'text-orange-300', border: 'border-orange-400/30' };
      case 'major_nerf':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' };
      default:
        return { bg: 'bg-slate/10', text: 'text-slate', border: 'border-slate/30' };
    }
  };

  const getImpactLabel = (category: string) => {
    switch (category) {
      case 'major_buff':
        return 'Major Buff';
      case 'minor_buff':
        return 'Minor Buff';
      case 'neutral':
        return 'Neutral';
      case 'minor_nerf':
        return 'Minor Nerf';
      case 'major_nerf':
        return 'Major Nerf';
      default:
        return category;
    }
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-400';
    if (delta < 0) return 'text-red-400';
    return 'text-slate';
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <ChevronUp className="w-4 h-4" />;
    if (delta < 0) return <ChevronDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <GlassCard hoverGlow={hubGlow} className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${hubColor}20` }}
          >
            <GitCommit className="w-5 h-5" style={{ color: hubColor }} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Patch Impact Analyzer</h3>
            <p className="text-sm text-slate">
              Analyze how patch changes affected agent performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Patch Version Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              Patch Version
            </label>
            <input
              type="text"
              value={patchVersion}
              onChange={(e) => setPatchVersion(e.target.value)}
              placeholder="e.g., 8.11, 9.0"
              className="w-full px-4 py-3 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate transition-colors"
            />
          </div>

          {/* Agent Name Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate flex items-center gap-2">
              <User className="w-4 h-4" />
              Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g., Jett, Omen, Raze"
              className="w-full px-4 py-3 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate transition-colors"
            />
          </div>
        </div>

        {/* Quick Select */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-slate mr-2">Quick select:</span>
          {['8.11', '8.10', '8.09', '9.0'].map((version) => (
            <button
              key={version}
              onClick={() => setPatchVersion(version)}
              className="px-3 py-1 text-xs rounded-full border border-mist 
                       hover:border-[#0066ff]/50 hover:text-[#0066ff] transition-colors"
            >
              {version}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleAnalyze}
            disabled={isLoading || !patchVersion.trim() || !agentName.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: hubColor,
              color: '#ffffff'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Analyze Impact
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={handleClear}
            className="px-6 py-3 rounded-lg font-medium border border-mist
                     text-slate hover:text-white hover:border-[#0066ff]/50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear
          </motion.button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header Card */}
            <GlassCard hoverGlow={hubGlow} className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <GitCommit className="w-6 h-6" style={{ color: hubColor }} />
                    <h2 className="font-display text-2xl font-bold">Patch {result.patch_version}</h2>
                  </div>
                  <div className="flex items-center gap-4 text-slate">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {result.agent_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {result.patch_date}
                    </span>
                  </div>
                </div>
                <div 
                  className={`px-4 py-2 rounded-lg text-sm font-medium border
                    ${getImpactColor(result.impact_category).bg}
                    ${getImpactColor(result.impact_category).text}
                    ${getImpactColor(result.impact_category).border}`}
                >
                  {getImpactLabel(result.impact_category)}
                </div>
              </div>

              {/* Data Source Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate mb-4">
                <Database className="w-3 h-3" />
                <span>Data sources: </span>
                <span className="px-2 py-0.5 rounded bg-[#9d4edd]/20 text-[#9d4edd]">OPERA</span>
                <span className="px-2 py-0.5 rounded bg-[#ffd700]/20 text-[#ffd700]">SATOR</span>
              </div>

              {/* Impact Score */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-void-mid mb-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                  style={{ 
                    backgroundColor: result.impact_score >= 0 
                      ? `rgba(0, 255, 136, ${Math.abs(result.impact_score) / 20})` 
                      : `rgba(255, 70, 85, ${Math.abs(result.impact_score) / 20})`,
                    color: result.impact_score >= 0 ? '#00ff88' : '#ff4655'
                  }}
                >
                  {result.impact_score > 0 ? '+' : ''}{result.impact_score}
                </div>
                <div>
                  <div className="text-sm text-slate">Impact Score</div>
                  <div className="text-xs text-slate/70">
                    -10 (major nerf) to +10 (major buff)
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Patch Changes */}
            <GlassCard hoverGlow={hubGlow} className="p-6">
              <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" style={{ color: hubColor }} />
                Patch Changes
              </h4>
              <div className="space-y-4">
                {result.patch_changes.buffs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <ChevronUp className="w-4 h-4" />
                      <span className="font-medium text-sm">Buffs</span>
                    </div>
                    <ul className="space-y-1">
                      {result.patch_changes.buffs.map((buff, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate pl-6">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          {buff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.patch_changes.nerfs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <ChevronDown className="w-4 h-4" />
                      <span className="font-medium text-sm">Nerfs</span>
                    </div>
                    <ul className="space-y-1">
                      {result.patch_changes.nerfs.map((nerf, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate pl-6">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          {nerf}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.patch_changes.adjustments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-slate mb-2">
                      <Scale className="w-4 h-4" />
                      <span className="font-medium text-sm">Adjustments</span>
                    </div>
                    <ul className="space-y-1">
                      {result.patch_changes.adjustments.map((adj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate pl-6">
                          <Minus className="w-4 h-4 text-slate flex-shrink-0 mt-0.5" />
                          {adj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Patch */}
              <GlassCard hoverGlow={hubGlow} className="p-6">
                <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate" />
                  Before Patch
                </h4>
                <div className="space-y-3">
                  <StatRow 
                    label="Matches" 
                    value={result.before_patch.matches.toLocaleString()} 
                    icon={Target}
                  />
                  <StatRow 
                    label="Pick Rate" 
                    value={`${(result.before_patch.pick_rate * 100).toFixed(1)}%`} 
                    icon={Percent}
                  />
                  <StatRow 
                    label="Win Rate" 
                    value={`${(result.before_patch.win_rate * 100).toFixed(1)}%`} 
                    icon={Zap}
                  />
                  <StatRow 
                    label="Avg ACS" 
                    value={result.before_patch.avg_acs.toFixed(1)} 
                    icon={BarChart3}
                  />
                  <StatRow 
                    label="Avg ADR" 
                    value={result.before_patch.avg_adr.toFixed(1)} 
                    icon={Target}
                  />
                </div>
              </GlassCard>

              {/* After Patch */}
              <GlassCard hoverGlow={hubGlow} className="p-6">
                <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" style={{ color: hubColor }} />
                  After Patch
                </h4>
                <div className="space-y-3">
                  <StatRow 
                    label="Matches" 
                    value={result.after_patch.matches.toLocaleString()} 
                    icon={Target}
                    delta={result.after_patch.matches - result.before_patch.matches}
                  />
                  <StatRow 
                    label="Pick Rate" 
                    value={`${(result.after_patch.pick_rate * 100).toFixed(1)}%`} 
                    icon={Percent}
                    delta={result.pick_rate_delta}
                    isPercentage
                  />
                  <StatRow 
                    label="Win Rate" 
                    value={`${(result.after_patch.win_rate * 100).toFixed(1)}%`} 
                    icon={Zap}
                    delta={result.win_rate_delta}
                    isPercentage
                  />
                  <StatRow 
                    label="Avg ACS" 
                    value={result.after_patch.avg_acs.toFixed(1)} 
                    icon={BarChart3}
                    delta={result.acs_delta}
                  />
                  <StatRow 
                    label="Avg ADR" 
                    value={result.after_patch.avg_adr.toFixed(1)} 
                    icon={Target}
                    delta={result.after_patch.avg_adr - result.before_patch.avg_adr}
                  />
                </div>
              </GlassCard>
            </div>

            {/* Delta Summary */}
            <GlassCard hoverGlow={hubGlow} className="p-6">
              <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: hubColor }} />
                Impact Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DeltaCard 
                  label="Win Rate Change" 
                  value={result.win_rate_delta}
                  isPercentage
                />
                <DeltaCard 
                  label="Pick Rate Change" 
                  value={result.pick_rate_delta}
                  isPercentage
                />
                <DeltaCard 
                  label="ACS Change" 
                  value={result.acs_delta}
                />
                <DeltaCard 
                  label="Total Impact" 
                  value={result.impact_score}
                  showSign
                />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components

interface StatRowProps {
  label: string;
  value: string;
  icon: React.ElementType;
  delta?: number;
  isPercentage?: boolean;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, icon: Icon, delta, isPercentage }) => (
  <div className="flex items-center justify-between py-2 border-b border-mist/50 last:border-0">
    <div className="flex items-center gap-2 text-slate">
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="font-medium">{value}</span>
      {delta !== undefined && (
        <span className={`text-xs flex items-center gap-0.5 ${
          delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-slate'
        }`}>
          {delta > 0 ? <ChevronUp className="w-3 h-3" /> : delta < 0 ? <ChevronDown className="w-3 h-3" /> : null}
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}{isPercentage ? '%' : ''}
        </span>
      )}
    </div>
  </div>
);

interface DeltaCardProps {
  label: string;
  value: number;
  isPercentage?: boolean;
  showSign?: boolean;
}

const DeltaCard: React.FC<DeltaCardProps> = ({ label, value, isPercentage, showSign }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  return (
    <div className={`p-4 rounded-lg border ${
      isPositive ? 'bg-green-500/10 border-green-500/30' : 
      isNegative ? 'bg-red-500/10 border-red-500/30' : 
      'bg-slate/10 border-slate/30'
    }`}>
      <div className="text-xs text-slate mb-1">{label}</div>
      <div className={`text-xl font-bold flex items-center gap-1 ${
        isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate'
      }`}>
        {isPositive ? <TrendingUp className="w-5 h-5" /> : 
         isNegative ? <TrendingDown className="w-5 h-5" /> : 
         <Minus className="w-5 h-5" />}
        {showSign && isPositive ? '+' : ''}{value.toFixed(1)}{isPercentage ? '%' : ''}
      </div>
    </div>
  );
};

export default PatchImpactAnalyzer;
