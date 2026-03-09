'use client';

import { useState, useEffect, useCallback } from 'react';

type Platform = 'Windows' | 'macOS' | 'Linux' | 'Web' | 'unknown';

export function usePlatformDetection(): { platform: Platform; isMobile: boolean } {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platformStr = navigator.platform.toLowerCase();

      // Mobile detection
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(userAgent);
      setIsMobile(isMobileDevice);

      // Platform detection
      if (userAgent.includes('win') || platformStr.includes('win')) {
        setPlatform('Windows');
      } else if (userAgent.includes('mac') || platformStr.includes('mac')) {
        setPlatform('macOS');
      } else if (userAgent.includes('linux') || platformStr.includes('linux')) {
        setPlatform('Linux');
      } else if (isMobileDevice && (userAgent.includes('iphone') || userAgent.includes('ipad'))) {
        // iOS - recommend Web version
        setPlatform('Web');
      } else if (isMobileDevice && userAgent.includes('android')) {
        // Android - recommend Web version
        setPlatform('Web');
      } else {
        setPlatform('Web');
      }
    };

    detectPlatform();
  }, []);

  return { platform, isMobile };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export interface DownloadState {
  isDownloading: boolean;
  progress: number;
  speed: string;
  timeRemaining: string;
  paused: boolean;
}

export function useDownloadManager() {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    speed: '0 MB/s',
    timeRemaining: '--',
    paused: false,
  });

  const startDownload = useCallback((fileSizeMB: number = 4200) => {
    setDownloadState({
      isDownloading: true,
      progress: 0,
      speed: '45 MB/s',
      timeRemaining: '1m 32s',
      paused: false,
    });

    // Simulate download progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      setDownloadState(prev => {
        if (prev.paused) return prev;
        
        currentProgress += Math.random() * 3;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          return {
            ...prev,
            progress: 100,
            isDownloading: false,
            speed: '0 MB/s',
            timeRemaining: 'Complete!',
          };
        }

        const remaining = Math.ceil((100 - currentProgress) / 3);
        const speed = 40 + Math.random() * 15;
        
        return {
          ...prev,
          progress: Math.min(currentProgress, 100),
          speed: `${speed.toFixed(1)} MB/s`,
          timeRemaining: `${remaining}s remaining`,
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const pauseDownload = useCallback(() => {
    setDownloadState(prev => ({ ...prev, paused: !prev.paused }));
  }, []);

  const resetDownload = useCallback(() => {
    setDownloadState({
      isDownloading: false,
      progress: 0,
      speed: '0 MB/s',
      timeRemaining: '--',
      paused: false,
    });
  }, []);

  return { downloadState, startDownload, pauseDownload, resetDownload };
}
