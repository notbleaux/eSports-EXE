/**
 * AREPO Hub - Hub 3: The Directory
 * Q&A, documentation, and knowledge base with blue theme
 * 
 * Color Theme: Royal Blue (#0066ff)
 * Glow: rgba(0, 102, 255, 0.4)
 * Muted: #0044cc
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
  ExternalLink
} from 'lucide-react';
import HubWrapper, { HubCard, HubStatCard } from '../shared/components/HubWrapper';
import { useNJZStore, useHubState } from '../shared/store/njzStore';
import { colors } from '../theme/colors';

// Import local components
import DirectoryList from './components/DirectoryList';
import HelpHub from './components/HelpHub';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';

// HUB CONFIG - Exact colors as specified
const HUB_CONFIG = {
  name: 'AREPO',
  subtitle: 'The Directory',
  description: 'Q&A, documentation, and knowledge base',
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
  { id: 1, question: 'How do I interpret SimRating values?', answers: 3, status: 'answered' },
  { id: 2, question: 'What is the RAR metric?', answers: 5, status: 'answered' },
  { id: 3, question: 'API rate limits for free tier?', answers: 2, status: 'answered' },
  { id: 4, question: 'Custom data export formats', answers: 0, status: 'open' },
];

function ArepoHubContent() {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'help'
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  const addNotification = useNJZStore(state => state.addNotification);
  const { state, setState } = useHubState('arepo');

  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category);
    setState({ selectedCategory: category });
    addNotification(`Browsing ${category.name}`, 'info');
  }, [setState, addNotification]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addNotification(`Searching knowledge base for "${searchQuery}"...`, 'info');
    }
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestion(selectedQuestion?.id === question.id ? null : question);
  };

  return (
    <HubWrapper hubId="arepo">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard 
            label="Documentation" 
            value="247" 
            change="+12 this week" 
            color="cyan" 
          />
          <HubStatCard 
            label="Questions" 
            value="1,847" 
            change="94% answered" 
            color="amber" 
          />
          <HubStatCard 
            label="Contributors" 
            value="324" 
            change="+8 new" 
            color="gold" 
          />
          <HubStatCard 
            label="Categories" 
            value="12" 
            change="Organized" 
            color="green" 
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-4">
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
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

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'directory' ? (
              <motion.div
                key="directory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DirectoryList 
                  categories={CATEGORIES}
                  activeCategory={activeCategory}
                  onCategorySelect={handleCategorySelect}
                  hubColor={HUB_CONFIG.color}
                  hubGlow={HUB_CONFIG.glow}
                />
              </motion.div>
            ) : (
              <motion.div
                key="help"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <HelpHub 
                  questions={RECENT_QUESTIONS}
                  selectedQuestion={selectedQuestion}
                  onQuestionClick={handleQuestionClick}
                  hubColor={HUB_CONFIG.color}
                  hubGlow={HUB_CONFIG.glow}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
          </HubCard>

          {/* Community Stats */}
          <HubCard>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-[#0066ff]" />
              <h3 className="font-display font-semibold">Community</h3>
            </div>

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
          </HubCard>

          {/* Need Help */}
          <HubCard>
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-[#0066ff]" />
              <h3 className="font-display font-semibold">Need Help?</h3>
            </div>
            
            <p className="text-sm text-slate mb-4">
              Can't find what you're looking for? Our community and support team are here to help.
            </p>
            
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-[#0066ff]/10 text-[#0066ff] rounded-lg text-sm font-medium
                               hover:bg-[#0066ff]/20 transition-colors">
                Ask a Question
              </button>
              <button className="w-full px-4 py-2 border border-mist text-slate rounded-lg text-sm
                               hover:border-[#0066ff]/50 hover:text-white transition-colors">
                Contact Support
              </button>
            </div>
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  );
}

function ArepoHub() {
  return (
    <PanelErrorBoundary panelId="arepo-hub" panelTitle="AREPO Directory" hub="AREPO">
      <ArepoHubContent />
    </PanelErrorBoundary>
  );
}

export default ArepoHub;
