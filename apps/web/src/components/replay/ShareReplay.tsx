/**
 * Share Replay Component
 * Share stored replays with link generation and permission settings
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-E
 * Team: Replay 2.0 Core (TL-S2)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Share2, 
  Link, 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  Eye, 
  Facebook, 
  Twitter, 
  MessageCircle,
  X,
  Clock,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ReplayMetadata } from '@/lib/replay/storage/indexeddb';

// ============================================================================
// Utility Functions
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Types
// ============================================================================

export type SharePermission = 'public' | 'unlisted' | 'private';

export interface ShareConfig {
  permission: SharePermission;
  expiresIn: number | null; // hours, null = never
  allowDownload: boolean;
  allowComments: boolean;
  password?: string;
}

export interface ShareLink {
  id: string;
  url: string;
  shortUrl?: string;
  config: ShareConfig;
  createdAt: number;
  expiresAt?: number;
  views: number;
  maxViews?: number;
}

export interface ShareReplayProps {
  replayId: string;
  metadata: ReplayMetadata;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (link: ShareLink) => void;
  className?: string;
}

// ============================================================================
// API Functions (Mock - replace with actual API calls)
// ============================================================================

async function createShareLink(
  replayId: string,
  config: ShareConfig
): Promise<ShareLink> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/replays/${replayId}/share`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(config),
  // });
  // return response.json();
  
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `share-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      resolve({
        id,
        url: `https://4njz4.app/replay/${replayId}?share=${id}`,
        shortUrl: `https://4njz.app/s/${id.slice(-8)}`,
        config,
        createdAt: Date.now(),
        expiresAt: config.expiresIn ? Date.now() + config.expiresIn * 3600000 : undefined,
        views: 0,
      });
    }, 500);
  });
}

async function revokeShareLink(shareId: string): Promise<boolean> {
  // TODO: Replace with actual API call
  console.log('Revoking share link:', shareId);
  return true;
}

// ============================================================================
// Components
// ============================================================================

export function ShareReplay({
  replayId,
  metadata,
  isOpen,
  onClose,
  onShare,
  className,
}: ShareReplayProps) {
  // State
  const [config, setConfig] = useState<ShareConfig>({
    permission: 'unlisted',
    expiresIn: null,
    allowDownload: true,
    allowComments: false,
  });
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeLinks, setActiveLinks] = useState<ShareLink[]>([]);
  
  // Load existing share links
  useEffect(() => {
    if (isOpen) {
      // TODO: Fetch existing share links for this replay
      setActiveLinks([]);
      setShareLink(null);
    }
  }, [isOpen, replayId]);
  
  // Create share link
  const handleCreateLink = async () => {
    setLoading(true);
    try {
      const link = await createShareLink(replayId, config);
      setShareLink(link);
      setActiveLinks(prev => [link, ...prev]);
      onShare?.(link);
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  // Share to social media
  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'reddit') => {
    const url = shareLink?.shortUrl || shareLink?.url || '';
    const text = `Check out this ${metadata.gameType} replay on ${metadata.mapName}!`;
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };
  
  // Revoke link
  const handleRevoke = async (linkId: string) => {
    const success = await revokeShareLink(linkId);
    if (success) {
      setActiveLinks(prev => prev.filter(l => l.id !== linkId));
      if (shareLink?.id === linkId) {
        setShareLink(null);
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-lg bg-gray-900 rounded-xl shadow-2xl overflow-hidden',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Share Replay</h2>
              <p className="text-sm text-gray-400">
                {metadata.mapName} • {formatDate(metadata.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Permission selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Who can view</label>
            <div className="grid grid-cols-3 gap-2">
              <PermissionOption
                icon={<Globe className="w-4 h-4" />}
                title="Public"
                description="Anyone can view"
                selected={config.permission === 'public'}
                onClick={() => setConfig(c => ({ ...c, permission: 'public' }))}
              />
              <PermissionOption
                icon={<Eye className="w-4 h-4" />}
                title="Unlisted"
                description="Anyone with link"
                selected={config.permission === 'unlisted'}
                onClick={() => setConfig(c => ({ ...c, permission: 'unlisted' }))}
              />
              <PermissionOption
                icon={<Lock className="w-4 h-4" />}
                title="Private"
                description="Only you"
                selected={config.permission === 'private'}
                onClick={() => setConfig(c => ({ ...c, permission: 'private' }))}
              />
            </div>
          </div>
          
          {/* Expiration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Link expires</label>
            <div className="flex flex-wrap gap-2">
              {[null, 1, 24, 168, 720].map((hours) => (
                <button
                  key={hours ?? 'never'}
                  onClick={() => setConfig(c => ({ ...c, expiresIn: hours }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    config.expiresIn === hours
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {hours === null && 'Never'}
                  {hours === 1 && '1 hour'}
                  {hours === 24 && '24 hours'}
                  {hours === 168 && '7 days'}
                  {hours === 720 && '30 days'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Advanced options */}
          <div className="space-y-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} />
              Advanced options
            </button>
            
            {showAdvanced && (
              <div className="p-3 bg-gray-800 rounded-lg space-y-3">
                {/* Allow download */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Allow download</span>
                  <input
                    type="checkbox"
                    checked={config.allowDownload}
                    onChange={(e) => setConfig(c => ({ ...c, allowDownload: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                
                {/* Allow comments */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Allow comments</span>
                  <input
                    type="checkbox"
                    checked={config.allowComments}
                    onChange={(e) => setConfig(c => ({ ...c, allowComments: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                
                {/* Password protection (for private) */}
                {config.permission === 'private' && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Password protection</label>
                    <input
                      type="password"
                      placeholder="Set password (optional)"
                      value={config.password || ''}
                      onChange={(e) => setConfig(c => ({ ...c, password: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Create link button */}
          {!shareLink && (
            <button
              onClick={handleCreateLink}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating link...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  Create share link
                </>
              )}
            </button>
          )}
          
          {/* Share link display */}
          {shareLink && (
            <div className="space-y-3">
              <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Link created!</span>
                </div>
                
                {/* URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink.shortUrl || shareLink.url}
                      className="flex-1 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white text-sm"
                    />
                    <button
                      onClick={() => handleCopy(shareLink.shortUrl || shareLink.url)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {shareLink.shortUrl && (
                    <div className="text-xs text-gray-500">
                      Full URL: {shareLink.url}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Social share */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Share to:</span>
                <SocialButton
                  icon={<Twitter className="w-4 h-4" />}
                  label="Twitter"
                  onClick={() => handleSocialShare('twitter')}
                  color="hover:bg-blue-500/20 hover:text-blue-400"
                />
                <SocialButton
                  icon={<Facebook className="w-4 h-4" />}
                  label="Facebook"
                  onClick={() => handleSocialShare('facebook')}
                  color="hover:bg-blue-600/20 hover:text-blue-500"
                />
                <SocialButton
                  icon={<MessageCircle className="w-4 h-4" />}
                  label="Reddit"
                  onClick={() => handleSocialShare('reddit')}
                  color="hover:bg-orange-500/20 hover:text-orange-400"
                />
              </div>
            </div>
          )}
          
          {/* Active links */}
          {activeLinks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Active links</h3>
              <div className="space-y-2">
                {activeLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-gray-300 truncate">
                        <Link className="w-3 h-3" />
                        {link.shortUrl || link.url}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="capitalize">{link.config.permission}</span>
                        {link.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires {formatDate(link.expiresAt)}
                          </span>
                        )}
                        <span>{link.views} views</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(link.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/30">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Shared replays are subject to our Terms of Service. 
              Do not share content that violates copyright or contains harmful material.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface PermissionOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function PermissionOption({ icon, title, description, selected, onClick }: PermissionOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      )}
    >
      <div className={cn(
        'p-2 rounded-lg',
        selected ? 'text-blue-400' : 'text-gray-400'
      )}>
        {icon}
      </div>
      <div className="text-center">
        <div className={cn(
          'text-sm font-medium',
          selected ? 'text-blue-400' : 'text-gray-300'
        )}>
          {title}
        </div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </button>
  );
}

interface SocialButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

function SocialButton({ icon, label, onClick, color }: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 bg-gray-800 rounded-lg text-gray-400 transition-colors',
        color
      )}
      title={label}
    >
      {icon}
    </button>
  );
}

export default ShareReplay;
