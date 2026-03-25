/**
 * useAuth — OAuth authentication hook
 * Handles Google + Discord OAuth flows for NJZiteGeisTe Platform.
 * [Ver001.000]
 */
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  provider: 'google' | 'discord' | null;
}

export interface OAuthProvider {
  provider: string;
  configured: boolean;
  login_url: string;
}

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'njz_auth_token';
const USER_KEY = 'njz_auth_user';

// ============================================================================
// HELPERS
// ============================================================================

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/v1').replace(/\/v1$/, '');

function buildOAuthUrl(provider: 'google' | 'discord', redirectTo = '/'): string {
  const params = new URLSearchParams({ redirect_to: redirectTo });
  return `${API_BASE}/v1/oauth/${provider}/login?${params.toString()}`;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now();
}

// ============================================================================
// HOOK
// ============================================================================

interface UseAuthReturn {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  providers: OAuthProvider[];
  loadingProviders: boolean;
  loginWithGoogle: (redirectTo?: string) => void;
  loginWithDiscord: (redirectTo?: string) => void;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && !isTokenExpired(stored)) return stored;
    localStorage.removeItem(STORAGE_KEY);
    return null;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Handle OAuth callback tokens injected into URL by the API redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');
    const accessToken = params.get('access_token');

    if (oauthStatus === 'success' && accessToken) {
      localStorage.setItem(STORAGE_KEY, accessToken);
      setToken(accessToken);

      // Derive user from JWT payload
      const payload = parseJwtPayload(accessToken);
      if (payload) {
        const authUser: AuthUser = {
          id: (payload.sub as string) ?? '',
          username: (payload.username as string) ?? '',
          email: (payload.email as string) ?? null,
          avatarUrl: (payload.avatar_url as string) ?? null,
          provider: null,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        setUser(authUser);
      }

      // Clean up URL
      const clean = new URL(window.location.href);
      clean.searchParams.delete('oauth');
      clean.searchParams.delete('access_token');
      clean.searchParams.delete('refresh_token');
      window.history.replaceState({}, '', clean.pathname + clean.search);
    }
  }, []);

  // Fetch available providers
  useEffect(() => {
    setLoadingProviders(true);
    fetch(`${API_BASE}/v1/oauth/providers`)
      .then(r => r.json())
      .then((data: OAuthProvider[]) => setProviders(data))
      .catch(() => {
        // Fallback: assume both providers exist in dev
        setProviders([
          { provider: 'google', configured: false, login_url: '/v1/oauth/google/login' },
          { provider: 'discord', configured: false, login_url: '/v1/oauth/discord/login' },
        ]);
      })
      .finally(() => setLoadingProviders(false));
  }, []);

  const loginWithGoogle = useCallback((redirectTo = '/') => {
    window.location.href = buildOAuthUrl('google', redirectTo);
  }, []);

  const loginWithDiscord = useCallback((redirectTo = '/') => {
    window.location.href = buildOAuthUrl('discord', redirectTo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token,
    providers,
    loadingProviders,
    loginWithGoogle,
    loginWithDiscord,
    logout,
  };
}
