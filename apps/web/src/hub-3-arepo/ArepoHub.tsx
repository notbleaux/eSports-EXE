/**
 * AREPO Hub - Hub 3: The Cross-Reference Engine
 * Connects SATOR (Component B) and OPERA (Component D) through cross-hub queries
 * 
 * Color Theme: Royal Blue (#0066ff)
 * Glow: rgba(0, 102, 255, 0.4)
 * Muted: #0044cc
 * 
 * [Ver004.000] - Converted to TypeScript with proper default export
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  MessageSquare,
  ChevronRight,
  Globe,
  Users,
  Lightbulb,
  FolderTree,
  ExternalLink,
  GitCompare,
  User,
  Trophy,
  GitCommit,
  Database,
  Layers,
  Clock,
  History,
  Map
} from 'lucide-react';
import HubWrapper, { HubCard, HubStatCard } from '@/shared/components/HubWrapper';
import { useNJZStore, useHubState } from '@/shared/store/njzStore';
import { colors } from '@/theme/colors';

// Import local components
import DirectoryList from './components/DirectoryList';
import HelpHub from './components/HelpHub';

// Import Cross-Reference components
import PlayerTournamentSearch from './components/PlayerTournamentSearch';
import PatchImpactAnalyzer from './components/PatchImpactAnalyzer';
import TeamComparisonTool from './components/TeamComparisonTool';
import CrossHubQueryBuilder from './components/CrossHubQueryBuilder';

// Import Tactical Map
import { TacticalMapContainer } from './components/TacticalMap';

// Import error boundaries
import { 
  PanelErrorBoundary,
  DataErrorBoundary,
  HubErrorBoundary,
  HubErrorFallback
} from '@/components/error';

// Import cross-reference hook
import { useCrossReferenceEngine } from './hooks/useArepoData';

// Import follow system
import { FollowedFeed } from './components/FollowedFeed';

// Import shared API hooks for live community data
import { useMatches, usePlayers, useTeams } from '@/shared/api/hooks';

// HUB CONFIG - Exact colors as specified
const HUB_CONFIG = {
  name: 'AREPO',
  subtitle: 'The Cross-Reference Engine',
  description: 'Connect SATOR analytics with OPERA metadata through cross-hub queries',
  color: colors.hub.arepo.base,      // #0066ff
  glow: colors.hub.arepo.glow,       // rgba(0, 102, 255, 0.4)
  muted: colors.hub.arepo.muted,     // #0044cc
};

// Categories for directory navigation
const CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', icon: BookOpen, items: 12, color: '#0066ff' },
  { id: 'api-docs', name: 'API Documentation', icon: FileText, items: 24, color: '#0066ff' },
  { id: 'tutorials', name: 'Tutorials', icon: Lightbulb, items: 18, color: '#0066ff' },
  { id: 'faq', name: 'FAQ', icon: HelpCircle, items: 36, color: '#0066ff' },
  { id: 'community', name: 'Community', icon: Users, items: 156, color: '#0066ff' },
];

// Quick links data
const QUICK_LINKS = [
  { id: 1, title: 'Platform Overview', category: 'getting-started', views: '2.4K' },
  { id: 2, title: 'Authentication Guide', category: 'api-docs', views: '1.8K' },
  { id: 3, title: 'SimRating Explained', category: 'tutorials', views: '3.2K' },
  { id: 4, title: 'Data Pipeline Setup', category: 'tutorials', views: '1.5K' },
  { id: 5, title: 'Common Errors', category: 'faq', views: '4.1K' },
];

// Recent questions data
const RECENT_QUESTIONS = [
  { id: 1, question: 'How do I interpret SimRating values?', answers: 3, status: 'answered' as const },
  { id: 2, question: 'What is the RAR metric?', answers: 5, status: 'answered' as const },
  { id: 3, question: 'API rate limits for free tier?', answers: 2, status: 'answered' as const },
  { id: 4, question: 'Custom data export formats', answers: 0, status: 'open' as const },
];

// Cross-reference tools configuration
interface CrossReferenceTool {
  id: string;
  name: string;
  description: string;
  icon: typeof User;
  component: typeof PlayerTournamentSearch;
  dataSources: string[];
}

const CROSS_REFERENCE_TOOLS: CrossReferenceTool[] = [
  {
    id: 'player-tournament',
    name: 'Player + Tournament',
    description: 'Cross-reference player performance with tournament context',
    icon: User,
    component: PlayerTournamentSearch,
    dataSources: ['SATOR', 'OPERA']
  },
  {
    id: 'patch-impact',
    name: 'Patch Impact Analyzer',
    description: 'Analyze how patch changes affected agent performance',
    icon: GitCommit,
    component: PatchImpactAnalyzer,
    dataSources: ['OPERA', 'SATOR']
  },
  {
    id: 'team-comparison',
    name: 'Team Comparison',
    description: 'Compare teams across tournaments with head-to-head stats',
    icon: GitCompare,
    component: TeamComparisonTool,
    dataSources: ['SATOR', 'OPERA']
  },
  {
    id: 'query-builder',
    name: 'Query Builder',
    description: 'Build custom cross-hub queries with visual filters',
    icon: Layers,
    component: CrossHubQueryBuilder,
    dataSources: ['SATOR', 'OPERA', 'ROTAS']
  },
];

interface HubProps {
  // Add any props needed
}

/**
 * ArepoHubContent - Main content component for AREPO hub
 */
function ArepoHubContent(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('cross-reference'); // 'cross-reference' | 'directory' | 'help' | 'tactical-maps'
  const [activeCategory, setActiveCategory] = useState<{ id: string; name: string; icon: typeof BookOpen; items: number; color: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<{ id: number; question: string; answers: number; status: 'answered' | 'open' } | null>(null);
  const [selectedTool, setSelectedTool] = useState('query-builder');
  
  const addNotification = useNJZStore(state => state.addNotification);
  const { state, setState } = useHubState('arepo');
  const { queryHistory } = useCrossReferenceEngine();

  // Live community data
  const { data: matchData } = useMatches(undefined, 'finished');
  const { data: playerData } = usePlayers();
  const { data: teamData } = useTeams();
  const recentMatches = matchData?.matches?.slice(0, 5) ?? [];

  const handleCategorySelect = useCallback((category: { id: string; name: string; icon: typeof BookOpen; items: number; color: string }) => {
    setActiveCategory(category);
    setState({ selectedCategory: category });
    addNotification(`Browsing ${category.name}`, 'info');
  }, [setState, addNotification]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addNotification(`Searching knowledge base for "${searchQuery}"...`, 'info');
    }
  };

  const handleQuestionClick = (question: { id: number; question: string; answers: number; status: 'answered' | 'open' }) => {
    setSelectedQuestion(selectedQuestion?.id === question.id ? null : question);
  };

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    const tool = CROSS_REFERENCE_TOOLS.find(t => t.id === toolId);
    if (tool) {
      addNotification(`Switched to ${tool.name}`, 'info');
    }
  };

  // Render the selected cross-reference tool
  const renderCrossReferenceTool = () => {
    const tool = CROSS_REFERENCE_TOOLS.find(t => t.id === selectedTool);
    if (!tool) return null;
    
    const ToolComponent = tool.component;
    return (
      <DataErrorBoundary
        hubName="arepo"
        componentName={tool.name}
        compact
        onRetry={() => addNotification(`Retrying ${tool.name}...`, 'info')}
      >
        <ToolComponent 
          hubColor={HUB_CONFIG.color}
          hubGlow={HUB_CONFIG.glow}
        />
      </DataErrorBoundary>
    );
  };

  return (
    <HubWrapper hubId="arepo">
      {/* Followed Players Feed */}
      <div className="max-w-6xl mx-auto mb-6">
        <FollowedFeed />
      </div>

      {/* Community Stats Bar */}
      <div className="community-stats-bar flex gap-6 p-3 bg-gray-900 rounded-lg mb-4 text-sm text-gray-400">
        <span>Players tracked: <strong className="text-white">{playerData?.total ?? '—'}</strong></span>
        <span>Teams tracked: <strong className="text-white">{teamData?.total ?? '—'}</strong></span>
        <span>Recent matches: <strong className="text-white">{matchData?.total ?? '—'}</strong></span>
      </div>

      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard 
            label="Cross-Reference Queries" 
            value={queryHistory.length.toString()} 
            change="Today" 
            color="cyan" 
          />
          <HubStatCard 
            label="Data Sources" 
            value="3" 
            change="SATOR + OPERA + ROTAS" 
            color="amber" 
          />
          <HubStatCard 
            label="Documentation" 
            value="247" 
            change="+12 this week" 
            color="gold" 
          />
          <HubStatCard 
            label="Questions" 
            value="1,847" 
            change="94% answered" 
            color="green" 
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <motion.button
            onClick={() => setActiveTab('cross-reference')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
              ${activeTab === 'cross-reference' 
                ? 'bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/50' 
                : 'text-slate hover:text-white hover:bg-white/5 border border-transparent'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <GitCompare className="w-5 h-5" />
            Cross-Reference
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('directory')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
              ${activeTab === 'directory' 
                ? 'bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/50' 
                : 'text-slate hover:text-white hover:bg-white/5 border border-transparent'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FolderTree className="w-5 h-5" />
            Directory
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('help')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
              ${activeTab === 'help' 
                ? 'bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/50' 
                : 'text-slate hover:text-white hover:bg-white/5 border border-transparent'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <HelpCircle className="w-5 h-5" />
            Q&A / Help
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('tactical-maps')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
              ${activeTab === 'tactical-maps' 
                ? 'bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/50' 
                : 'text-slate hover:text-white hover:bg-white/5 border border-transparent'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Map className="w-5 h-5" />
            Tactical Maps
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'cross-reference' && (
            <motion.div
              key="cross-reference"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Left Sidebar - Tool Selection */}
              <div className="lg:col-span-1 space-y-4">
                <HubCard accent="cyan">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-[#0066ff]" />
                    <h3 className="font-display font-semibold">Cross-Reference Tools</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {CROSS_REFERENCE_TOOLS.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = selectedTool === tool.id;
                      
                      return (
                        <motion.button
                          key={tool.id}
                          onClick={() => handleToolSelect(tool.id)}
                          className={`
                            w-full p-3 rounded-lg text-left transition-all duration-200
                            ${isActive 
                              ? 'bg-[#0066ff]/20 border border-[#0066ff]' 
                              : 'bg-void-mid border border-mist hover:border-[#0066ff]/50'
                            }
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ 
                                backgroundColor: isActive ? `${HUB_CONFIG.color}30` : 'rgba(255,255,255,0.05)'
                              }}
                            >
                              <Icon 
                                className="w-5 h-5" 
                                style={{ color: isActive ? HUB_CONFIG.color : '#a0a0b0' }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div 
                                className="font-medium text-sm truncate"
                                style={{ color: isActive ? HUB_CONFIG.color : '#ffffff' }}
                              >
                                {tool.name}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {tool.dataSources.map((source) => (
                                  <span 
                                    key={source}
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{ 
                                      backgroundColor: source === 'SATOR' ? 'rgba(255, 215, 0, 0.2)' :
                                                       source === 'OPERA' ? 'rgba(157, 78, 221, 0.2)' :
                                                       'rgba(0, 212, 255, 0.2)',
                                      color: source === 'SATOR' ? '#ffd700' :
                                             source === 'OPERA' ? '#9d4edd' :
                                             '#00d4ff'
                                    }}
                                  >
                                    {source}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </HubCard>

                {/* Quick Stats */}
                <HubCard>
                  <div className="flex items-center gap-3 mb-4">
                    <History className="w-5 h-5 text-[#0066ff]" />
                    <h3 className="font-display font-semibold">Recent Queries</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {queryHistory.slice(0, 5).map((query: { type: string; timestamp: string }, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 text-sm p-2 rounded-lg bg-void-mid"
                      >
                        <Clock className="w-3 h-3 text-slate" />
                        <span className="capitalize text-slate">{query.type}</span>
                        <span className="text-xs text-slate/50 ml-auto">
                          {new Date(query.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {queryHistory.length === 0 && (
                      <p className="text-sm text-slate text-center py-4">
                        No queries yet. Start exploring!
                      </p>
                    )}
                  </div>
                </HubCard>

                {/* Data Sources Info */}
                <HubCard>
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-[#0066ff]" />
                    <h3 className="font-display font-semibold">Data Sources</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30">
                      <div className="flex items-center gap-2 text-[#ffd700] font-medium mb-1">
                        <Database className="w-4 h-4" />
                        SATOR
                      </div>
                      <p className="text-xs text-slate">
                        Player performance data, match statistics, SimRating, RAR metrics
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-[#9d4edd]/10 border border-[#9d4edd]/30">
                      <div className="flex items-center gap-2 text-[#9d4edd] font-medium mb-1">
                        <Database className="w-4 h-4" />
                        OPERA
                      </div>
                      <p className="text-xs text-slate">
                        Tournament metadata, schedules, patch notes, circuit information
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30">
                      <div className="flex items-center gap-2 text-[#00d4ff] font-medium mb-1">
                        <Database className="w-4 h-4" />
                        ROTAS
                      </div>
                      <p className="text-xs text-slate">
                        Analytics from materialized views, leaderboards, rankings
                      </p>
                    </div>
                  </div>
                </HubCard>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3">
                <PanelErrorBoundary 
                  panelId="arepo-cross-reference" 
                  panelTitle="Cross-Reference Engine" 
                  hub="arepo"
                >
                  {renderCrossReferenceTool()}
                </PanelErrorBoundary>
              </div>
            </motion.div>
          )}

          {activeTab === 'directory' && (
            <motion.div
              key="directory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Search Section */}
                <HubCard accent="cyan">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                    <input
                      type="text"
                      placeholder="Search documentation, FAQs, tutorials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-void-mid rounded-lg border border-mist 
                               focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                               text-white placeholder-slate transition-colors"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 
                               bg-[#0066ff]/10 text-[#0066ff] rounded-lg
                               hover:bg-[#0066ff]/20 transition-colors text-sm font-medium"
                    >
                      Search
                    </button>
                  </form>
                </HubCard>

                {/* Directory List */}
                <DataErrorBoundary
                  hubName="arepo"
                  componentName="DirectoryList"
                  compact
                  onRetry={() => addNotification('Retrying directory load...', 'info')}
                >
                  <PanelErrorBoundary 
                    panelId="arepo-directory" 
                    panelTitle="Directory" 
                    hub="arepo"
                  >
                    <DirectoryList 
                      categories={CATEGORIES}
                      activeCategory={activeCategory}
                      onCategorySelect={handleCategorySelect}
                      hubColor={HUB_CONFIG.color}
                      hubGlow={HUB_CONFIG.glow}
                    />
                  </PanelErrorBoundary>
                </DataErrorBoundary>

                {/* Quick Links */}
                <HubCard accent="cyan">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-[#0066ff]" />
                      <h3 className="font-display font-semibold">Popular Resources</h3>
                    </div>
                    <button className="text-sm text-slate hover:text-[#0066ff] transition-colors flex items-center gap-1">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <DataErrorBoundary
                    hubName="arepo"
                    componentName="QuickLinks"
                    compact
                  >
                    <div className="space-y-3">
                      {QUICK_LINKS.map((link, index) => (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-void-mid border border-mist 
                                   hover:border-[#0066ff]/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#0066ff]/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[#0066ff]" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-[#0066ff] transition-colors">
                                {link.title}
                              </div>
                              <div className="text-xs text-slate capitalize">{link.category.replace('-', ' ')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate">{link.views} views</span>
                            <ChevronRight className="w-4 h-4 text-slate group-hover:text-[#0066ff] transition-colors" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </DataErrorBoundary>
                </HubCard>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Getting Started */}
                <HubCard accent="cyan">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-5 h-5 text-[#0066ff]" />
                    <h3 className="font-display font-semibold">Getting Started</h3>
                  </div>

                  <DataErrorBoundary
                    hubName="arepo"
                    componentName="GettingStarted"
                    compact
                  >
                    <div className="space-y-2">
                      {[
                        'Platform Overview',
                        'Quick Start Guide',
                        'Authentication',
                        'API Basics',
                        'Best Practices'
                      ].map((item, index) => (
                        <motion.a
                          key={item}
                          href="#"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate 
                                   hover:text-white hover:bg-white/5 transition-colors group"
                        >
                          {item}
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.a>
                      ))}
                    </div>
                  </DataErrorBoundary>
                </HubCard>

                {/* Community Stats */}
                <HubCard>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-[#0066ff]" />
                    <h3 className="font-display font-semibold">Community</h3>
                  </div>

                  <DataErrorBoundary
                    hubName="arepo"
                    componentName="CommunityStats"
                    compact
                  >
                    <div className="space-y-4">
                      {[
                        { label: 'Active Users', value: '1,247', icon: Users },
                        { label: 'Daily Questions', value: '24', icon: MessageSquare },
                        { label: 'Knowledge Base', value: '156', icon: BookOpen },
                      ].map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate">
                            <stat.icon className="w-4 h-4" />
                            <span className="text-sm">{stat.label}</span>
                          </div>
                          <span className="font-mono text-[#0066ff]">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </DataErrorBoundary>
                </HubCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'help' && (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <DataErrorBoundary
                hubName="arepo"
                componentName="HelpHub"
                compact
                onRetry={() => addNotification('Retrying help content load...', 'info')}
              >
                <PanelErrorBoundary 
                  panelId="arepo-help" 
                  panelTitle="Help & Q&A" 
                  hub="arepo"
                >
                  <HelpHub 
                    questions={RECENT_QUESTIONS}
                    selectedQuestion={selectedQuestion}
                    onQuestionClick={handleQuestionClick}
                    hubColor={HUB_CONFIG.color}
                    hubGlow={HUB_CONFIG.glow}
                  />
                </PanelErrorBoundary>
              </DataErrorBoundary>
            </motion.div>
          )}

          {activeTab === 'tactical-maps' && (
            <motion.div
              key="tactical-maps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PanelErrorBoundary 
                panelId="arepo-tactical-maps" 
                panelTitle="Tactical Maps" 
                hub="arepo"
              >
                <TacticalMapContainer />
              </PanelErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Matches */}
      <div className="recent-matches mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-purple-400 mb-2">Recent Matches</h3>
        {recentMatches.length === 0
          ? <p className="text-gray-500 text-xs">No finished matches yet — run sync_pandascore.py to seed.</p>
          : recentMatches.map((m: { id: string; name: string; status: string }) => (
              <div key={m.id} className="flex justify-between text-xs text-gray-300 mb-1">
                <span>{m.name ?? m.id}</span>
                <span className="text-green-400">{m.status}</span>
              </div>
            ))
        }
      </div>
    </HubWrapper>
  );
}

/**
 * ArepoHub - Root component with error boundary hierarchy
 */
function ArepoHub(): React.ReactElement {
  return (
    <HubErrorBoundary hubName="arepo" componentName="ArepoHub">
      <DataErrorBoundary
        hubName="arepo"
        componentName="ArepoHub"
        fallback={
          <div className="min-h-screen flex items-center justify-center p-4">
            <HubErrorFallback
              hub="arepo"
              title="AREPO Cross-Reference Engine Error"
              message="Failed to load the cross-reference engine. Please try again."
              onRetry={() => window.location.reload()}
              onGoHome={() => window.location.href = '/'}
            />
          </div>
        }
      >
        <ArepoHubContent />
      </DataErrorBoundary>
    </HubErrorBoundary>
  );
}

export default ArepoHub;
