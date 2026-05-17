// @ts-nocheck
/**
 * CrossHubQueryBuilder Component
 * Visual query builder for cross-hub queries
 * Connects SATOR filters with OPERA filters
 * 
 * [Ver001.000]
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers,
  Filter,
  Database,
  Plus,
  X,
  Play,
  Save,
  Clock,
  Trash2,
  ChevronRight,
  Users,
  Trophy,
  Calendar,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCrossReferenceEngine } from '../hooks/useArepoData';
import type { CrossHubQueryConfig, CrossHubQueryResult } from '@/api/crossReference';

interface CrossHubQueryBuilderProps {
  hubColor?: string;
  hubGlow?: string;
}

type FilterType = 'player' | 'team' | 'tournament' | 'date_range' | 'region' | 'patch' | 'metric';
type DataSource = 'sator' | 'opera' | 'both';

interface Filter {
  id: string;
  type: FilterType;
  source: DataSource;
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in';
  value: string | string[] | { start: string; end: string };
}

const FILTER_TYPES: { type: FilterType; label: string; icon: React.ElementType; sources: DataSource[] }[] = [
  { type: 'player', label: 'Player', icon: Users, sources: ['sator', 'both'] },
  { type: 'team', label: 'Team', icon: Users, sources: ['sator', 'both'] },
  { type: 'tournament', label: 'Tournament', icon: Trophy, sources: ['opera', 'both'] },
  { type: 'date_range', label: 'Date Range', icon: Calendar, sources: ['sator', 'opera', 'both'] },
  { type: 'region', label: 'Region', icon: Target, sources: ['opera', 'both'] },
  { type: 'patch', label: 'Patch Version', icon: Database, sources: ['opera', 'both'] },
  { type: 'metric', label: 'Performance Metric', icon: BarChart3, sources: ['sator', 'both'] },
];

const CrossHubQueryBuilder: React.FC<CrossHubQueryBuilderProps> = ({
  hubColor = '#0066ff',
  hubGlow = 'rgba(0, 102, 255, 0.4)'
}) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [queryName, setQueryName] = useState('');
  const [result, setResult] = useState<CrossHubQueryResult | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'results' | 'history'>('builder');
  
  const { 
    executeQuery,
    saveQuery,
    queryHistory,
    savedQueries,
    isLoading, 
    error,
    clearResults
  } = useCrossReferenceEngine();

  const addFilter = (type: FilterType) => {
    const filterType = FILTER_TYPES.find(f => f.type === type);
    if (!filterType) return;

    const newFilter: Filter = {
      id: Date.now().toString(),
      type,
      source: filterType.sources[0],
      field: type === 'player' ? 'player_id' : 
             type === 'team' ? 'team_id' :
             type === 'tournament' ? 'tournament_id' :
             type === 'region' ? 'region' :
             type === 'patch' ? 'patch_version' :
             type === 'metric' ? 'acs' : 'date',
      operator: type === 'date_range' ? 'between' : 'equals',
      value: type === 'date_range' ? { start: '', end: '' } : ''
    };

    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleExecute = useCallback(async () => {
    if (filters.length === 0) return;

    const config: CrossHubQueryConfig = {
      sator_filters: {},
      opera_filters: {}
    };

    // Build query config from filters
    filters.forEach(filter => {
      if (filter.source === 'sator' || filter.source === 'both') {
        if (!config.sator_filters) config.sator_filters = {};
        
        if (filter.type === 'player') {
          config.sator_filters.players = [...(config.sator_filters.players || []), filter.value as string];
        } else if (filter.type === 'team') {
          config.sator_filters.teams = [...(config.sator_filters.teams || []), filter.value as string];
        } else if (filter.type === 'date_range' && typeof filter.value === 'object' && 'start' in filter.value) {
          config.sator_filters.date_range = {
            start: filter.value.start,
            end: filter.value.end
          };
        } else if (filter.type === 'metric') {
          config.sator_filters.metrics = [...(config.sator_filters.metrics || []), filter.field];
        }
      }

      if (filter.source === 'opera' || filter.source === 'both') {
        if (!config.opera_filters) config.opera_filters = {};
        
        if (filter.type === 'tournament') {
          config.opera_filters.tournaments = [...(config.opera_filters.tournaments || []), filter.value as string];
        } else if (filter.type === 'region') {
          config.opera_filters.regions = [...(config.opera_filters.regions || []), filter.value as string];
        } else if (filter.type === 'patch') {
          config.opera_filters.patch_versions = [...(config.opera_filters.patch_versions || []), filter.value as string];
        }
      }
    });

    const data = await executeQuery(config);
    if (data) {
      setResult(data);
      setActiveTab('results');
    }
  }, [filters, executeQuery]);

  const handleSave = async () => {
    if (!queryName.trim() || filters.length === 0) return;

    await saveQuery({
      type: 'custom',
      config: { filters },
      name: queryName
    });

    setShowSaveDialog(false);
    setQueryName('');
  };

  const clearAll = () => {
    setFilters([]);
    setResult(null);
    clearResults();
  };

  const getSourceColor = (source: DataSource) => {
    switch (source) {
      case 'sator':
        return '#ffd700';
      case 'opera':
        return '#9d4edd';
      case 'both':
        return hubColor;
      default:
        return '#6a6a7a';
    }
  };

  const getSourceLabel = (source: DataSource) => {
    switch (source) {
      case 'sator':
        return 'SATOR';
      case 'opera':
        return 'OPERA';
      case 'both':
        return 'Both';
      default:
        return source;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(['builder', 'results', 'history'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${activeTab === tab 
                ? 'text-white' 
                : 'text-slate hover:text-white'
              }
            `}
            style={{ 
              backgroundColor: activeTab === tab ? `${hubColor}30` : 'transparent',
              border: `1px solid ${activeTab === tab ? hubColor : 'transparent'}`
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab === 'builder' && <Filter className="w-4 h-4" />}
            {tab === 'results' && <BarChart3 className="w-4 h-4" />}
            {tab === 'history' && <Clock className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'results' && result && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                1
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Filter Palette */}
          <GlassCard hoverGlow={hubGlow} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${hubColor}20` }}
              >
                <Layers className="w-5 h-5" style={{ color: hubColor }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Query Builder</h3>
                <p className="text-sm text-slate">
                  Build cross-hub queries by adding filters
                </p>
              </div>
            </div>

            {/* Available Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTER_TYPES.map((filterType) => (
                <motion.button
                  key={filterType.type}
                  onClick={() => addFilter(filterType.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                           bg-void-mid border border-mist
                           hover:border-[#0066ff]/50 hover:text-[#0066ff] transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  <filterType.icon className="w-4 h-4" />
                  {filterType.label}
                </motion.button>
              ))}
            </div>

            {/* Active Filters */}
            {filters.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-slate mb-2">Active Filters</div>
                {filters.map((filter, index) => (
                  <motion.div
                    key={filter.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-void-mid border border-mist"
                  >
                    <span className="text-xs text-slate w-6">{index + 1}</span>
                    
                    {/* Filter Type Badge */}
                    <span 
                      className="px-2 py-1 text-xs rounded"
                      style={{ 
                        backgroundColor: `${getSourceColor(filter.source)}20`,
                        color: getSourceColor(filter.source)
                      }}
                    >
                      {getSourceLabel(filter.source)}
                    </span>

                    {/* Filter Field */}
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                      className="bg-void-mid border border-mist rounded px-2 py-1 text-sm
                               focus:border-[#0066ff] focus:outline-none"
                    >
                      <option value={filter.field}>{filter.field}</option>
                    </select>

                    {/* Operator */}
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { operator: e.target.value as Filter['operator'] })}
                      className="bg-void-mid border border-mist rounded px-2 py-1 text-sm
                               focus:border-[#0066ff] focus:outline-none"
                    >
                      <option value="equals">=</option>
                      <option value="contains">contains</option>
                      <option value="gt">&gt;</option>
                      <option value="lt">&lt;</option>
                      <option value="in">in</option>
                    </select>

                    {/* Value Input */}
                    {filter.type === 'date_range' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={(filter.value as { start: string }).start}
                          onChange={(e) => updateFilter(filter.id, { 
                            value: { ...(filter.value as { start: string; end: string }), start: e.target.value }
                          })}
                          className="bg-void-mid border border-mist rounded px-2 py-1 text-sm
                                   focus:border-[#0066ff] focus:outline-none"
                        />
                        <span className="text-slate">to</span>
                        <input
                          type="date"
                          value={(filter.value as { end: string }).end}
                          onChange={(e) => updateFilter(filter.id, { 
                            value: { ...(filter.value as { start: string; end: string }), end: e.target.value }
                          })}
                          className="bg-void-mid border border-mist rounded px-2 py-1 text-sm
                                   focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={filter.value as string}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1 bg-void-mid border border-mist rounded px-2 py-1 text-sm
                                 focus:border-[#0066ff] focus:outline-none"
                      />
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 text-slate hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No filters added yet. Click a filter type above to get started.</p>
              </div>
            )}
          </GlassCard>

          {/* Action Buttons */}
          {filters.length > 0 && (
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleExecute}
                disabled={isLoading}
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Query
                  </>
                )}
              </motion.button>
              
              <motion.button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium border border-mist
                         text-slate hover:text-white hover:border-[#0066ff]/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-4 h-4" />
                Save Query
              </motion.button>
              
              <motion.button
                onClick={clearAll}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium border border-mist
                         text-slate hover:text-red-400 hover:border-red-400/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </motion.button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <GlassCard hoverGlow={hubGlow} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <h3 className="font-display text-xl font-bold">Query Results</h3>
            </div>

            {/* Data Sources Used */}
            <div className="flex items-center gap-2 text-sm text-slate mb-4">
              <Database className="w-4 h-4" />
              <span>Data sources queried:</span>
              {result.data_sources.map((source) => (
                <span 
                  key={source}
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: `${getSourceColor(source as DataSource)}20`,
                    color: getSourceColor(source as DataSource)
                  }}
                >
                  {source.toUpperCase()}
                </span>
              ))}
            </div>

            {/* Query Time */}
            <div className="text-sm text-slate mb-6">
              Query executed in {result.query_time_ms.toFixed(2)}ms
            </div>

            {/* Results Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.sator_data && (
                <ResultCard 
                  title="SATOR Data" 
                  color="#ffd700"
                  data={result.sator_data}
                />
              )}
              {result.opera_metadata && (
                <ResultCard 
                  title="OPERA Metadata" 
                  color="#9d4edd"
                  data={result.opera_metadata}
                />
              )}
              {result.rotas_analytics && (
                <ResultCard 
                  title="ROTAS Analytics" 
                  color="#00d4ff"
                  data={result.rotas_analytics}
                />
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {activeTab === 'results' && !result && (
        <GlassCard hoverGlow={hubGlow} className="p-8 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate opacity-30" />
          <h3 className="font-display text-xl font-semibold mb-2">No Results Yet</h3>
          <p className="text-slate mb-4">Execute a query to see results here</p>
          <motion.button
            onClick={() => setActiveTab('builder')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium mx-auto"
            style={{ backgroundColor: hubColor, color: '#ffffff' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronRight className="w-4 h-4" />
            Go to Builder
          </motion.button>
        </GlassCard>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <GlassCard hoverGlow={hubGlow} className="p-6">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: hubColor }} />
            Query History
          </h3>

          {queryHistory.length > 0 ? (
            <div className="space-y-2">
              {queryHistory.slice(0, 10).map((query, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-void-mid border border-mist
                           hover:border-[#0066ff]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate w-6">{index + 1}</span>
                    <span className="capitalize font-medium">{query.type}</span>
                    <span className="text-slate text-sm">{query.query_summary}</span>
                  </div>
                  <span className="text-xs text-slate">
                    {new Date(query.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No query history yet</p>
            </div>
          )}

          {savedQueries.length > 0 && (
            <>
              <h4 className="font-display font-semibold mt-6 mb-4 flex items-center gap-2">
                <Save className="w-5 h-5" style={{ color: hubColor }} />
                Saved Queries
              </h4>
              <div className="space-y-2">
                {savedQueries.map((query) => (
                  <div 
                    key={query.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-void-mid border border-mist
                             hover:border-[#0066ff]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{query.name}</span>
                      <span className="text-xs text-slate capitalize">{query.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => {}}
                        className="p-2 rounded-lg text-[#0066ff] hover:bg-[#0066ff]/10 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>
      )}

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard hoverGlow={hubGlow} className="p-6">
                <h3 className="font-display font-semibold text-xl mb-4">Save Query</h3>
                <input
                  type="text"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  placeholder="Enter query name"
                  className="w-full px-4 py-3 bg-void-mid rounded-lg border border-mist mb-4
                           focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                           text-white placeholder-slate transition-colors"
                  autoFocus
                />
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={handleSave}
                    disabled={!queryName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: hubColor, color: '#ffffff' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </motion.button>
                  <motion.button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-3 rounded-lg font-medium border border-mist
                             text-slate hover:text-white hover:border-[#0066ff]/50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Component

interface ResultCardProps {
  title: string;
  color: string;
  data: Record<string, unknown>;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, color, data }) => (
  <div className="p-4 rounded-lg border" style={{ borderColor: `${color}30`, backgroundColor: `${color}10` }}>
    <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color }}>
      <Database className="w-4 h-4" />
      {title}
    </h4>
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {Object.entries(data).slice(0, 10).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between text-sm">
          <span className="text-slate">{key}</span>
          <span className="font-mono truncate max-w-[150px]">
            {typeof value === 'object' ? JSON.stringify(value).slice(0, 20) + '...' : String(value)}
          </span>
        </div>
      ))}
      {Object.keys(data).length > 10 && (
        <div className="text-xs text-slate text-center pt-2">
          +{Object.keys(data).length - 10} more fields
        </div>
      )}
    </div>
  </div>
);

export default CrossHubQueryBuilder;
