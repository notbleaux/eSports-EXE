/** [Ver001.000] */
/**
 * OAuth Buttons Component
 * =======================
 * Discord, Google, GitHub OAuth login buttons.
 */

import React from 'react';
import { useTENETStore } from '../../store';

// ============================================================================
// Types
// ============================================================================

export interface OAuthButtonsProps {
  /** Called when OAuth flow is initiated */
  onOAuthStart?: (provider: OAuthProvider) => void;
  /** Called when OAuth flow completes successfully */
  onOAuthSuccess?: (provider: OAuthProvider, tokens: OAuthTokens) => void;
  /** Called when OAuth flow fails */
  onOAuthError?: (provider: OAuthProvider, error: string) => void;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Additional CSS classes */
  className?: string;
  /** Custom redirect URL after OAuth */
  redirectUrl?: string;
}

export type OAuthProvider = 'discord' | 'google' | 'github';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// SVG Icons
// ============================================================================

const DiscordIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const GoogleIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1C5.925 1 1 5.925 1 12c0 4.867 3.149 8.993 7.521 10.447.55.099.748-.238.748-.53 0-.261-.009-.953-.014-1.872-3.053.664-3.698-1.47-3.698-1.47-.5-1.27-1.22-1.609-1.22-1.609-.998-.682.076-.668.076-.668 1.103.078 1.683 1.132 1.683 1.132.98 1.68 2.571 1.195 3.199.914.099-.71.383-1.195.697-1.47-2.438-.277-5-1.22-5-5.43 0-1.2.428-2.183 1.132-2.95-.114-.278-.491-1.397.107-2.91 0 0 .92-.295 3.013 1.127a10.524 10.524 0 0 1 2.755-.371 10.52 10.52 0 0 1 2.754.37c2.092-1.422 3.012-1.126 3.012-1.126.599 1.512.222 2.631.108 2.91.703.766 1.131 1.748 1.131 2.949 0 4.22-2.563 5.15-5.005 5.423.393.338.743 1.003.743 2.022 0 1.46-.014 2.637-.014 2.996 0 .293.198.633.748.531C19.852 20.99 23 16.865 23 12c0-6.075-4.925-11-11-11z"/>
  </svg>
);

// ============================================================================
// Provider Configurations
// ============================================================================

const PROVIDER_CONFIG: Record<OAuthProvider, {
  name: string;
  icon: React.FC<{ className?: string }>;
  bgColor: string;
  hoverBgColor: string;
  textColor: string;
  borderColor?: string;
}> = {
  discord: {
    name: 'Discord',
    icon: DiscordIcon,
    bgColor: '#5865F2',
    hoverBgColor: '#4752C4',
    textColor: '#FFFFFF',
  },
  google: {
    name: 'Google',
    icon: GoogleIcon,
    bgColor: '#FFFFFF',
    hoverBgColor: '#F9FAFB',
    textColor: '#374151',
    borderColor: '#E5E7EB',
  },
  github: {
    name: 'GitHub',
    icon: GitHubIcon,
    bgColor: '#24292F',
    hoverBgColor: '#1A1E22',
    textColor: '#FFFFFF',
  },
};

// ============================================================================
// Component
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onOAuthStart,
  onOAuthSuccess,
  onOAuthError,
  size = 'md',
  direction = 'vertical',
  className = '',
  redirectUrl,
}) => {
  const { showToast } = useTENETStore();

  // Size configurations
  const sizeConfig = {
    sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem', iconSize: '1rem' },
    md: { height: '2.5rem', padding: '0 1rem', fontSize: '1rem', iconSize: '1.25rem' },
    lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1.125rem', iconSize: '1.5rem' },
  };

  const config = sizeConfig[size];

  // Handle OAuth click
  const handleOAuthClick = (provider: OAuthProvider) => {
    onOAuthStart?.(provider);
    
    // Build OAuth URL
    const params = new URLSearchParams();
    if (redirectUrl) {
      params.append('redirect_url', redirectUrl);
    }
    
    const oauthUrl = `${API_URL}/api/auth/oauth/${provider}/login${params.toString() ? '?' + params.toString() : ''}`;
    
    // For popup flow
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      oauthUrl,
      `oauth_${provider}`,
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    if (!popup) {
      showToast({
        type: 'error',
        title: 'Popup Blocked',
        message: 'Please allow popups for OAuth authentication',
        read: false,
      });
      onOAuthError?.(provider, 'Popup blocked');
      return;
    }

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, provider: msgProvider, tokens, error } = event.data;
      
      if (type === 'OAUTH_CALLBACK') {
        window.removeEventListener('message', handleMessage);
        
        if (error) {
          showToast({
            type: 'error',
            title: 'Authentication Failed',
            message: error,
            read: false,
          });
          onOAuthError?.(msgProvider as OAuthProvider, error);
        } else if (tokens) {
          showToast({
            type: 'success',
            title: 'Welcome!',
            message: `Successfully signed in with ${msgProvider}`,
            read: false,
          });
          onOAuthSuccess?.(msgProvider as OAuthProvider, tokens);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap: '0.75rem',
    width: '100%',
  };

  return (
    <div className={className} style={containerStyles}>
      {(Object.keys(PROVIDER_CONFIG) as OAuthProvider[]).map((provider) => {
        const providerConfig = PROVIDER_CONFIG[provider];
        const Icon = providerConfig.icon;
        
        return (
          <button
            key={provider}
            data-testid={`${provider}-oauth-button`}
            onClick={() => handleOAuthClick(provider)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              height: config.height,
              padding: config.padding,
              fontSize: config.fontSize,
              fontWeight: 500,
              backgroundColor: providerConfig.bgColor,
              color: providerConfig.textColor,
              border: providerConfig.borderColor ? `1px solid ${providerConfig.borderColor}` : 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: direction === 'vertical' ? '100%' : 'auto',
              flex: direction === 'horizontal' ? 1 : undefined,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = providerConfig.hoverBgColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = providerConfig.bgColor;
            }}
            type="button"
            aria-label={`Sign in with ${providerConfig.name}`}
          >
            <span style={{ width: config.iconSize, height: config.iconSize, flexShrink: 0, display: 'flex' }}>
              <Icon />
            </span>
            <span>Continue with {providerConfig.name}</span>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// Individual OAuth Button
// ============================================================================

export interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onClick,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const config = PROVIDER_CONFIG[provider];
  
  const Icon = config.icon;
  
  const sizeConfig = {
    sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem', iconSize: '1rem' },
    md: { height: '2.5rem', padding: '0 1rem', fontSize: '1rem', iconSize: '1.25rem' },
    lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1.125rem', iconSize: '1.5rem' },
  };
  
  const s = sizeConfig[size];
  
  return (
    <button
      data-testid={`${provider}-oauth-button`}
      onClick={onClick}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 500,
        backgroundColor: config.bgColor,
        color: config.textColor,
        border: config.borderColor ? `1px solid ${config.borderColor}` : 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = config.hoverBgColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = config.bgColor;
      }}
      type="button"
      aria-label={`Sign in with ${config.name}`}
    >
      <span style={{ width: s.iconSize, height: s.iconSize, flexShrink: 0, display: 'flex' }}>
        <Icon />
      </span>
      <span>Continue with {config.name}</span>
    </button>
  );
};

export default OAuthButtons;
