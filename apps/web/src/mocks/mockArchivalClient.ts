/**
 * Mock Archival Client
 *
 * Mock API client for Minimap Frame development.
 * Simulates network delays and returns mock frame data.
 * Will be replaced with real API client in Tasks MF-7 to MF-9.
 *
 * [Ver001.000]
 */

import type {
  FrameData,
  FramesApiResponse,
  SegmentType,
} from '@/components/MinimapFrameGrid';

/**
 * Options for fetching frames
 */
export interface GetFramesOptions {
  /** Page number (1-indexed) */
  page: number;
  /** Number of frames per page */
  pageSize: number;
}

/**
 * Mock Archival Client interface
 */
export interface ArchivalClient {
  /**
   * Fetch frames for a match
   */
  getFrames(matchId: string, options: GetFramesOptions): Promise<FramesApiResponse>;
  /**
   * Fetch a single frame by ID
   */
  getFrame(frameId: string): Promise<FrameData | null>;
  /**
   * Pin/unpin a frame
   */
  togglePin(frameId: string, pin: boolean): Promise<boolean>;
}

// Segment types for random generation
const SEGMENT_TYPES: SegmentType[] = [
  'IN_ROUND',
  'BUY_PHASE',
  'HALFTIME',
  'BETWEEN_ROUND',
  'UNKNOWN',
];

// Mock image URLs (using placeholder service)
const MOCK_IMAGE_URLS = [
  'https://placehold.co/320x180/1a1a2e/00d4ff?text=Frame+1',
  'https://placehold.co/320x180/1a1a2e/ff4444?text=Frame+2',
  'https://placehold.co/320x180/1a1a2e/ffaa00?text=Frame+3',
  'https://placehold.co/320x180/1a1a2e/ff00ff?text=Frame+4',
  'https://placehold.co/320x180/1a1a2e/8b5cf6?text=Frame+5',
  'https://placehold.co/320x180/16213e/00d4ff?text=Frame+6',
  'https://placehold.co/320x180/16213e/ff4444?text=Frame+7',
  'https://placehold.co/320x180/16213e/ffaa00?text=Frame+8',
];

/**
 * Generate deterministic mock frames for a match
 */
function generateMockFrames(
  matchId: string,
  count: number,
  offset: number = 0
): FrameData[] {
  const frames: FrameData[] = [];
  const baseTime = 0; // Start at 0ms

  for (let i = 0; i < count; i++) {
    const frameIndex = offset + i;
    // Generate timestamp - approximately 1 frame per second of VOD
    const timestampMs = baseTime + frameIndex * 1000 + Math.floor(Math.random() * 500);

    // Deterministic segment type based on frame index
    let segmentType: SegmentType;
    const roundPosition = frameIndex % 120; // Approximate round length
    if (roundPosition < 30) {
      segmentType = 'BUY_PHASE';
    } else if (roundPosition < 105) {
      segmentType = 'IN_ROUND';
    } else if (roundPosition < 115) {
      segmentType = 'BETWEEN_ROUND';
    } else {
      segmentType = 'HALFTIME';
    }

    // Randomize slightly for realism
    if (Math.random() < 0.05) {
      segmentType = 'UNKNOWN';
    }

    // Some frames are pinned (about 10%)
    const isPinned = Math.random() < 0.1;

    frames.push({
      frameId: `${matchId}-frame-${frameIndex}`,
      frameIndex,
      segmentType,
      timestampMs,
      storageUrl: MOCK_IMAGE_URLS[frameIndex % MOCK_IMAGE_URLS.length],
      isPinned,
      pinnedAt: isPinned
        ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      pinnedBy: isPinned ? ['admin', 'moderator', 'analyst'][Math.floor(Math.random() * 3)] : undefined,
    });
  }

  return frames;
}

/**
 * Simulate network delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random delay between min and max ms
 */
function randomDelay(min: number = 200, max: number = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms);
}

/**
 * Mock Archival Client implementation
 */
export const mockArchivalClient: ArchivalClient = {
  /**
   * Fetch paginated frames for a match
   */
  async getFrames(matchId: string, options: GetFramesOptions): Promise<FramesApiResponse> {
    await randomDelay(200, 500);

    // Simulate occasional errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Failed to fetch frames: Network error');
    }

    const { page, pageSize } = options;

    // Generate total based on matchId for consistency
    const total = 500 + (matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 500);
    const totalPages = Math.ceil(total / pageSize);

    // Calculate slice for current page
    const startIndex = (page - 1) * pageSize;
    const remainingItems = Math.max(0, total - startIndex);
    const itemsToReturn = Math.min(pageSize, remainingItems);

    const frames = generateMockFrames(matchId, itemsToReturn, startIndex);

    return {
      frames,
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Fetch a single frame by ID
   */
  async getFrame(frameId: string): Promise<FrameData | null> {
    await randomDelay(100, 300);

    // Parse matchId from frameId (format: "matchId-frame-index")
    const parts = frameId.split('-frame-');
    if (parts.length !== 2) {
      return null;
    }

    const [matchId, indexStr] = parts;
    const frameIndex = parseInt(indexStr, 10);

    if (isNaN(frameIndex)) {
      return null;
    }

    const frames = generateMockFrames(matchId, 1, frameIndex);
    return frames[0] || null;
  },

  /**
   * Pin or unpin a frame
   */
  async togglePin(frameId: string, pin: boolean): Promise<boolean> {
    await randomDelay(150, 400);

    // Simulate occasional errors
    if (Math.random() < 0.02) {
      throw new Error('Failed to update pin status');
    }

    // In a real implementation, this would update the server
    console.log(`[Mock] ${pin ? 'Pinned' : 'Unpinned'} frame: ${frameId}`);
    return true;
  },
};

/**
 * Generate mock frames for a specific match (useful for testing)
 */
export function generateMockFramesForMatch(
  matchId: string,
  totalFrames: number = 500
): FrameData[] {
  return generateMockFrames(matchId, totalFrames);
}

/**
 * Generate a single mock frame
 */
export function generateMockFrame(
  matchId: string,
  frameIndex: number,
  overrides?: Partial<FrameData>
): FrameData {
  const frames = generateMockFrames(matchId, 1, frameIndex);
  return { ...frames[0], ...overrides };
}

export default mockArchivalClient;
