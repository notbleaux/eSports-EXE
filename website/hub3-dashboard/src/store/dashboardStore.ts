import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Player, Metrics, PerformanceData, currentMetrics, topPerformers, performanceHistory } from '../data/mockData';

interface DashboardState {
  // Data
  players: Player[];
  metrics: Metrics;
  performanceData: PerformanceData[];
  selectedPlayer: Player | null;
  
  // UI State
  isLoading: boolean;
  lastUpdated: Date;
  
  // Actions
  setSelectedPlayer: (player: Player | null) => void;
  refreshData: () => Promise<void>;
  updateMetrics: () => void;
}

const API_BASE = 'https://api.simrating.com/v1';

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      players: topPerformers,
      metrics: currentMetrics,
      performanceData: performanceHistory,
      selectedPlayer: null,
      isLoading: false,
      lastUpdated: new Date(),
      
      // Actions
      setSelectedPlayer: (player) => set({ selectedPlayer: player }),
      
      refreshData: async () => {
        set({ isLoading: true });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In real implementation:
          // const res = await fetch(`${API_BASE}/metrics`);
          // const data = await res.json();
          
          set({
            lastUpdated: new Date(),
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to refresh data:', error);
          set({ isLoading: false });
        }
      },
      
      updateMetrics: () => {
        // Simulate real-time updates
        const { metrics } = get();
        set({
          metrics: {
            ...metrics,
            avgSimRating: Number((metrics.avgSimRating + (Math.random() - 0.5) * 0.1).toFixed(1)),
          },
          lastUpdated: new Date(),
        });
      },
    }),
    { name: 'DashboardStore' }
  )
);

// Auto-update metrics every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    useDashboardStore.getState().updateMetrics();
  }, 30000);
}
