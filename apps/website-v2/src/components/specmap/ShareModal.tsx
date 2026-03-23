/**
 * Share Modal Component
 * Share destination selection and options
 * [Ver001.000]
 */

import { useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import type { ShareDestination, ShareOptions } from '../../lib/export/types';
import { shareExport, getShareConfig } from '../../lib/export/share';
import {
  X,
  Twitter,
  MessageCircle,
  Link,
  Download,
  Cloud,
  Globe,
  Eye,
  EyeOff,
  Lock,
  Check,
  Loader2,
} from 'lucide-react';

export interface ShareModalProps {
  /** Export blob to share */
  blob: Blob;
  /** Export filename */
  filename: string;
  /** Export ID */
  exportId: string;
  /** Called when share is complete */
  onShare?: (result: { success: boolean; url?: string }) => void;
  /** Called when modal is closed */
  onClose: () => void;
  /** Whether modal is open */
  isOpen: boolean;
  /** Optional custom message */
  defaultMessage?: string;
}

interface ShareOption {
  destination: ShareDestination;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    destination: 'twitter',
    icon: <Twitter className="w-5 h-5" />,
    label: 'Twitter/X',
    description: 'Share on social media',
    color: 'bg-sky-500',
  },
  {
    destination: 'discord',
    icon: <MessageCircle className="w-5 h-5" />,
    label: 'Discord',
    description: 'Share to Discord',
    color: 'bg-indigo-500',
  },
  {
    destination: 'copy',
    icon: <Link className="w-5 h-5" />,
    label: 'Copy Link',
    description: 'Copy shareable link',
    color: 'bg-emerald-500',
  },
  {
    destination: 'download',
    icon: <Download className="w-5 h-5" />,
    label: 'Download',
    description: 'Save to device',
    color: 'bg-slate-500',
  },
  {
    destination: 'cloud',
    icon: <Cloud className="w-5 h-5" />,
    label: 'Cloud',
    description: 'Upload to cloud storage',
    color: 'bg-violet-500',
  },
];

interface PrivacyOption {
  value: ShareOptions['privacy'];
  icon: React.ReactNode;
  label: string;
  description: string;
}

const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    value: 'public',
    icon: <Globe className="w-4 h-4" />,
    label: 'Public',
    description: 'Anyone with link can view',
  },
  {
    value: 'unlisted',
    icon: <Eye className="w-4 h-4" />,
    label: 'Unlisted',
    description: 'Only accessible with link',
  },
  {
    value: 'private',
    icon: <Lock className="w-4 h-4" />,
    label: 'Private',
    description: 'Only you can access',
  },
];

export function ShareModal({
  blob,
  filename,
  exportId,
  onShare,
  onClose,
  isOpen,
  defaultMessage = 'Check out this SpecMap analysis!',
}: ShareModalProps) {
  const [selectedDestination, setSelectedDestination] = useState<ShareDestination | null>(null);
  const [privacy, setPrivacy] = useState<ShareOptions['privacy']>('unlisted');
  const [message, setMessage] = useState(defaultMessage);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(
    async (destination: ShareDestination) => {
      setIsSharing(true);
      setSelectedDestination(destination);

      try {
        const result = await shareExport(
          blob,
          filename,
          {
            exportId,
            destination,
            message,
            privacy,
          },
          {
            // TODO: Get from auth context
            authToken: undefined,
          }
        );

        setShareResult(result);
        onShare?.(result);

        if (destination === 'copy' && result.success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        setShareResult({
          success: false,
          error: error instanceof Error ? error.message : 'Share failed',
        });
      } finally {
        setIsSharing(false);
      }
    },
    [blob, exportId, filename, message, onShare, privacy]
  );

  const handleDownload = useCallback(() => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShare?.({ success: true });
    onClose();
  }, [blob, filename, onClose, onShare]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Share Export</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              {blob.type.startsWith('image/') ? (
                <Cloud className="w-5 h-5 text-indigo-400" />
              ) : (
                <Cloud className="w-5 h-5 text-violet-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{filename}</p>
              <p className="text-xs text-slate-400">
                {(blob.size / 1024 / 1024).toFixed(2)} MB • {blob.type.split('/')[1]?.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Message (for social shares) */}
          {selectedDestination === 'twitter' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Add a message..."
              />
              <p className="text-xs text-slate-500 text-right">{message.length}/280</p>
            </div>
          )}

          {/* Privacy settings */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Privacy</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIVACY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPrivacy(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                    privacy === option.value
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  )}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {PRIVACY_OPTIONS.find((p) => p.value === privacy)?.description}
            </p>
          </div>

          {/* Share options */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Share to</label>
            <div className="grid grid-cols-2 gap-2">
              {SHARE_OPTIONS.map((option) => (
                <button
                  key={option.destination}
                  onClick={() =>
                    option.destination === 'download'
                      ? handleDownload()
                      : handleShare(option.destination)
                  }
                  disabled={isSharing && selectedDestination === option.destination}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                    selectedDestination === option.destination
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-white',
                      option.color
                    )}
                  >
                    {isSharing && selectedDestination === option.destination ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      option.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="text-xs text-slate-400 truncate">{option.description}</p>
                  </div>
                  {option.destination === 'copy' && copied && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Result message */}
          {shareResult && (
            <div
              className={cn(
                'p-3 rounded-lg text-sm',
                shareResult.success
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              )}
            >
              {shareResult.success
                ? shareResult.url
                  ? `Shared successfully! URL: ${shareResult.url}`
                  : 'Shared successfully!'
                : shareResult.error || 'Share failed'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-t border-slate-800">
          <p className="text-xs text-slate-500">Exports are stored for 30 days</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
