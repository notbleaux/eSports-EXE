/** [Ver001.000] */
/**
 * Knowledge Graph Data
 * ====================
 * Sample data for the help documentation knowledge graph.
 * 
 * Contains 50+ knowledge nodes covering all platform features,
 * with relationships and learning paths.
 */

import type { KnowledgeNode, KnowledgeEdge } from './knowledge-types';
import { createKnowledgeGraph, addNode, addEdge } from './knowledge-graph';

// ============================================================================
// Helper Functions
// ============================================================================

function createNode(node: Omit<KnowledgeNode, 'metadata'> & { metadata?: Partial<KnowledgeNode['metadata']> }): KnowledgeNode {
  return {
    ...node,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readingTime: 5,
      ...node.metadata,
    },
  };
}

function createEdge(
  id: string,
  source: string,
  target: string,
  type: KnowledgeEdge['type'],
  options: Partial<Omit<KnowledgeEdge, 'id' | 'source' | 'target' | 'type'>> = {}
): KnowledgeEdge {
  return {
    id,
    source,
    target,
    type,
    strength: 0.8,
    bidirectional: false,
    createdAt: new Date().toISOString(),
    ...options,
  };
}

// ============================================================================
// Platform Overview Nodes
// ============================================================================

const platformNodes: KnowledgeNode[] = [
  createNode({
    id: 'platform-overview',
    title: 'Platform Overview',
    description: 'Introduction to the NJZiteGeisTe Platform',
    type: 'concept',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['platform', 'overview', 'introduction', 'getting started', 'welcome'],
    content: 'The NJZiteGeisTe Platform is a comprehensive esports simulation and analytics platform featuring five interconnected hubs: SATOR Analytics, ROTAS Simulation, AREPO Marketplace, OPERA Operations, and TENET Central Hub.',
  }),
  createNode({
    id: 'getting-started',
    title: 'Getting Started Guide',
    description: 'First steps for new users',
    type: 'guide',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['getting started', 'tutorial', 'beginner', 'first steps', 'introduction'],
    content: 'Welcome to the NJZiteGeisTe Platform. This guide will walk you through account setup, dashboard navigation, and your first analytics exploration.',
  }),
  createNode({
    id: 'account-setup',
    title: 'Account Setup',
    description: 'Creating and configuring your account',
    type: 'tutorial',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['account', 'setup', 'registration', 'profile', 'settings'],
    content: 'Learn how to create your account, verify your email, set up two-factor authentication, and configure your profile preferences.',
  }),
  createNode({
    id: 'navigation-basics',
    title: 'Navigation Basics',
    description: 'Understanding the platform interface',
    type: 'tutorial',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['navigation', 'interface', 'ui', 'menu', 'sidebar'],
    content: 'Master the orbital navigation system, hub switching, and quick access shortcuts to efficiently move through the platform.',
  }),
];

// ============================================================================
// SATOR Hub Nodes (Analytics)
// ============================================================================

const satorNodes: KnowledgeNode[] = [
  createNode({
    id: 'sator-hub',
    title: 'SATOR Analytics Hub',
    description: 'Advanced player analytics and ratings',
    type: 'hub',
    status: 'published',
    difficulty: 'beginner',
    hub: 'sator',
    keywords: ['sator', 'analytics', 'hub', 'statistics', 'metrics'],
    content: 'SATOR Analytics provides comprehensive player metrics including SimRating, RAR decomposition, and investment grading for esports professionals.',
  }),
  createNode({
    id: 'simrating',
    title: 'SimRating System',
    description: 'Understanding player performance ratings',
    type: 'concept',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'sator',
    keywords: ['simrating', 'rating', 'performance', 'score', 'metric'],
    content: 'SimRating is a comprehensive player performance metric that combines multiple data points into a single normalized score from 0 to 100.',
  }),
  createNode({
    id: 'rar-analysis',
    title: 'RAR Analysis',
    description: 'Risk-Adjusted Return decomposition',
    type: 'feature',
    status: 'published',
    difficulty: 'advanced',
    hub: 'sator',
    keywords: ['rar', 'risk', 'return', 'analysis', 'investment'],
    content: 'RAR (Risk-Adjusted Return) provides detailed decomposition of player performance volatility, consistency metrics, and investment-grade ratings.',
  }),
  createNode({
    id: 'rar-card',
    title: 'RAR Card Component',
    description: 'Visual RAR data display',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'sator',
    keywords: ['rar', 'card', 'component', 'visualization', 'widget'],
    content: 'The RAR Card component displays Risk-Adjusted Return metrics in an intuitive visual format with gauges, trends, and volatility indicators.',
  }),
  createNode({
    id: 'volatility-indicator',
    title: 'Volatility Indicator',
    description: 'Understanding performance consistency',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'sator',
    keywords: ['volatility', 'consistency', 'stability', 'variance', 'indicator'],
    content: 'The Volatility Indicator visualizes player performance consistency over time, helping identify streaky vs. consistent performers.',
  }),
  createNode({
    id: 'investment-grading',
    title: 'Investment Grading',
    description: 'Player valuation and grading system',
    type: 'concept',
    status: 'published',
    difficulty: 'advanced',
    hub: 'sator',
    keywords: ['investment', 'grading', 'valuation', 'grade', 'rating'],
    content: 'Investment Grading classifies players into tiers (S, A, B, C, D) based on their risk-adjusted performance metrics and market potential.',
  }),
  createNode({
    id: 'temporal-analysis',
    title: 'Temporal Analysis',
    description: 'Time-based performance tracking',
    type: 'feature',
    status: 'published',
    difficulty: 'advanced',
    hub: 'sator',
    keywords: ['temporal', 'time', 'trend', 'history', 'tracking'],
    content: 'Temporal Analysis tracks performance metrics over time, identifying improvement trends, slumps, and seasonal variations.',
  }),
  createNode({
    id: 'confidence-weighting',
    title: 'Confidence Weighting',
    description: 'Data reliability indicators',
    type: 'concept',
    status: 'published',
    difficulty: 'advanced',
    hub: 'sator',
    keywords: ['confidence', 'weight', 'reliability', 'accuracy', 'certainty'],
    content: 'Confidence Weighting indicates the reliability of metrics based on sample size, data quality, and match representation.',
  }),
  createNode({
    id: 'player-comparison',
    title: 'Player Comparison Tool',
    description: 'Side-by-side player analysis',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'sator',
    keywords: ['comparison', 'players', 'side-by-side', 'analyze', 'contrast'],
    content: 'Compare multiple players across various metrics with customizable charts, radar graphs, and statistical overlays.',
  }),
  createNode({
    id: 'match-analytics',
    title: 'Match Analytics',
    description: 'Detailed match breakdowns',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'sator',
    keywords: ['match', 'analytics', 'breakdown', 'game', 'statistics'],
    content: 'Deep dive into individual matches with round-by-round analysis, economy tracking, and clutch performance metrics.',
  }),
];

// ============================================================================
// ROTAS Hub Nodes (Simulation)
// ============================================================================

const rotasNodes: KnowledgeNode[] = [
  createNode({
    id: 'rotas-hub',
    title: 'ROTAS Simulation Hub',
    description: 'Tactical FPS match simulation',
    type: 'hub',
    status: 'published',
    difficulty: 'beginner',
    hub: 'rotas',
    keywords: ['rotas', 'simulation', 'game', 'tactical', 'fps'],
    content: 'ROTAS Simulation provides deterministic tactical FPS match simulation using Godot 4, enabling scenario testing and strategy validation.',
  }),
  createNode({
    id: 'deterministic-simulation',
    title: 'Deterministic Simulation',
    description: 'How simulation consistency works',
    type: 'concept',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'rotas',
    keywords: ['deterministic', 'simulation', 'consistent', 'replay', 'seed'],
    content: 'Deterministic simulation ensures identical inputs produce identical outputs, enabling reproducible scenario testing and replay analysis.',
  }),
  createNode({
    id: 'tactical-view',
    title: 'Tactical View',
    description: '2D tactical map visualization',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'rotas',
    keywords: ['tactical', 'view', 'map', '2d', 'visualization'],
    content: 'The Tactical View provides a top-down 2D visualization of matches with agent positions, utility usage, and movement tracking.',
  }),
  createNode({
    id: 'replay-system',
    title: 'Replay System',
    description: 'Match replay and analysis',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'rotas',
    keywords: ['replay', 'review', 'playback', 'recording', 'demo'],
    content: 'Record, save, and analyze match replays with timeline scrubbing, bookmark creation, and multi-angle viewing.',
  }),
  createNode({
    id: 'scenario-editor',
    title: 'Scenario Editor',
    description: 'Create custom simulation scenarios',
    type: 'feature',
    status: 'published',
    difficulty: 'advanced',
    hub: 'rotas',
    keywords: ['scenario', 'editor', 'custom', 'create', 'setup'],
    content: 'Design custom scenarios with specific agent positions, utility placement, and win conditions for targeted training.',
  }),
  createNode({
    id: 'combat-resolution',
    title: 'Combat Resolution',
    description: 'How duels are simulated',
    type: 'concept',
    status: 'published',
    difficulty: 'advanced',
    hub: 'rotas',
    keywords: ['combat', 'duel', 'resolution', 'damage', 'hit'],
    content: 'Combat Resolution mechanics determine duel outcomes based on accuracy, movement, equipment, and positioning factors.',
  }),
  createNode({
    id: 'economy-simulation',
    title: 'Economy Simulation',
    description: 'In-game economy modeling',
    type: 'concept',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'rotas',
    keywords: ['economy', 'credits', 'money', 'buy', 'equipment'],
    content: 'Economy Simulation models Valorant and CS2 economic systems including buy phases, saving, and force-buy scenarios.',
  }),
  createNode({
    id: 'valorant-sim',
    title: 'Valorant Simulation',
    description: 'Valorant-specific mechanics',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'rotas',
    keywords: ['valorant', 'agents', 'abilities', 'simulation', 'riot'],
    content: 'Valorant Simulation includes agent abilities, utility interactions, and map-specific mechanics for accurate representation.',
  }),
  createNode({
    id: 'cs2-sim',
    title: 'Counter-Strike 2 Simulation',
    description: 'CS2-specific mechanics',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'rotas',
    keywords: ['cs2', 'counter-strike', 'csgo', 'simulation', 'valve'],
    content: 'CS2 Simulation recreates Counter-Strike 2 mechanics including smoke physics, recoil patterns, and map callouts.',
  }),
];

// ============================================================================
// AREPO Hub Nodes (Marketplace)
// ============================================================================

const arepoNodes: KnowledgeNode[] = [
  createNode({
    id: 'arepo-hub',
    title: 'AREPO Marketplace Hub',
    description: 'Data and model marketplace',
    type: 'hub',
    status: 'published',
    difficulty: 'beginner',
    hub: 'arepo',
    keywords: ['arepo', 'marketplace', 'data', 'models', 'exchange'],
    content: 'AREPO Marketplace enables buying, selling, and sharing of datasets, ML models, and analytical tools within the community.',
  }),
  createNode({
    id: 'data-marketplace',
    title: 'Data Marketplace',
    description: 'Buy and sell esports datasets',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'arepo',
    keywords: ['data', 'dataset', 'marketplace', 'buy', 'sell'],
    content: 'Access curated esports datasets including match histories, player statistics, and tactical patterns from professional play.',
  }),
  createNode({
    id: 'model-marketplace',
    title: 'Model Marketplace',
    description: 'ML model exchange',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'arepo',
    keywords: ['model', 'ml', 'machine learning', 'ai', 'predictive'],
    content: 'Share and download machine learning models for prediction, analysis, and automation within the esports domain.',
  }),
  createNode({
    id: 'nft-credentials',
    title: 'NFT Credentials',
    description: 'Verified achievement tokens',
    type: 'concept',
    status: 'published',
    difficulty: 'advanced',
    hub: 'arepo',
    keywords: ['nft', 'credentials', 'blockchain', 'achievement', 'verify'],
    content: 'NFT Credentials provide verifiable proof of expertise, tournament participation, and platform achievements.',
  }),
];

// ============================================================================
// OPERA Hub Nodes (Operations)
// ============================================================================

const operaNodes: KnowledgeNode[] = [
  createNode({
    id: 'opera-hub',
    title: 'OPERA Operations Hub',
    description: 'Tournament and team management',
    type: 'hub',
    status: 'published',
    difficulty: 'beginner',
    hub: 'opera',
    keywords: ['opera', 'operations', 'tournament', 'team', 'management'],
    content: 'OPERA Operations provides tools for tournament organization, team management, and competitive operations.',
  }),
  createNode({
    id: 'tournament-bracket',
    title: 'Tournament Bracket System',
    description: 'Create and manage brackets',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'opera',
    keywords: ['tournament', 'bracket', 'competition', 'organize', 'event'],
    content: 'Create single elimination, double elimination, round-robin, and Swiss system brackets for tournaments of any size.',
  }),
  createNode({
    id: 'team-management',
    title: 'Team Management',
    description: 'Roster and team tools',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'opera',
    keywords: ['team', 'roster', 'management', 'players', 'squad'],
    content: 'Manage team rosters, track player contracts, handle substitutions, and coordinate team schedules.',
  }),
  createNode({
    id: 'match-scheduling',
    title: 'Match Scheduling',
    description: 'Schedule and coordinate matches',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'opera',
    keywords: ['schedule', 'match', 'booking', 'calendar', 'time'],
    content: 'Coordinate match times across timezones, send notifications, and manage rescheduling requests.',
  }),
];

// ============================================================================
// TENET Hub Nodes (Central)
// ============================================================================

const tenetNodes: KnowledgeNode[] = [
  createNode({
    id: 'tenet-hub',
    title: 'TENET Central Hub',
    description: 'Platform control center',
    type: 'hub',
    status: 'published',
    difficulty: 'beginner',
    hub: 'tenet',
    keywords: ['tenet', 'central', 'hub', 'control', 'dashboard'],
    content: 'TENET Central Hub serves as the main dashboard and control center for platform navigation and settings.',
  }),
  createNode({
    id: 'user-settings',
    title: 'User Settings',
    description: 'Account and preference configuration',
    type: 'feature',
    status: 'published',
    difficulty: 'beginner',
    hub: 'tenet',
    keywords: ['settings', 'preferences', 'account', 'profile', 'config'],
    content: 'Configure account settings, notification preferences, display options, and privacy controls.',
  }),
  createNode({
    id: 'notifications',
    title: 'Notifications System',
    description: 'Alerts and message management',
    type: 'feature',
    status: 'published',
    difficulty: 'beginner',
    hub: 'tenet',
    keywords: ['notifications', 'alerts', 'messages', 'reminders', 'push'],
    content: 'Manage notification preferences, view alerts, and configure push notification settings.',
  }),
  createNode({
    id: 'two-factor-auth',
    title: 'Two-Factor Authentication',
    description: 'Enhanced account security',
    type: 'tutorial',
    status: 'published',
    difficulty: 'intermediate',
    hub: 'tenet',
    keywords: ['2fa', 'two-factor', 'security', 'authentication', 'totp'],
    content: 'Set up TOTP-based two-factor authentication to secure your account with an additional verification layer.',
  }),
  createNode({
    id: 'oauth-login',
    title: 'OAuth Login Options',
    description: 'Social authentication methods',
    type: 'feature',
    status: 'published',
    difficulty: 'beginner',
    hub: 'tenet',
    keywords: ['oauth', 'login', 'social', 'google', 'github'],
    content: 'Sign in using Google, GitHub, or Discord OAuth providers for quick and secure access.',
  }),
];

// ============================================================================
// Advanced Features Nodes
// ============================================================================

const advancedNodes: KnowledgeNode[] = [
  createNode({
    id: 'ml-predictions',
    title: 'ML Predictions',
    description: 'Machine learning match predictions',
    type: 'feature',
    status: 'published',
    difficulty: 'advanced',
    keywords: ['ml', 'predictions', 'machine learning', 'ai', 'forecast'],
    content: 'TensorFlow.js-powered match outcome predictions with confidence intervals and feature importance analysis.',
  }),
  createNode({
    id: 'specmap-viewer',
    title: 'SpecMap Viewer',
    description: '3D map visualization tool',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    keywords: ['specmap', 'map', '3d', 'viewer', 'visualization'],
    content: 'Interactive 3D map viewer with tactical overlays, heatmaps, and position analysis tools.',
  }),
  createNode({
    id: 'voice-commands',
    title: 'Voice Commands',
    description: 'Hands-free platform control',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    keywords: ['voice', 'commands', 'speech', 'control', 'hands-free'],
    content: 'Control the platform using natural voice commands for navigation, search, and data queries.',
  }),
  createNode({
    id: 'broadcast-system',
    title: 'Live Broadcast System',
    description: 'Real-time updates and alerts',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    keywords: ['broadcast', 'live', 'websocket', 'real-time', 'alerts'],
    content: 'WebSocket-based real-time notification system for live match updates and critical alerts.',
  }),
  createNode({
    id: 'wiki-system',
    title: 'Wiki System',
    description: 'Community documentation',
    type: 'feature',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['wiki', 'documentation', 'community', 'articles', 'knowledge'],
    content: 'Collaborative wiki system for community-contributed guides, strategies, and documentation.',
  }),
  createNode({
    id: 'export-tools',
    title: 'Export Tools',
    description: 'Data and visualization exports',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    keywords: ['export', 'download', 'share', 'image', 'data'],
    content: 'Export charts, data, and visualizations in various formats including PNG, SVG, CSV, and JSON.',
  }),
  createNode({
    id: 'offline-mode',
    title: 'Offline Mode',
    description: 'Use platform without internet',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    keywords: ['offline', 'pwa', 'service worker', 'no internet', 'local'],
    content: 'Progressive Web App features enable offline access to cached data and previously viewed content.',
  }),
  createNode({
    id: 'mobile-app',
    title: 'Mobile App',
    description: 'iOS and Android companion',
    type: 'feature',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['mobile', 'ios', 'android', 'app', 'phone'],
    content: 'Native mobile applications with gesture controls, push notifications, and optimized touch interfaces.',
  }),
  createNode({
    id: 'dark-mode',
    title: 'Dark Mode',
    description: 'Dark theme interface',
    type: 'feature',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['dark', 'theme', 'mode', 'night', 'appearance'],
    content: 'Toggle between light and dark themes for comfortable viewing in any lighting condition.',
  }),
  createNode({
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow',
    type: 'reference',
    status: 'published',
    difficulty: 'beginner',
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'commands', 'speed'],
    content: 'Master keyboard shortcuts for quick navigation, common actions, and power user workflows.',
  }),
  createNode({
    id: 'api-access',
    title: 'API Access',
    description: 'Programmatic data access',
    type: 'reference',
    status: 'published',
    difficulty: 'expert',
    keywords: ['api', 'rest', 'programmatic', 'developer', 'integration'],
    content: 'RESTful API for programmatic access to platform data, analytics, and simulation results.',
  }),
  createNode({
    id: 'webhook-integration',
    title: 'Webhook Integration',
    description: 'Event-driven notifications',
    type: 'reference',
    status: 'published',
    difficulty: 'expert',
    keywords: ['webhook', 'integration', 'events', 'callback', 'automation'],
    content: 'Configure webhooks to receive real-time event notifications at your external systems.',
  }),
  createNode({
    id: 'data-partition',
    title: 'Data Partition Firewall',
    description: 'Security and data separation',
    type: 'concept',
    status: 'published',
    difficulty: 'expert',
    keywords: ['data', 'partition', 'firewall', 'security', 'separation'],
    content: 'Data Partition Firewall ensures strict separation between game simulation data and web platform data.',
  }),
  createNode({
    id: 'pandascore-integration',
    title: 'Pandascore Integration',
    description: 'Official esports data API',
    type: 'feature',
    status: 'published',
    difficulty: 'intermediate',
    keywords: ['pandascore', 'api', 'data', 'integration', 'official'],
    content: 'Official Pandascore API integration provides legal access to professional esports match data.',
  }),
];

// ============================================================================
// All Nodes Combined
// ============================================================================

export const allNodes: KnowledgeNode[] = [
  ...platformNodes,
  ...satorNodes,
  ...rotasNodes,
  ...arepoNodes,
  ...operaNodes,
  ...tenetNodes,
  ...advancedNodes,
];

// ============================================================================
// Edges - Relationships
// ============================================================================

export const allEdges: KnowledgeEdge[] = [
  // Platform overview connections
  createEdge('edge-1', 'getting-started', 'platform-overview', 'relates-to'),
  createEdge('edge-2', 'getting-started', 'account-setup', 'leads-to'),
  createEdge('edge-3', 'account-setup', 'navigation-basics', 'leads-to'),
  createEdge('edge-4', 'navigation-basics', 'sator-hub', 'leads-to'),
  createEdge('edge-5', 'navigation-basics', 'rotas-hub', 'leads-to'),
  createEdge('edge-6', 'navigation-basics', 'arepo-hub', 'leads-to'),
  createEdge('edge-7', 'navigation-basics', 'opera-hub', 'leads-to'),
  createEdge('edge-8', 'navigation-basics', 'tenet-hub', 'leads-to'),

  // SATOR hub relationships
  createEdge('edge-9', 'sator-hub', 'simrating', 'contains'),
  createEdge('edge-10', 'sator-hub', 'rar-analysis', 'contains'),
  createEdge('edge-11', 'sator-hub', 'player-comparison', 'contains'),
  createEdge('edge-12', 'sator-hub', 'match-analytics', 'contains'),
  createEdge('edge-13', 'simrating', 'investment-grading', 'leads-to'),
  createEdge('edge-14', 'simrating', 'confidence-weighting', 'uses'),
  createEdge('edge-15', 'rar-analysis', 'rar-card', 'implements'),
  createEdge('edge-16', 'rar-analysis', 'volatility-indicator', 'uses'),
  createEdge('edge-17', 'temporal-analysis', 'match-analytics', 'extends'),
  createEdge('edge-18', 'player-comparison', 'simrating', 'uses'),
  createEdge('edge-19', 'investment-grading', 'simrating', 'uses'),
  createEdge('edge-20', 'confidence-weighting', 'temporal-analysis', 'relates-to'),

  // ROTAS hub relationships
  createEdge('edge-21', 'rotas-hub', 'deterministic-simulation', 'contains'),
  createEdge('edge-22', 'rotas-hub', 'tactical-view', 'contains'),
  createEdge('edge-23', 'rotas-hub', 'replay-system', 'contains'),
  createEdge('edge-24', 'rotas-hub', 'scenario-editor', 'contains'),
  createEdge('edge-25', 'deterministic-simulation', 'replay-system', 'implements'),
  createEdge('edge-26', 'combat-resolution', 'deterministic-simulation', 'part-of'),
  createEdge('edge-27', 'economy-simulation', 'deterministic-simulation', 'part-of'),
  createEdge('edge-28', 'tactical-view', 'replay-system', 'used-by'),
  createEdge('edge-29', 'scenario-editor', 'tactical-view', 'leads-to'),
  createEdge('edge-30', 'valorant-sim', 'combat-resolution', 'implements'),
  createEdge('edge-31', 'cs2-sim', 'combat-resolution', 'implements'),
  createEdge('edge-32', 'valorant-sim', 'economy-simulation', 'implements'),
  createEdge('edge-33', 'cs2-sim', 'economy-simulation', 'implements'),

  // AREPO hub relationships
  createEdge('edge-34', 'arepo-hub', 'data-marketplace', 'contains'),
  createEdge('edge-35', 'arepo-hub', 'model-marketplace', 'contains'),
  createEdge('edge-36', 'arepo-hub', 'nft-credentials', 'contains'),
  createEdge('edge-37', 'data-marketplace', 'pandascore-integration', 'uses'),
  createEdge('edge-38', 'model-marketplace', 'ml-predictions', 'relates-to'),

  // OPERA hub relationships
  createEdge('edge-39', 'opera-hub', 'tournament-bracket', 'contains'),
  createEdge('edge-40', 'opera-hub', 'team-management', 'contains'),
  createEdge('edge-41', 'opera-hub', 'match-scheduling', 'contains'),
  createEdge('edge-42', 'tournament-bracket', 'match-scheduling', 'uses'),
  createEdge('edge-43', 'team-management', 'player-comparison', 'relates-to'),

  // TENET hub relationships
  createEdge('edge-44', 'tenet-hub', 'user-settings', 'contains'),
  createEdge('edge-45', 'tenet-hub', 'notifications', 'contains'),
  createEdge('edge-46', 'tenet-hub', 'two-factor-auth', 'contains'),
  createEdge('edge-47', 'tenet-hub', 'oauth-login', 'contains'),
  createEdge('edge-48', 'account-setup', 'two-factor-auth', 'leads-to'),
  createEdge('edge-49', 'account-setup', 'oauth-login', 'leads-to'),
  createEdge('edge-50', 'user-settings', 'notifications', 'contains'),
  createEdge('edge-51', 'user-settings', 'dark-mode', 'contains'),
  createEdge('edge-52', 'two-factor-auth', 'security', 'relates-to', { description: 'Security concept' }),

  // Advanced features relationships
  createEdge('edge-53', 'ml-predictions', 'simrating', 'extends'),
  createEdge('edge-54', 'ml-predictions', 'investment-grading', 'extends'),
  createEdge('edge-55', 'specmap-viewer', 'tactical-view', 'extends'),
  createEdge('edge-56', 'specmap-viewer', 'replay-system', 'used-by'),
  createEdge('edge-57', 'voice-commands', 'navigation-basics', 'extends'),
  createEdge('edge-58', 'broadcast-system', 'notifications', 'implements'),
  createEdge('edge-59', 'wiki-system', 'platform-overview', 'relates-to'),
  createEdge('edge-60', 'export-tools', 'specmap-viewer', 'used-by'),
  createEdge('edge-61', 'export-tools', 'rar-card', 'used-by'),
  createEdge('edge-62', 'offline-mode', 'getting-started', 'relates-to'),
  createEdge('edge-63', 'mobile-app', 'navigation-basics', 'implements'),
  createEdge('edge-64', 'dark-mode', 'user-settings', 'part-of'),
  createEdge('edge-65', 'keyboard-shortcuts', 'navigation-basics', 'extends'),
  createEdge('edge-66', 'api-access', 'pandascore-integration', 'relates-to'),
  createEdge('edge-67', 'webhook-integration', 'broadcast-system', 'extends'),
  createEdge('edge-68', 'data-partition', 'api-access', 'relates-to'),
  createEdge('edge-69', 'pandascore-integration', 'match-analytics', 'used-by'),

  // Cross-hub learning paths
  createEdge('edge-70', 'getting-started', 'sator-hub', 'prerequisite'),
  createEdge('edge-71', 'sator-hub', 'rotas-hub', 'leads-to'),
  createEdge('edge-72', 'rotas-hub', 'opera-hub', 'leads-to'),
  createEdge('edge-73', 'opera-hub', 'arepo-hub', 'leads-to'),
  createEdge('edge-74', 'simrating', 'ml-predictions', 'prerequisite'),
  createEdge('edge-75', 'tactical-view', 'specmap-viewer', 'prerequisite'),
  createEdge('edge-76', 'replay-system', 'scenario-editor', 'prerequisite'),
];

// ============================================================================
// Graph Factory
// ============================================================================

export function createSampleKnowledgeGraph() {
  const graph = createKnowledgeGraph(
    'help-knowledge-graph',
    'Help Documentation Knowledge Graph',
    'Comprehensive knowledge graph for NJZiteGeisTe Platform help documentation'
  );

  // Add all nodes
  allNodes.forEach(node => addNode(graph, node));

  // Add all edges
  allEdges.forEach(edge => {
    try {
      addEdge(graph, edge);
    } catch {
      // Edge validation may fail if nodes don't exist - skip
    }
  });

  return graph;
}

// ============================================================================
// Learning Paths
// ============================================================================

export const predefinedLearningPaths = [
  {
    id: 'new-user-path',
    name: 'New User Journey',
    description: 'Complete onboarding for new platform users',
    difficulty: 'beginner' as const,
    estimatedTime: 30,
    steps: [
      'platform-overview',
      'getting-started',
      'account-setup',
      'navigation-basics',
      'tenet-hub',
      'user-settings',
    ],
    prerequisites: [],
    tags: ['onboarding', 'beginner', 'essential'],
  },
  {
    id: 'analytics-specialist',
    name: 'Analytics Specialist',
    description: 'Master SATOR Analytics tools and metrics',
    difficulty: 'advanced' as const,
    estimatedTime: 120,
    steps: [
      'sator-hub',
      'simrating',
      'confidence-weighting',
      'player-comparison',
      'match-analytics',
      'rar-analysis',
      'volatility-indicator',
      'investment-grading',
      'temporal-analysis',
    ],
    prerequisites: ['platform-overview'],
    tags: ['analytics', 'advanced', 'sator'],
  },
  {
    id: 'simulation-expert',
    name: 'Simulation Expert',
    description: 'Become proficient with ROTAS Simulation',
    difficulty: 'advanced' as const,
    estimatedTime: 90,
    steps: [
      'rotas-hub',
      'deterministic-simulation',
      'tactical-view',
      'replay-system',
      'combat-resolution',
      'economy-simulation',
      'scenario-editor',
    ],
    prerequisites: ['platform-overview'],
    tags: ['simulation', 'advanced', 'rotas'],
  },
  {
    id: 'tournament-organizer',
    name: 'Tournament Organizer',
    description: 'Learn to organize esports competitions',
    difficulty: 'intermediate' as const,
    estimatedTime: 60,
    steps: [
      'opera-hub',
      'tournament-bracket',
      'match-scheduling',
      'team-management',
      'broadcast-system',
    ],
    prerequisites: ['platform-overview'],
    tags: ['tournament', 'operations', 'opera'],
  },
  {
    id: 'developer-integration',
    name: 'Developer Integration',
    description: 'Integrate with platform APIs and webhooks',
    difficulty: 'expert' as const,
    estimatedTime: 180,
    steps: [
      'api-access',
      'data-partition',
      'pandascore-integration',
      'webhook-integration',
      'model-marketplace',
    ],
    prerequisites: ['platform-overview', 'tenet-hub'],
    tags: ['developer', 'api', 'integration'],
  },
  {
    id: 'power-user',
    name: 'Power User Mastery',
    description: 'Maximize productivity with advanced features',
    difficulty: 'expert' as const,
    estimatedTime: 150,
    steps: [
      'keyboard-shortcuts',
      'voice-commands',
      'specmap-viewer',
      'ml-predictions',
      'export-tools',
      'wiki-system',
      'data-marketplace',
    ],
    prerequisites: ['sator-hub', 'rotas-hub'],
    tags: ['power-user', 'advanced', 'productivity'],
  },
];

// Export for convenient access
export { platformNodes, satorNodes, rotasNodes, arepoNodes, operaNodes, tenetNodes, advancedNodes };
