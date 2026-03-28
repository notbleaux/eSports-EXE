/**
 * MinimapFrameGrid Types
 *
 * TypeScript type definitions for the Minimap Frame Grid component.
 * Part of Phase 9: Minimap Feature for NJZiteGeisTe Platform.
 *
 * [Ver001.000]
 */

/**
 * Segment classification types for VOD frames
 */
export type SegmentType =
  | 'IN_ROUND'
  | 'BUY_PHASE'
  | 'HALFTIME'
  | 'BETWEEN_ROUND'
  | 'UNKNOWN';

/**
 * Individual frame data structure
 */
export interface FrameData {
  /** Unique identifier for the frame */
  frameId: string;
  /** Sequential index within the VOD */
  frameIndex: number;
  /** Classification of the game segment */
  segmentType: SegmentType;
  /** Timestamp in milliseconds from start of VOD */
  timestampMs: number;
  /** URL to the frame image (JPEG) */
  storageUrl: string;
  /** Whether the frame is pinned/verified */
  isPinned: boolean;
  /** ISO timestamp when frame was pinned */
  pinnedAt?: string;
  /** User who pinned the frame */
  pinnedBy?: string;
}

/**
 * API response for paginated frame requests
 */
export interface FramesApiResponse {
  /** Array of frame data */
  frames: FrameData[];
  /** Current page number (1-indexed) */
  page: number;
  /** Number of frames per page */
  pageSize: number;
  /** Total number of frames available */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether more pages are available */
  hasMore: boolean;
}

/**
 * Props for the main MinimapFrameGrid component
 */
export interface MinimapFrameGridProps {
  /** Match ID to fetch frames for */
  matchId: string;
  /** Number of frames per page (default: 50) */
  pageSize?: number;
  /** Optional CSS class name */
  className?: string;
  /** Optional callback when a frame is clicked */
  onFrameClick?: (frame: FrameData) => void;
}

/**
 * Props for individual frame thumbnail
 */
export interface FrameThumbnailProps {
  /** Frame data to display */
  frame: FrameData;
  /** Optional click handler */
  onClick?: () => void;
  /** Callback when pin is toggled (admin only) */
  onPinToggle?: (frameId: string, pin: boolean) => Promise<void>;
  /** Whether current user has admin privileges */
  isAdmin?: boolean;
  /** Whether a pin operation is in progress */
  isPinning?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for segment type badge
 */
export interface SegmentTypeBadgeProps {
  /** Segment type to display */
  type: SegmentType;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for verification badge
 */
export interface VerificationBadgeProps {
  /** Unique frame identifier */
  frameId: string;
  /** Whether the frame is pinned */
  isPinned: boolean;
  /** ISO timestamp when frame was pinned */
  pinnedAt?: string;
  /** User who pinned the frame */
  pinnedBy?: string;
  /** Callback when pin is toggled (admin only) */
  onPinToggle?: (frameId: string, pin: boolean) => Promise<void>;
  /** Whether current user has admin privileges */
  isAdmin?: boolean;
  /** Whether a pin operation is in progress */
  isLoading?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Color configuration for segment types
 */
export interface SegmentTypeColors {
  bg: string;
  text: string;
  border: string;
}

/**
 * Segment type metadata including display labels and colors
 */
export interface SegmentTypeMeta {
  label: string;
  colors: SegmentTypeColors;
}
