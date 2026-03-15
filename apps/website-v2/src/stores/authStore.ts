[Ver001.000]
/**
 * Auth Store
 * ==========
 * Zustand store for managing authentication state.
 * Works with the JWT tokens stored in localStorage by api-client.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Actions
      setUser: (user) => set({ user }),
      
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      
      setLoading: (value) => set({ isLoading: value }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      login: (user) => set({
        user,
        isAuthenticated: true,
        error: null,
      }),
      
      logout: () => set({
        user: null,
        isAuthenticated: false,
        error: null,
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'sator-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
