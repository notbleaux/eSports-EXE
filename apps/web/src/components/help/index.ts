/** [Ver002.001] - Fixed type exports from lib/broadcast/types */
/**
 * Help Components
 * ===============
 * React components for the unified help system.
 */

// Panel Components
export {
  Panel,
  KpiCard,
  KpiRow,
  MatchItem,
  MatchList,
  SparklinePlaceholder,
  type PanelProps,
  type KpiCardProps,
  type KpiRowProps,
  type MatchItemProps,
  type MatchListProps,
  type SparklinePlaceholderProps,
} from './Panel';

// Live Broadcast Components
export {
  LiveBroadcast,
  BroadcastNotification,
  useLiveBroadcast,
} from './LiveBroadcast';

// Export types from lib/broadcast/types (not from component)
export type {
  LiveBroadcastProps,
  BroadcastNotificationProps,
  UseLiveBroadcastOptions,
} from '@/lib/broadcast/types';

// Voice Feedback Component
export {
  VoiceFeedback,
  VoiceMicButton,
  VoiceTranscript,
  VoiceSuggestions,
  VoicePermissionPrompt,
  VoiceHelpPanel,
  type VoiceFeedbackProps,
  type VoiceMicButtonProps,
  type VoiceTranscriptProps,
  type VoiceSuggestionsProps,
  type VoicePermissionPromptProps,
} from './VoiceFeedback';

// Context Detection Components
export {
  ContextDetector,
  FeatureTracker,
  ActionTracker,
  FrustrationAlert,
  useHelpContext,
  type ContextDetectorProps,
  type FeatureTrackerProps,
  type ActionTrackerProps,
  type FrustrationAlertProps,
} from './ContextDetector';

// Knowledge Graph Components
export {
  KnowledgeGraphView,
  type KnowledgeGraphViewProps,
} from './KnowledgeGraphView';

// Knowledge Search Components
export {
  KnowledgeSearch,
  type KnowledgeSearchProps,
} from './KnowledgeSearch';

// Future component exports will be added here:
// export { MatchHeader } from './MatchHeader';
// export { MatchViewer } from './MatchViewer';
// export { Timeline } from './Timeline';
// export { SmartPanels } from './SmartPanels';
// export { UnifiedTimeline } from './UnifiedTimeline';
