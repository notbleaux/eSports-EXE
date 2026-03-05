import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { getUserPreferences, saveUserPreferences } from './userPreferences';

/**
 * Progressive Disclosure Context
 * Manages which features are unlocked/revealed
 */
const ProgressiveDisclosureContext = createContext({
  unlockedFeatures: ['basic'],
  tipsSeen: [],
  unlockFeature: () => {},
  markTipSeen: () => {},
  hasSeenTip: () => false,
  isUnlocked: () => false
});

export const useProgressiveDisclosure = () => useContext(ProgressiveDisclosureContext);

/**
 * Progressive Disclosure Provider
 */
export function ProgressiveDisclosureProvider({ children }) {
  const [unlockedFeatures, setUnlockedFeatures] = useState(['basic']);
  const [tipsSeen, setTipsSeen] = useState([]);

  // Load from storage on mount
  useEffect(() => {
    const prefs = getUserPreferences();
    if (prefs.unlockedFeatures) {
      setUnlockedFeatures(prefs.unlockedFeatures);
    }
    if (prefs.tipsSeen) {
      setTipsSeen(prefs.tipsSeen);
    }
  }, []);

  // Save to storage when changed
  useEffect(() => {
    const prefs = getUserPreferences();
    saveUserPreferences({
      ...prefs,
      unlockedFeatures,
      tipsSeen
    });
  }, [unlockedFeatures, tipsSeen]);

  const unlockFeature = useCallback((feature) => {
    setUnlockedFeatures(prev => {
      if (prev.includes(feature)) return prev;
      return [...prev, feature];
    });
  }, []);

  const markTipSeen = useCallback((tipId) => {
    setTipsSeen(prev => {
      if (prev.includes(tipId)) return prev;
      return [...prev, tipId];
    });
  }, []);

  const hasSeenTip = useCallback((tipId) => {
    return tipsSeen.includes(tipId);
  }, [tipsSeen]);

  const isUnlocked = useCallback((feature) => {
    return unlockedFeatures.includes(feature);
  }, [unlockedFeatures]);

  const value = {
    unlockedFeatures,
    tipsSeen,
    unlockFeature,
    markTipSeen,
    hasSeenTip,
    isUnlocked
  };

  return (
    <ProgressiveDisclosureContext.Provider value={value}>
      {children}
    </ProgressiveDisclosureContext.Provider>
  );
}

/**
 * Feature Gate Component
 * Conditionally renders children based on unlock status
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null,
  revealAfter = 0 // milliseconds to auto-unlock
}) {
  const { isUnlocked, unlockFeature } = useProgressiveDisclosure();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (revealAfter > 0 && !isUnlocked(feature)) {
      const timer = setTimeout(() => {
        unlockFeature(feature);
      }, revealAfter);
      return () => clearTimeout(timer);
    }
  }, [feature, revealAfter, isUnlocked, unlockFeature]);

  if (isUnlocked(feature)) {
    return <>{children}></>;
  }

  return fallback || (
    <div 
      className="feature-locked"
      onMouseEnter={() => setShowHint(true)}
      onMouseLeave={() => setShowHint(false)}
    >
      <div className="locked-content">
        <span className="lock-icon">🔒</span>
        <span className="lock-text">Keep exploring to unlock</span>
      </div>
      
      {showHint && (
        <div className="unlock-hint">
          Use more features to unlock this!
        </div>
      )}

      <style jsx>{`
        .feature-locked {
          position: relative;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          text-align: center;
          cursor: help;
          transition: all 0.2s ease;
        }

        .feature-locked:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .locked-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .lock-icon {
          font-size: 1.5rem;
          opacity: 0.5;
        }

        .lock-text {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .unlock-hint {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.75rem;
          color: #9ca3af;
          white-space: nowrap;
          z-index: 10;
          animation: hintFade 0.2s ease;
        }

        @keyframes hintFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * Smart Tooltip Component
 * Context-aware help tooltips
 */
export function SmartTooltip({ 
  id,
  content, 
  children,
  position = 'top',
  showOnce = true,
  delay = 500
}) {
  const { hasSeenTip, markTipSeen } = useProgressiveDisclosure();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (showOnce && hasSeenTip(id)) {
      setHasShown(true);
    }
  }, [id, showOnce, hasSeenTip]);

  const handleMouseEnter = () => {
    if (hasShown) return;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (showOnce) {
        markTipSeen(id);
        setHasShown(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className="smart-tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && content && (
        <div className={`smart-tooltip ${position}`}>
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}

      <style jsx>{`
        .smart-tooltip-wrapper {
          position: relative;
          display: inline-block;
        }

        .smart-tooltip {
          position: absolute;
          padding: 0.625rem 0.875rem;
          background: rgba(0, 0, 0, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #e8e6e3;
          white-space: nowrap;
          z-index: 100;
          animation: tooltipIn 0.2s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .smart-tooltip.top {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        }

        .smart-tooltip.bottom {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        }

        .smart-tooltip.left {
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        }

        .smart-tooltip.right {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        }

        .tooltip-arrow {
          position: absolute;
          width: 8px;
          height: 8px;
          background: inherit;
          border: inherit;
        }

        .smart-tooltip.top .tooltip-arrow {
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-top: none;
          border-left: none;
        }

        .smart-tooltip.bottom .tooltip-arrow {
          top: -5px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-bottom: none;
          border-right: none;
        }
      `}</style>
    </div>
  );
}

/**
 * Tutorial Overlay Component
 * Step-by-step guided tour
 */
export function TutorialOverlay({ steps, onComplete, isOpen }) {
  const [currentStep, setCurrentStep] = useState(0);
  const { markTipSeen } = useProgressiveDisclosure();

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      markTipSeen('tutorial_complete');
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    markTipSeen('tutorial_complete');
    onComplete?.();
  };

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-backdrop" />
      
      <div className="tutorial-card">
        <div className="tutorial-header">
          <span className="tutorial-step">Step {currentStep + 1} of {steps.length}</span>
          <button className="tutorial-skip" onClick={handleSkip}>Skip</button>
        </div>
        
        <div className="tutorial-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(step.content) }}
        />
        
        <div className="tutorial-progress">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`progress-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>
        
        <button className="tutorial-next" onClick={handleNext}>
          {isLast ? 'Get Started ✨' : 'Next →'}
        </button>
      </div>

      <style jsx>{`
        .tutorial-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tutorial-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
        }

        .tutorial-card {
          position: relative;
          background: #1a1a24;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          animation: cardIn 0.4s ease;
        }

        @keyframes cardIn {
          from { 
            opacity: 0; 
            transform: scale(0.95) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }

        .tutorial-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .tutorial-step {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tutorial-skip {
          background: transparent;
          border: none;
          color: #6b7280;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .tutorial-skip:hover {
          color: #e8e6e3;
        }

        .tutorial-content {
          font-size: 1rem;
          color: #e8e6e3;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .tutorial-content strong {
          color: #00f0ff;
        }

        .tutorial-progress {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .progress-dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .progress-dot.active {
          background: #00f0ff;
          transform: scale(1.2);
        }

        .progress-dot.completed {
          background: #10b981;
        }

        .tutorial-next {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #ff9f1c, #f59e0b);
          border: none;
          border-radius: 8px;
          color: #0a0a0f;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tutorial-next:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 159, 28, 0.3);
        }
      `}</style>
    </div>
  );
}
