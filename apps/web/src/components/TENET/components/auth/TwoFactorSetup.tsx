/** [Ver001.000] */
/**
 * Two-Factor Setup Component
 * ==========================
 * Handles TOTP 2FA setup flow with QR code and backup codes.
 */

import React, { useState, useCallback } from 'react';
import { useTENETStore } from '../../store';

// ============================================================================
// Types
// ============================================================================

export interface TwoFactorSetupProps {
  /** Called when setup is complete */
  onComplete?: (backupCodes: string[]) => void;
  /** Called when setup is cancelled */
  onCancel?: () => void;
  /** API base URL */
  apiUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface SetupState {
  step: 'loading' | 'qr' | 'verify' | 'backup' | 'complete';
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  error?: string;
}

// ============================================================================
// Component
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onComplete,
  onCancel,
  apiUrl = API_URL,
  className = '',
}) => {
  const { authToken, showToast } = useTENETStore();
  const [state, setState] = useState<SetupState>({ step: 'loading' });
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Initialize 2FA setup
  React.useEffect(() => {
    const initSetup = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/auth/2fa/setup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to initialize 2FA setup');
        }

        const data = await response.json();
        setState({
          step: 'qr',
          secret: data.secret,
          qrCode: data.qr_code,
        });
      } catch (err) {
        setState({
          step: 'qr',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    initSetup();
  }, [apiUrl, authToken]);

  // Handle verification code submit
  const handleVerify = useCallback(async () => {
    if (verificationCode.length !== 6) return;

    setState((prev) => ({ ...prev, step: 'loading' }));

    try {
      const response = await fetch(`${apiUrl}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verification_code: verificationCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Invalid verification code');
      }

      const data = await response.json();
      setState({
        step: 'backup',
        backupCodes: data.backup_codes,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: 'verify',
        error: err instanceof Error ? err.message : 'Verification failed',
      }));
      showToast({
        type: 'error',
        title: 'Verification Failed',
        message: err instanceof Error ? err.message : 'Invalid code',
        read: false,
      });
    }
  }, [verificationCode, apiUrl, authToken, showToast]);

  // Copy backup codes to clipboard
  const copyBackupCodes = useCallback(() => {
    if (!state.backupCodes) return;
    
    navigator.clipboard.writeText(state.backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
    showToast({
      type: 'success',
      title: 'Copied!',
      message: 'Backup codes copied to clipboard',
      read: false,
    });
  }, [state.backupCodes, showToast]);

  // Download backup codes
  const downloadBackupCodes = useCallback(() => {
    if (!state.backupCodes) return;

    const content = [
      'SATOR Platform - Two-Factor Authentication Backup Codes',
      '=====================================================',
      '',
      'Generated: ' + new Date().toLocaleString(),
      '',
      'Store these codes in a safe place. Each code can only be used once.',
      '',
      ...state.backupCodes,
      '',
      '=====================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sator-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.backupCodes]);

  // Complete setup
  const handleComplete = useCallback(() => {
    setState({ step: 'complete' });
    onComplete?.(state.backupCodes || []);
    showToast({
      type: 'success',
      title: '2FA Enabled',
      message: 'Two-factor authentication is now active',
      read: false,
    });
  }, [state.backupCodes, onComplete, showToast]);

  // Styles
  const containerStyles: React.CSSProperties = {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '1.5rem',
    backgroundColor: '#FFFFFF',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: '#111827',
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  };

  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
  };

  const primaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: '#F3F4F6',
    color: '#374151',
  };

  // Loading state
  if (state.step === 'loading') {
    return (
      <div className={className} style={{ ...containerStyles, textAlign: 'center', padding: '3rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <p style={{ color: '#6B7280' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (state.error && state.step === 'qr') {
    return (
      <div className={className} style={{ ...containerStyles, textAlign: 'center' }}>
        <div style={{ color: '#EF4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={titleStyles}>Setup Failed</h2>
        <p style={{ ...descriptionStyles, color: '#EF4444' }}>{state.error}</p>
        <button
          onClick={onCancel}
          style={secondaryButtonStyles}
        >
          Go Back
        </button>
      </div>
    );
  }

  // QR Code step
  if (state.step === 'qr') {
    return (
      <div className={className} style={containerStyles}>
        <h2 style={titleStyles}>Set Up Two-Factor Authentication</h2>
        <p style={descriptionStyles}>
          Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
        </p>

        {state.qrCode && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img
              data-testid="2fa-qr-code"
              src={state.qrCode}
              alt="2FA QR Code"
              style={{
                maxWidth: '200px',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                padding: '0.5rem',
              }}
            />
          </div>
        )}

        <div style={{
          backgroundColor: '#F9FAFB',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
            Manual entry key (if QR doesn't work):
          </p>
          <code
            data-testid="2fa-secret"
            style={{
              display: 'block',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              wordBreak: 'break-all',
              backgroundColor: '#E5E7EB',
              padding: '0.5rem',
              borderRadius: '0.25rem',
            }}
          >
            {state.secret}
          </code>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{ ...secondaryButtonStyles, flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={() => setState((prev) => ({ ...prev, step: 'verify' }))}
            style={{ ...primaryButtonStyles, flex: 1 }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Verification step
  if (state.step === 'verify') {
    return (
      <div className={className} style={containerStyles}>
        <h2 style={titleStyles}>Verify Code</h2>
        <p style={descriptionStyles}>
          Enter the 6-digit code from your authenticator app to confirm setup
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            data-testid="totp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.5rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              border: state.error ? '2px solid #EF4444' : '2px solid #E5E7EB',
              borderRadius: '0.5rem',
              outline: 'none',
            }}
            autoFocus
          />
          {state.error && (
            <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {state.error}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setState((prev) => ({ ...prev, step: 'qr', error: undefined }))}
            style={{ ...secondaryButtonStyles, flex: 1 }}
          >
            Back
          </button>
          <button
            onClick={handleVerify}
            disabled={verificationCode.length !== 6}
            style={{
              ...primaryButtonStyles,
              flex: 1,
              opacity: verificationCode.length !== 6 ? 0.5 : 1,
              cursor: verificationCode.length !== 6 ? 'not-allowed' : 'pointer',
            }}
          >
            Verify & Enable
          </button>
        </div>
      </div>
    );
  }

  // Backup codes step
  if (state.step === 'backup' && state.backupCodes) {
    return (
      <div className={className} style={containerStyles}>
        <h2 style={titleStyles}>Save Backup Codes</h2>
        <p style={{ ...descriptionStyles, color: '#DC2626' }}>
          <strong>Important:</strong> Save these backup codes in a secure location. 
          Each code can only be used once. If you lose access to your authenticator app, 
          these codes are the only way to access your account.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#F9FAFB',
          borderRadius: '0.5rem',
          border: '1px solid #E5E7EB',
        }}>
          {state.backupCodes.map((code, index) => (
            <code
              key={index}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                padding: '0.5rem',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '0.25rem',
                border: '1px dashed #D1D5DB',
              }}
            >
              {code}
            </code>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            data-testid="copy-backup-codes"
            onClick={copyBackupCodes}
            style={{ ...secondaryButtonStyles, flex: 1 }}
          >
            {copiedCodes ? 'Copied!' : 'Copy Codes'}
          </button>
          <button
            onClick={downloadBackupCodes}
            style={{ ...secondaryButtonStyles, flex: 1 }}
          >
            Download
          </button>
        </div>

        <button
          onClick={handleComplete}
          style={{ ...primaryButtonStyles, width: '100%' }}
        >
          I've Saved My Backup Codes
        </button>
      </div>
    );
  }

  // Complete step
  if (state.step === 'complete') {
    return (
      <div className={className} style={{ ...containerStyles, textAlign: 'center' }}>
        <div style={{ color: '#22C55E', fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
        <h2 style={titleStyles}>2FA Enabled!</h2>
        <p style={descriptionStyles}>
          Your account is now protected with two-factor authentication.
        </p>
        <button
          onClick={onCancel}
          style={primaryButtonStyles}
        >
          Done
        </button>
      </div>
    );
  }

  return null;
};

export default TwoFactorSetup;
