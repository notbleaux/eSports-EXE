/**
 * Mode Store - SATOR ↔ ROTAS State Management
 * 
 * [Ver001.000]
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const AppMode = {
  SATOR: 'SATOR',
  ROTAS: 'ROTAS',
};

const MODE_COLORS = {
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

export const useModeStore = create(
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
      
      setMode: (mode) => {
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
export const useModeColors = () => {
  const { getColors } = useModeStore();
  return getColors();
};
