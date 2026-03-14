[Ver001.000]
/**
 * User Profile Store
 * =================
 * Zustand store for user data, tokens, reputation, and preferences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  joinedAt: string;
  reputation: number;
  badges: string[];
}

export interface TokenState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  dailyStreak: number;
  lastDailyClaim: string | null;
  nextClaimAvailable: string | null;
}

export interface SocialState {
  following: string[];
  followers: string[];
  blockedUsers: string[];
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    betting: boolean;
    forum: boolean;
    fantasy: boolean;
  };
  privacy: {
    showBalance: boolean;
    showActivity: boolean;
    allowMessages: boolean;
  };
  stream: {
    defaultQuality: 'auto' | '1080p' | '720p' | '480p';
    autoMute: boolean;
    showChat: boolean;
  };
}

interface UserStore {
  // Profile
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Tokens
  tokens: TokenState;

  // Social
  social: SocialState;

  // Preferences
  preferences: UserPreferences;

  // Actions - Profile
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;

  // Actions - Tokens
  setTokenBalance: (balance: number) => void;
  updateTokens: (updates: Partial<TokenState>) => void;
  addTokens: (amount: number) => void;
  deductTokens: (amount: number) => void;
  claimDaily: (amount: number, streak: number) => void;

  // Actions - Social
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;

  // Actions - Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateNotificationSettings: (updates: Partial<UserPreferences['notifications']>) => void;
  updatePrivacySettings: (updates: Partial<UserPreferences['privacy']>) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  notifications: {
    email: true,
    push: true,
    betting: true,
    forum: true,
    fantasy: true,
  },
  privacy: {
    showBalance: false,
    showActivity: true,
    allowMessages: true,
  },
  stream: {
    defaultQuality: 'auto',
    autoMute: false,
    showChat: true,
  },
};

const defaultTokens: TokenState = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  dailyStreak: 0,
  lastDailyClaim: null,
  nextClaimAvailable: null,
};

const defaultSocial: SocialState = {
  following: [],
  followers: [],
  blockedUsers: [],
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokens: defaultTokens,
      social: defaultSocial,
      preferences: defaultPreferences,

      // Profile actions
      setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      setLoading: (value) => set({ isLoading: value }),

      setError: (error) => set({ error }),

      logout: () =>
        set({
          profile: null,
          isAuthenticated: false,
          tokens: defaultTokens,
          social: defaultSocial,
        }),

      // Token actions
      setTokenBalance: (balance) =>
        set((state) => ({
          tokens: { ...state.tokens, balance },
        })),

      updateTokens: (updates) =>
        set((state) => ({
          tokens: { ...state.tokens, ...updates },
        })),

      addTokens: (amount) =>
        set((state) => ({
          tokens: {
            ...state.tokens,
            balance: state.tokens.balance + amount,
            totalEarned: state.tokens.totalEarned + amount,
          },
        })),

      deductTokens: (amount) =>
        set((state) => ({
          tokens: {
            ...state.tokens,
            balance: Math.max(0, state.tokens.balance - amount),
            totalSpent: state.tokens.totalSpent + amount,
          },
        })),

      claimDaily: (amount, streak) => {
        const now = new Date();
        const nextClaim = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        set((state) => ({
          tokens: {
            ...state.tokens,
            balance: state.tokens.balance + amount,
            totalEarned: state.tokens.totalEarned + amount,
            dailyStreak: streak,
            lastDailyClaim: now.toISOString(),
            nextClaimAvailable: nextClaim.toISOString(),
          },
        }));
      },

      // Social actions
      followUser: (userId) =>
        set((state) => ({
          social: {
            ...state.social,
            following: [...state.social.following, userId],
          },
        })),

      unfollowUser: (userId) =>
        set((state) => ({
          social: {
            ...state.social,
            following: state.social.following.filter((id) => id !== userId),
          },
        })),

      blockUser: (userId) =>
        set((state) => ({
          social: {
            ...state.social,
            blockedUsers: [...state.social.blockedUsers, userId],
            following: state.social.following.filter((id) => id !== userId),
          },
        })),

      unblockUser: (userId) =>
        set((state) => ({
          social: {
            ...state.social,
            blockedUsers: state.social.blockedUsers.filter((id) => id !== userId),
          },
        })),

      // Preference actions
      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),

      updateNotificationSettings: (updates) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: { ...state.preferences.notifications, ...updates },
          },
        })),

      updatePrivacySettings: (updates) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            privacy: { ...state.preferences.privacy, ...updates },
          },
        })),
    }),
    {
      name: 'sator-user-store',
      partialize: (state) => ({
        profile: state.profile,
        tokens: state.tokens,
        preferences: state.preferences,
        social: {
          following: state.social.following,
          blockedUsers: state.social.blockedUsers,
        },
      }),
    }
  )
);

// Selectors
export const selectTokenBalance = (state: UserStore) => state.tokens.balance;
export const selectCanClaimDaily = (state: UserStore) => {
  if (!state.tokens.nextClaimAvailable) return true;
  return new Date() >= new Date(state.tokens.nextClaimAvailable);
};
export const selectIsFollowing = (userId: string) => (state: UserStore) =>
  state.social.following.includes(userId);

export default useUserStore;
