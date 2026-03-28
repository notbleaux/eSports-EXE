/**
 * Archival API Service
 *
 * Real API client for the Archival System endpoints.
 * Replaces mockArchivalClient from Phase 1.
 *
 * Tasks: MF-8, MF-9 - Frontend Archival API Integration
 *
 * [Ver001.000]
 */

import type { FrameData, FramesApiResponse, SegmentType } from '@/components/MinimapFrameGrid';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get JWT auth token from localStorage
 */
function getAuthToken(): string | null {
  try {
    // Try to get token from localStorage (set by api-client)
    const token = localStorage.getItem('sator_auth_token');
    return token;
  } catch {
    return null;
  }
}

/**
 * Fetch frames for a match with pagination
 */
async function getFrames(
  matchId: string,
  page: number,
  pageSize: number
): Promise<FramesApiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/v1/archive/matches/${matchId}/frames?page=${page}&limit=${pageSize}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Match not found or no frames available');
    }
    throw new Error(`Failed to fetch frames: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Map API response to frontend types
  const frames: FrameData[] = data.frames.map((frame: {
    frame_id: string;
    frame_index?: number;
    segment_type: string;
    timestamp_ms: number;
    storage_url?: string;
    is_pinned: boolean;
    pinned_at?: string;
    pinned_by?: string;
  }) => ({
    frameId: frame.frame_id,
    frameIndex: frame.frame_index ?? 0,
    segmentType: frame.segment_type as SegmentType,
    timestampMs: frame.timestamp_ms,
    storageUrl: frame.storage_url || '',
    isPinned: frame.is_pinned,
    pinnedAt: frame.pinned_at,
    pinnedBy: frame.pinned_by,
  }));

  return {
    frames,
    page: data.page,
    pageSize: data.page_size,
    total: data.total_count,
    totalPages: Math.ceil(data.total_count / data.page_size),
    hasMore: data.has_more,
  };
}

/**
 * Fetch a single frame by ID
 */
async function getFrame(frameId: string): Promise<FrameData | null> {
  // The API doesn't have a direct /frames/{id} endpoint,
  // so we would need to query via match or handle differently
  // For now, return null - this would need a backend endpoint
  console.warn('getFrame: Not implemented - requires backend endpoint');
  return null;
}

/**
 * Pin a frame (admin only)
 */
async function pinFrame(frameId: string, reason?: string): Promise<boolean> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required to pin frames');
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/archive/frames/${frameId}/pin`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reason: reason || 'Pinned by user',
        ttl_days: 365, // Default 1 year retention
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in again');
    }
    if (response.status === 403) {
      throw new Error('Admin access required to pin frames');
    }
    if (response.status === 404) {
      throw new Error('Frame not found');
    }
    throw new Error(`Failed to pin frame: ${response.statusText}`);
  }

  return true;
}

/**
 * Unpin a frame (admin only)
 */
async function unpinFrame(frameId: string): Promise<boolean> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required to unpin frames');
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/archive/frames/${frameId}/unpin`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in again');
    }
    if (response.status === 403) {
      throw new Error('Admin access required to unpin frames');
    }
    if (response.status === 404) {
      throw new Error('Frame not found or not pinned');
    }
    throw new Error(`Failed to unpin frame: ${response.statusText}`);
  }

  return true;
}

/**
 * Toggle pin status for a frame
 */
async function togglePin(frameId: string, pin: boolean): Promise<boolean> {
  if (pin) {
    return pinFrame(frameId, 'Verified by TeNET');
  } else {
    return unpinFrame(frameId);
  }
}

/**
 * Get archival system health status
 */
async function getHealth(): Promise<{
  status: string;
  frame_count?: number;
  storage_bytes?: number;
  storage_healthy?: boolean;
  database_healthy?: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/v1/archive/health`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Archival API client interface
 */
export const archivalApi = {
  getFrames,
  getFrame,
  pinFrame,
  unpinFrame,
  togglePin,
  getHealth,
};

export default archivalApi;
