/** [Ver001.000] */
/**
 * Two-Factor Verification Component
 * =================================
 * Handles TOTP code verification during login.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTENETStore } from '../../store';

// ============================================================================
// Types
// ============================================================================

export interface TwoFactorVerifyProps {
  /** Temporary token from initial login */
  tempToken: string;
  /** Called when 2FA verification succeeds */
  onSuccess: (tokens: { accessToken: string; refreshToken: string }) => void;
  /** Called when user wants to cancel */
  onCancel?: () => void;
  /** Called when verification fails */
  onError?: (error: string) => void;
  /** API base URL */
  apiUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  tempToken,
  onSuccess,
  onCancel,
  onError,
  apiUrl = API_URL,
  className = '',
}) => {
  const { showToast } = useTENETStore();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [useBackupCode]);

  // Handle input change
  const handleChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [code]);

  // Handle key down
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter' && code.every(c => c)) {
      handleSubmit();
    }
  }, [code]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    const newCode = [...code];
    pasted.split('').forEach((digit, i) => {
      if (i < 6) newCode[i] = digit;
    });
    setCode(newCode);

    // Focus appropriate input
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }, [code]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6 && !useBackupCode) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (fullCode.length < 6 && useBackupCode) {
      setError('Please enter a valid backup code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temp_token: tempToken,
          code: fullCode,
          is_backup_code: useBackupCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Verification failed');
      }

      const data = await response.json();
      
      showToast({
        type: 'success',
        title: 'Welcome!',
        message: 'Successfully authenticated',
        read: false,
      });

      onSuccess({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      onError?.(message);
      
      // Clear code on error
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [code, tempToken, useBackupCode, apiUrl, onSuccess, onError, showToast]);

  // Styles
  const containerStyles: React.CSSProperties = {
    maxWidth: '360px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: '#FFFFFF',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '0.5rem',
    color: '#111827',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: '1.5rem',
  };

  const inputsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  };

  const inputStyles: React.CSSProperties = {
    width: '3rem',
    height: '3.5rem',
    fontSize: '1.5rem',
    fontWeight: 600,
    textAlign: 'center',
    border: `2px solid ${error ? '#EF4444' : '#E5E7EB'}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    transition: 'all 0.2s ease',
    marginBottom: '1rem',
  };

  const toggleStyles: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.5rem',
    fontSize: '0.875rem',
    color: '#6B7280',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'underline',
  };

  return (
    <div className={className} style={containerStyles}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 1rem',
          backgroundColor: '#DBEAFE',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
        }}>
          🔐
        </div>
        <h2 style={titleStyles}>
          {useBackupCode ? 'Enter Backup Code' : 'Two-Factor Authentication'}
        </h2>
        <p style={subtitleStyles}>
          {useBackupCode 
            ? 'Enter one of your backup codes to sign in'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      <div style={inputsContainerStyles}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            style={{
              ...inputStyles,
              borderColor: error ? '#EF4444' : digit ? '#3B82F6' : '#E5E7EB',
              backgroundColor: digit ? '#EFF6FF' : '#FFFFFF',
            }}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <p style={{
          color: '#EF4444',
          fontSize: '0.875rem',
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || code.some(c => !c)}
        style={buttonStyles}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '1rem',
              height: '1rem',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#FFFFFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Verifying...
          </span>
        ) : (
          'Verify'
        )}
      </button>

      <button
        onClick={() => {
          setUseBackupCode(!useBackupCode);
          setCode(Array(6).fill(''));
          setError(null);
        }}
        style={toggleStyles}
      >
        {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            ...toggleStyles,
            marginTop: '0.5rem',
          }}
        >
          Cancel
        </button>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TwoFactorVerify;
