/** [Ver001.000]
 * Learning Dashboard Component
 * ============================
 * Visual dashboard for learning paths, progress, and recommendations.
 * 
 * Features:
 * - Visual learning path display
 * - Progress indicators
 * - Achievement display
 * - Recommended content
 * 
 * Integration:
 * - Uses adaptive UI components
 * - Integrates with learning path system
 * - Responds to cognitive load
 */

// @ts-nocheck
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  LearningPath,
  PathProgress,
  ContentRecommendation,
  Achievement,
  UserAchievement,
  LearningContent,
  SkillProficiency,
  PathNode,
  DifficultyLevel,
} from '../../lib/cognitive/learning/types';

// ============================================================================
// Types
// ============================================================================

interface LearningDashboardProps {
  /** Current learning path */
  currentPath?: LearningPath;
  /** Progress on current path */
  pathProgress?: PathProgress;
  /** Content recommendations */
  recommendations?: ContentRecommendation[];
  /** Available content for lookup */
  contentLibrary?: LearningContent[];
  /** User achievements */
  achievements?: UserAchievement[];
  /** Achievement definitions */
  achievementDefs?: Achievement[];
  /** Skill proficiencies */
  skills?: SkillProficiency[];
  /** Callback when node is clicked */
  onNodeClick?: (node: PathNode, index: number) => void;
  /** Callback when recommendation is clicked */
  onRecommendationClick?: (rec: ContentRecommendation) => void;
  /** Callback when achievement is clicked */
  onAchievementClick?: (achievement: Achievement) => void;
  /** Compact mode for limited space */
  compact?: boolean;
  /** Show achievements section */
  showAchievements?: boolean;
  /** Show skills section */
  showSkills?: boolean;
}

// ============================================================================
// Difficulty Badge Component
// ============================================================================

const DifficultyBadge: React.FC<{ level: DifficultyLevel }> = ({ level }) => {
  const colors: Record<DifficultyLevel, string> = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    expert: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

// ============================================================================
// Progress Ring Component
// ============================================================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  color = '#00d4ff',
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-sm font-semibold text-white">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Path Node Component
// ============================================================================

interface PathNodeProps {
  node: PathNode;
  index: number;
  content?: LearningContent;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  isCurrent: boolean;
  onClick: () => void;
  compact?: boolean;
}

const PathNodeComponent: React.FC<PathNodeProps> = ({
  node,
  index,
  content,
  status,
  isCurrent,
  onClick,
  compact = false,
}) => {
  const statusConfig = {
    locked: {
      bg: 'bg-gray-800',
      border: 'border-gray-700',
      icon: '🔒',
      opacity: 'opacity-50',
    },
    available: {
      bg: 'bg-[#0a0a0f]',
      border: 'border-[#00d4ff]/30',
      icon: '○',
      opacity: 'opacity-100',
    },
    in_progress: {
      bg: 'bg-[#00d4ff]/10',
      border: 'border-[#00d4ff]',
      icon: '▶',
      opacity: 'opacity-100',
    },
    completed: {
      bg: 'bg-green-500/10',
      border: 'border-green-500',
      icon: '✓',
      opacity: 'opacity-100',
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer
        transition-all duration-200 hover:scale-[1.02]
        ${config.bg} ${config.border} ${config.opacity}
        ${isCurrent ? 'ring-2 ring-[#00d4ff] ring-offset-2 ring-offset-[#0a0a0f]' : ''}
      `}
      onClick={onClick}
      role="button"
      tabIndex={status === 'locked' ? -1 : 0}
      aria-current={isCurrent ? 'step' : undefined}
      aria-label={`${content?.title || node.contentId} - ${status}`}
    >
      {/* Status Icon */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm
        border ${config.border}
        ${status === 'in_progress' ? 'animate-pulse' : ''}
      `}>
        {config.icon}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white truncate">
            {content?.title || `Step ${index + 1}`}
          </span>
          {content && <DifficultyBadge level={content.difficulty} />}
          {node.isRequired && (
            <span className="text-xs text-[#00d4ff]">Required</span>
          )}
        </div>
        {!compact && content && (
          <p className="text-xs text-white/60 mt-1 truncate">
            {content.type} • {content.estimatedTimeMinutes} min
          </p>
        )}
      </div>

      {/* Alternatives Indicator */}
      {node.alternativeNodes && node.alternativeNodes.length > 0 && (
        <div className="text-xs text-white/40">
          +{node.alternativeNodes.length} alt
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Path Visualization Component
// ============================================================================

interface PathVisualizationProps {
  path: LearningPath;
  progress: PathProgress;
  contentLibrary: LearningContent[];
  onNodeClick: (node: PathNode, index: number) => void;
  compact?: boolean;
}

const PathVisualization: React.FC<PathVisualizationProps> = ({
  path,
  progress,
  contentLibrary,
  onNodeClick,
  compact = false,
}) => {
  const getContent = useCallback((contentId: string) => {
    return contentLibrary.find(c => c.id === contentId);
  }, [contentLibrary]);

  const getNodeStatus = useCallback((node: PathNode, index: number): PathNodeProps['status'] => {
    if (progress.completedNodes.includes(node.id)) return 'completed';
    if (progress.currentNodeIndex === index) return 'in_progress';
    if (index <= progress.currentNodeIndex + 1) return 'available';
    return 'locked';
  }, [progress]);

  return (
    <div className="space-y-2">
      {/* Path Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{path.name}</h3>
          <p className="text-sm text-white/60">{path.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing progress={progress.progress} size={compact ? 50 : 60} />
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {progress.completedNodes.length}/{path.nodes.length}
            </div>
            <div className="text-xs text-white/60">completed</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Nodes */}
      <div className="space-y-2">
        {path.nodes.map((node, index) => (
          <PathNodeComponent
            key={node.id}
            node={node}
            index={index}
            content={getContent(node.contentId)}
            status={getNodeStatus(node, index)}
            isCurrent={progress.currentNodeIndex === index}
            onClick={() => onNodeClick(node, index)}
            compact={compact}
          />
        ))}
      </div>

      {/* Path Stats */}
      {!compact && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00d4ff]">
              {Math.round(path.totalEstimatedTime / 60)}h
            </div>
            <div className="text-xs text-white/60">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00d4ff]">
              {path.nodes.filter(n => n.isRequired).length}
            </div>
            <div className="text-xs text-white/60">Required</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00d4ff]">
              {path.nodes.filter(n => n.alternativeNodes).length}
            </div>
            <div className="text-xs text-white/60">Alternatives</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Recommendations Panel Component
// ============================================================================

interface RecommendationsPanelProps {
  recommendations: ContentRecommendation[];
  contentLibrary: LearningContent[];
  onRecommendationClick: (rec: ContentRecommendation) => void;
  compact?: boolean;
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  contentLibrary,
  onRecommendationClick,
  compact = false,
}) => {
  const getContent = useCallback((contentId: string) => {
    return contentLibrary.find(c => c.id === contentId);
  }, [contentLibrary]);

  const typeLabels: Record<string, string> = {
    next_content: 'Next Up',
    review: 'Review',
    challenge: 'Challenge',
    supplemental: 'Extra',
    alternative_path: 'Alternative',
    peer_learning: 'Peer',
  };

  const typeColors: Record<string, string> = {
    next_content: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    challenge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    supplemental: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    alternative_path: 'bg-green-500/20 text-green-400 border-green-500/30',
    peer_learning: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">Recommended for You</h3>
      
      {recommendations.length === 0 ? (
        <p className="text-sm text-white/60">No recommendations available</p>
      ) : (
        <div className="space-y-2">
          {recommendations.slice(0, compact ? 3 : 5).map((rec, index) => {
            const content = getContent(rec.contentId);
            if (!content) return null;

            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg border border-white/10 bg-[#0a0a0f] hover:border-[#00d4ff]/30 transition-colors cursor-pointer"
                onClick={() => onRecommendationClick(rec)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start gap-3">
                  <span className={`
                    px-2 py-0.5 text-xs font-medium rounded border
                    ${typeColors[rec.type] || typeColors.supplemental}
                  `}>
                    {typeLabels[rec.type] || rec.type}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {content.title}
                    </h4>
                    <p className="text-xs text-white/60 mt-1">{rec.reason}</p>
                    
                    {!compact && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                        <span>{content.type}</span>
                        <span>{content.estimatedTimeMinutes} min</span>
                        <span>{Math.round(rec.confidence * 100)}% match</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Achievements Panel Component
// ============================================================================

interface AchievementsPanelProps {
  achievements: UserAchievement[];
  achievementDefs: Achievement[];
  onAchievementClick: (achievement: Achievement) => void;
  compact?: boolean;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  achievements,
  achievementDefs,
  onAchievementClick,
  compact = false,
}) => {
  const getAchievement = useCallback((id: string) => {
    return achievementDefs.find(a => a.id === id);
  }, [achievementDefs]);

  const rarityColors: Record<string, string> = {
    common: 'border-gray-500/50',
    uncommon: 'border-green-500/50',
    rare: 'border-blue-500/50',
    epic: 'border-purple-500/50',
    legendary: 'border-yellow-500/50',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
      
      {achievements.length === 0 ? (
        <p className="text-sm text-white/60">No achievements yet</p>
      ) : (
        <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-6'}`}>
          {achievements.slice(0, compact ? 8 : 12).map((userAch) => {
            const def = getAchievement(userAch.achievementId);
            if (!def) return null;

            return (
              <motion.div
                key={userAch.achievementId}
                whileHover={{ scale: 1.05 }}
                className={`
                  aspect-square rounded-lg border-2 p-2 cursor-pointer
                  flex flex-col items-center justify-center text-center
                  ${userAch.completed ? rarityColors[def.rarity] : 'border-gray-700 opacity-50'}
                  ${userAch.completed ? 'bg-[#0a0a0f]' : 'bg-gray-900'}
                `}
                onClick={() => onAchievementClick(def)}
                title={def.name}
              >
                <span className="text-2xl">{def.icon}</span>
                {!compact && (
                  <span className="text-xs text-white/80 mt-1 truncate w-full">
                    {def.name}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Skills Panel Component
// ============================================================================

interface SkillsPanelProps {
  skills: SkillProficiency[];
  compact?: boolean;
}

const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills, compact = false }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">Your Skills</h3>
      
      {skills.length === 0 ? (
        <p className="text-sm text-white/60">No skills assessed yet</p>
      ) : (
        <div className="space-y-2">
          {skills.slice(0, compact ? 3 : 6).map((skill) => (
            <div key={skill.skillId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{skill.skillId}</span>
                <span className="text-[#00d4ff]">{skill.level}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  currentPath,
  pathProgress,
  recommendations = [],
  contentLibrary = [],
  achievements = [],
  achievementDefs = [],
  skills = [],
  onNodeClick,
  onRecommendationClick,
  onAchievementClick,
  compact = false,
  showAchievements = true,
  showSkills = true,
}) => {
  const [activeTab, setActiveTab] = useState<'path' | 'recommendations' | 'achievements'>('path');

  // Compact view
  if (compact) {
    return (
      <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-4 space-y-4">
        {currentPath && pathProgress && (
          <div className="flex items-center gap-4">
            <ProgressRing progress={pathProgress.progress} size={50} />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate">{currentPath.name}</h3>
              <p className="text-xs text-white/60">
                {pathProgress.completedNodes.length}/{currentPath.nodes.length} completed
              </p>
            </div>
          </div>
        )}
        
        {recommendations.length > 0 && (
          <RecommendationsPanel
            recommendations={recommendations.slice(0, 3)}
            contentLibrary={contentLibrary}
            onRecommendationClick={onRecommendationClick || (() => {})}
            compact
          />
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {currentPath && (
          <button
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'path'
                ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('path')}
          >
            Learning Path
          </button>
        )}
        <button
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]'
              : 'text-white/60 hover:text-white'
          }`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
          {recommendations.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-[#00d4ff]/20 text-[#00d4ff] rounded-full">
              {recommendations.length}
            </span>
          )}
        </button>
        {showAchievements && (
          <button
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'achievements'
                ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'path' && currentPath && pathProgress && (
            <motion.div
              key="path"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PathVisualization
                path={currentPath}
                progress={pathProgress}
                contentLibrary={contentLibrary}
                onNodeClick={onNodeClick || (() => {})}
              />
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RecommendationsPanel
                recommendations={recommendations}
                contentLibrary={contentLibrary}
                onRecommendationClick={onRecommendationClick || (() => {})}
              />
            </motion.div>
          )}

          {activeTab === 'achievements' && showAchievements && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <AchievementsPanel
                achievements={achievements}
                achievementDefs={achievementDefs}
                onAchievementClick={onAchievementClick || (() => {})}
              />
              {showSkills && (
                <SkillsPanel skills={skills} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default LearningDashboard;
