// @ts-nocheck
/**
 * FeatureFlagProvider Component
 * 
 * Provides feature flag context and enables runtime feature toggling.
 * Includes a debug panel for development.
 * 
 * [Ver001.000]
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { FeatureFlags } from '@/config/features';
import { getFeatureFlags, setFeatureOverride, resetFeatureOverrides, featureDescriptions } from '@/config/features';

interface FeatureFlagContextValue {
  flags: FeatureFlags;
  isEnabled: (feature: keyof FeatureFlags) => boolean;
  toggleFeature: (feature: keyof FeatureFlags) => void;
  resetFeatures: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

export const useFeatureFlagContext = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within FeatureFlagProvider');
  }
  return context;
};

interface FeatureFlagProviderProps {
  children: React.ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());
  
  const _isEnabled = useCallback((feature: keyof FeatureFlags): boolean => {
    return flags[feature] ?? false;
  }, [flags]);
  
  const toggleFeature = useCallback((feature: keyof FeatureFlags) => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Feature toggling only allowed in development');
      return;
    }
    
    const newValue = !flags[feature];
    setFeatureOverride(feature, newValue);
    setFlags(getFeatureFlags());
  }, [flags]);
  
  const resetFeatures = useCallback(() => {
    resetFeatureOverrides();
    setFlags(getFeatureFlags());
  }, []);
  
  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, toggleFeature, resetFeatures }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

// Debug panel for development
export const FeatureFlagDebugPanel: React.FC = () => {
  const { flags, isEnabled, toggleFeature, resetFeatures } = useFeatureFlagContext();
  const [isOpen, setIsOpen] = useState(false);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const featuresByCategory = Object.entries(flags).reduce((acc, [key, value]) => {
    const category = key.split('.')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key: key as keyof FeatureFlags, value });
    return acc;
  }, {} as Record<string, { key: keyof FeatureFlags; value: boolean }[]>);
  
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
      >
        🚩 Features
      </button>
      
      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-96 max-h-[80vh] overflow-auto bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Feature Flags</h3>
            <button
              onClick={resetFeatures}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Reset All
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {Object.entries(featuresByCategory).map(([category, features]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  {features.map(({ key, value }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-2 bg-gray-800 rounded hover:bg-gray-750 cursor-pointer"
                    >
                      <div className="flex-1 mr-4">
                        <div className="text-sm text-white">{key}</div>
                        <div className="text-xs text-gray-500">
                          {featureDescriptions[key]}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleFeature(key)}
                        className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureFlagProvider;
