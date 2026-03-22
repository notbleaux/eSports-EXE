/**
 * InstallPrompt Component - PWA Installation Banner
 * [Ver001.000] - Custom PWA install prompt
 * 
 * Features:
 * - Shows when beforeinstallprompt fires
 * - App preview with icon and description
 * - Install and dismiss actions
 * - Uses usePWA hook for state management
 * - Animated entrance/exit
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Zap, Smartphone, Wifi, Shield } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface InstallPromptProps {
  /** Delay before showing prompt (ms) */
  delay?: number;
  /** Whether to show the prompt */
  forceShow?: boolean;
  /** Callback when prompt is dismissed */
  onDismiss?: () => void;
  /** Callback when app is installed */
  onInstall?: () => void;
}

interface Feature {
  icon: React.ElementType;
  text: string;
}

const FEATURES: Feature[] = [
  { icon: Smartphone, text: 'Native app experience' },
  { icon: Wifi, text: 'Works offline' },
  { icon: Shield, text: 'Secure & fast' },
];

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  delay = 2000,
  forceShow = false,
  onDismiss,
  onInstall,
}) => {
  const { canInstall, isInstalled, promptInstall, dismissInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check localStorage for previous dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    if (dismissedTime && Date.now() - dismissedTime < oneWeek) {
      setIsDismissed(true);
    }
  }, []);

  // Show prompt after delay when installable
  useEffect(() => {
    if (!canInstall || isInstalled || isDismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, isDismissed, delay]);

  // Handle forced show
  useEffect(() => {
    if (forceShow && canInstall && !isInstalled) {
      setIsVisible(true);
    }
  }, [forceShow, canInstall, isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const accepted = await promptInstall();
      
      if (accepted) {
        setIsVisible(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('[InstallPrompt] Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissInstall();
    
    // Store dismissal timestamp
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setIsDismissed(true);
    
    onDismiss?.();
  };

  // Don't render if already installed or can't install
  if (isInstalled || (!canInstall && !forceShow)) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />
          
          {/* Prompt Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-4 right-4 bottom-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50"
          >
            <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl">
              {/* Gradient background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/10 via-transparent to-[#ffd700]/10 pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
                aria-label="Dismiss install prompt"
              >
                <X size={18} />
              </button>
              
              <div className="relative p-5">
                {/* App Preview */}
                <div className="flex items-center gap-4 mb-4">
                  {/* App Icon */}
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#ffd700] flex items-center justify-center shadow-lg"
                    animate={{ 
                      boxShadow: [
                        '0 0 20px rgba(0, 212, 255, 0.3)',
                        '0 0 30px rgba(255, 215, 0, 0.3)',
                        '0 0 20px rgba(0, 212, 255, 0.3)',
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Zap className="w-8 h-8 text-[#0a0a0f]" />
                  </motion.div>
                  
                  {/* App Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">4NJZ4 Platform</h3>
                    <p className="text-sm text-white/60">TENET Esports Analytics</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-white/40">Free</span>
                      <span className="text-white/20">•</span>
                      <span className="text-xs text-[#00ff88]">No ads</span>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="flex flex-col items-center text-center p-2 rounded-lg bg-white/5"
                      >
                        <Icon size={16} className="text-[#00d4ff] mb-1" />
                        <span className="text-[10px] text-white/70 leading-tight">
                          {feature.text}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    Not now
                  </motion.button>
                  
                  <motion.button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[#0a0a0f] bg-gradient-to-r from-[#00d4ff] to-[#ffd700] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isInstalling ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <span>Installing...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Install App</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
