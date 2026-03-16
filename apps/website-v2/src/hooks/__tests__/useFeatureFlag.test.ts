/**
 * useFeatureFlag Hook Tests
 * 
 * [Ver001.000]
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFeatureFlag, useFeatureManager } from '../useFeatureFlag';
import * as featuresModule from '@/config/features';

// Mock the features module
vi.mock('@/config/features', () => ({
  isFeatureEnabled: vi.fn(),
  setFeatureOverride: vi.fn(),
  resetFeatureOverrides: vi.fn(),
}));

describe('useFeatureFlag', () => {
  const mockIsFeatureEnabled = vi.mocked(featuresModule.isFeatureEnabled);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when feature is enabled', () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useFeatureFlag('opera.live-chat'));

    expect(result.current).toBe(true);
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith('opera.live-chat');
  });

  it('should return false when feature is disabled', () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useFeatureFlag('opera.multi-stream'));

    expect(result.current).toBe(false);
  });

  it('should re-check when localStorage changes', () => {
    mockIsFeatureEnabled.mockReturnValueOnce(false).mockReturnValueOnce(true);

    const { result, rerender } = renderHook(() => useFeatureFlag('tenet.search-v2'));

    expect(result.current).toBe(false);

    // Simulate storage change
    window.dispatchEvent(new StorageEvent('storage'));
    rerender();

    expect(mockIsFeatureEnabled).toHaveBeenCalledTimes(2);
  });

  it('should handle all feature flag types', () => {
    const features: (keyof featuresModule.FeatureFlags)[] = [
      'opera.live-chat',
      'sator.advanced-analytics',
      'rotas.simulation-3d',
      'arepo.match-analysis',
      'tenet.dark-mode',
      'global.sentry',
    ];

    features.forEach((feature) => {
      mockIsFeatureEnabled.mockReturnValue(true);
      const { result } = renderHook(() => useFeatureFlag(feature));
      expect(result.current).toBe(true);
    });
  });
});

describe('useFeatureManager', () => {
  const mockSetFeatureOverride = vi.mocked(featuresModule.setFeatureOverride);
  const mockResetFeatureOverrides = vi.mocked(featuresModule.resetFeatureOverrides);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide toggleFeature function', () => {
    const { result } = renderHook(() => useFeatureManager());

    expect(typeof result.current.toggleFeature).toBe('function');

    result.current.toggleFeature('opera.live-chat', true);

    expect(mockSetFeatureOverride).toHaveBeenCalledWith('opera.live-chat', true);
  });

  it('should provide resetFeatures function', () => {
    const { result } = renderHook(() => useFeatureManager());

    expect(typeof result.current.resetFeatures).toBe('function');

    result.current.resetFeatures();

    expect(mockResetFeatureOverrides).toHaveBeenCalled();
  });

  it('should indicate development environment', () => {
    const { result } = renderHook(() => useFeatureManager());

    expect(typeof result.current.isDevelopment).toBe('boolean');
  });
});
