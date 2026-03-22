/**
 * Mode Store - SATOR ↔ ROTAS State Management
 * 
 * [Ver002.000] - Converted to TypeScript
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum AppMode {
  SATOR = 'SATOR',
  ROTAS = 'ROTAS',
}

export interface ModeColors {
  accent: string;
  accentGlow: string;
  accentMuted: string;
  gradient: string;
  liveIndicator: string;
}

const MODE_COLORS: Record<AppMode, ModeColors> = {
  [AppMode.SATOR]: {
    accent: '#00D4FF',
    accentGlow: 'rgba(0, 212, 255, 0.5)',
    accentMuted: '#00A0C0',
    gradient: 'linear-gradient(135deg, #00D4FF 0%, #0066FF 100%)',
    liveIndicator: '#00D4FF',
  },
  [AppMode.ROTAS]: {
    accent: '#FF4655',
    accentGlow: 'rgba(255, 70, 85, 0.5)',
    accentMuted: '#CC3A47',
    gradient: 'linear-gradient(135deg, #FF4655 0%, #FF6B00 100%)',
    liveIndicator: '#FF4655',
  },
};

export interface ModeState {
  mode: AppMode;
  isTransitioning: boolean;
  toggleMode: () => void;
  setMode: (mode: AppMode) => void;
  getColors: () => ModeColors;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: AppMode.SATOR,
      isTransitioning: false,

      toggleMode: () => {
        const newMode = get().mode === AppMode.SATOR ? AppMode.ROTAS : AppMode.SATOR;
        set({ mode: newMode, isTransitioning: true });

        // Auto-end transition after animation
        setTimeout(() => {
          set({ isTransitioning: false });
        }, 600);
      },

      setMode: (mode: AppMode) => {
        set({ mode, isTransitioning: true });
        setTimeout(() => {
          set({ isTransitioning: false });
        }, 600);
      },

      getColors: () => MODE_COLORS[get().mode],
    }),
    {
      name: 'sator-mode-storage',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

// Hook for mode colors
export const useModeColors = (): ModeColors => {
  const { getColors } = useModeStore();
  return getColors();
};
