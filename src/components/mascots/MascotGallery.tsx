/**
 * MascotGallery.tsx
 * 
 * Gallery component displaying all 14 mascots (7 animals × 2 styles)
 * Features animal selector, style toggle, and variant selection
 * 
 * [Ver004.000]
 */

import React, { useState, useCallback, useMemo } from 'react';
import { MascotAssetEnhanced } from './MascotAssetEnhanced';
import { MascotStyleToggle, MascotStyleDisplay } from './MascotStyleToggle';
import { MascotStyleSelector } from './MascotStyleSelector';
import type { MascotAnimal, MascotStyle, MascotSize } from './MascotAssetEnhanced';
import { 
  MASCOT_CONFIGS, 
  getMascotsByStyle, 
  getMascotsByAnimal,
  type MascotConfig 
} from '../../../scripts/mascot-generator/config';
import { GALLERY_CONFIG } from '../../../scripts/mascot-generator/config-new-mascots';

// ===== TYPE DEFINITIONS =====

export interface MascotGalleryProps {
  /** Default selected animal */
  defaultAnimal?: MascotAnimal;
  /** Default selected style */
  defaultStyle?: MascotStyle;
  /** Callback when selection changes */
  onSelect?: (animal: MascotAnimal, style: MascotStyle, variant?: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Show style toggle */
  showStyleToggle?: boolean;
  /** Show animal selector */
  showAnimalSelector?: boolean;
  /** Show variant selectors */
  showVariantSelectors?: boolean;
  /** Display mode */
  mode?: 'all' | 'by-style' | 'by-animal';
  /** Preview size */
  previewSize?: MascotSize;
}

// ===== ANIMAL DISPLAY INFO =====

const ANIMAL_INFO: Record<MascotAnimal, { 
  label: string; 
  emoji: string;
  description: string;
}> = {
  fox: { label: 'Fox', emoji: '🦊', description: 'Street-smart and confident' },
  owl: { label: 'Owl', emoji: '🦉', description: 'Wise and thoughtful' },
  wolf: { label: 'Wolf', emoji: '🐺', description: 'Mysterious and fierce' },
  hawk: { label: 'Hawk', emoji: '🦅', description: 'Sharp and focused' },
  bear: { label: 'Bear', emoji: '🐻', description: 'Strong and dependable' },
  bunny: { label: 'Bunny', emoji: '🐰', description: 'Cute and energetic' },
  cat: { label: 'Cat', emoji: '🐱', description: 'Playful and mischievous' },
};

// ===== GRID BREAKPOINTS =====

const GRID_STYLES = {
  display: 'grid',
  gap: '24px',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
};

// ===== MASCOT CARD COMPONENT =====

interface MascotCardProps {
  config: MascotConfig;
  isSelected: boolean;
  onClick: () => void;
  previewSize: MascotSize;
  selectedVariant?: string;
  onVariantChange?: (variant: string) => void;
}

const MascotCard: React.FC<MascotCardProps> = ({
  config,
  isSelected,
  onClick,
  previewSize,
  selectedVariant,
  onVariantChange,
}) => {
  const [animation, setAnimation] = useState(config.animations[0]);

  const displayVariant = selectedVariant || config.variants?.[0];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        padding: '20px',
        borderRadius: '12px',
        border: `2px solid ${isSelected ? '#0000FF' : '#e0e0e0'}`,
        backgroundColor: isSelected ? 'rgba(0, 0, 255, 0.02)' : 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Mascot Preview */}
      <div style={{ 
        height: previewSize, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <MascotAssetEnhanced
          animal={config.animal}
          style={config.style}
          size={previewSize}
          animation={animation as any}
          variant={displayVariant}
          hoverable
        />
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>
          {ANIMAL_INFO[config.animal].label}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <MascotStyleDisplay style={config.style} size="sm" />
        </div>
      </div>

      {/* Animation Selector */}
      {config.animations.length > 1 && (
        <select
          value={animation}
          onChange={(e) => setAnimation(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          {config.animations.map(anim => (
            <option key={anim} value={anim}>
              {anim.charAt(0).toUpperCase() + anim.slice(1)}
            </option>
          ))}
        </select>
      )}

      {/* Variant Selector */}
      {config.variants && config.variants.length > 0 && onVariantChange && (
        <select
          value={displayVariant}
          onChange={(e) => onVariantChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
            maxWidth: '100%',
          }}
        >
          {config.variants.map(variant => (
            <option key={variant} value={variant}>
              {variant.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

// ===== ANIMAL SELECTOR COMPONENT =====

interface AnimalSelectorProps {
  selected: MascotAnimal | null;
  onSelect: (animal: MascotAnimal | null) => void;
}

const AnimalSelector: React.FC<AnimalSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          border: `2px solid ${selected === null ? '#0000FF' : '#ddd'}`,
          backgroundColor: selected === null ? 'rgba(0, 0, 255, 0.1)' : 'white',
          color: selected === null ? '#0000FF' : '#666',
          fontSize: '13px',
          fontWeight: selected === null ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        All Animals
      </button>
      {(Object.keys(ANIMAL_INFO) as MascotAnimal[]).map((animal) => (
        <button
          key={animal}
          onClick={() => onSelect(animal)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: `2px solid ${selected === animal ? '#0000FF' : '#ddd'}`,
            backgroundColor: selected === animal ? 'rgba(0, 0, 255, 0.1)' : 'white',
            color: selected === animal ? '#0000FF' : '#666',
            fontSize: '13px',
            fontWeight: selected === animal ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{ANIMAL_INFO[animal].emoji}</span>
          <span>{ANIMAL_INFO[animal].label}</span>
        </button>
      ))}
    </div>
  );
};

// ===== MAIN GALLERY COMPONENT =====

export const MascotGallery: React.FC<MascotGalleryProps> = ({
  defaultAnimal = null,
  defaultStyle = 'dropout',
  onSelect,
  className = '',
  showStyleToggle = true,
  showAnimalSelector = true,
  showVariantSelectors = true,
  mode = 'all',
  previewSize = GALLERY_CONFIG.defaultPreviewSize as MascotSize,
}) => {
  const [selectedAnimal, setSelectedAnimal] = useState<MascotAnimal | null>(defaultAnimal);
  const [selectedStyle, setSelectedStyle] = useState<MascotStyle>(defaultStyle);
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
  const [variantMap, setVariantMap] = useState<Record<string, string>>({});

  // Get filtered mascots
  const filteredMascots = useMemo(() => {
    let configs = [...MASCOT_CONFIGS];

    if (selectedAnimal) {
      configs = configs.filter(c => c.animal === selectedAnimal);
    }

    if (mode === 'by-style' || mode === 'all') {
      // Show both styles for each animal
    }

    return configs;
  }, [selectedAnimal, mode]);

  // Group by style for display
  const mascotsByStyle = useMemo(() => {
    return {
      dropout: filteredMascots.filter(m => m.style === 'dropout'),
      nj: filteredMascots.filter(m => m.style === 'nj'),
    };
  }, [filteredMascots]);

  const handleMascotClick = useCallback((config: MascotConfig) => {
    setSelectedMascot(config.id);
    onSelect?.(config.animal, config.style, variantMap[config.id]);
  }, [onSelect, variantMap]);

  const handleVariantChange = useCallback((mascotId: string, variant: string) => {
    setVariantMap(prev => ({ ...prev, [mascotId]: variant }));
    const config = MASCOT_CONFIGS.find(c => c.id === mascotId);
    if (config) {
      onSelect?.(config.animal, config.style, variant);
    }
  }, [onSelect]);

  return (
    <div className={`mascot-gallery ${className}`} style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>
          Mascot Gallery
        </h2>
        <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
          Browse all 14 mascot variations across Dropout and NJ styles
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          {showStyleToggle && (
            <MascotStyleToggle
              value={selectedStyle}
              onChange={setSelectedStyle}
              showLabels
              showPreview
            />
          )}
          <MascotStyleSelector
            value={selectedStyle}
            onChange={setSelectedStyle}
          />
        </div>
      </div>

      {/* Animal Selector */}
      {showAnimalSelector && (
        <AnimalSelector
          selected={selectedAnimal}
          onSelect={setSelectedAnimal}
        />
      )}

      {/* Gallery Content */}
      {mode === 'by-style' ? (
        // Display grouped by style
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Dropout Section */}
          <section>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ color: '#F48C06' }}>●</span>
              Dropout Style
              <span style={{ 
                fontSize: '12px', 
                color: '#666',
                fontWeight: 'normal',
              }}>
                ({mascotsByStyle.dropout.length} mascots)
              </span>
            </h3>
            <div style={GRID_STYLES}>
              {mascotsByStyle.dropout.map(config => (
                <MascotCard
                  key={config.id}
                  config={config}
                  isSelected={selectedMascot === config.id}
                  onClick={() => handleMascotClick(config)}
                  previewSize={previewSize}
                  selectedVariant={variantMap[config.id]}
                  onVariantChange={showVariantSelectors && config.variants 
                    ? (v) => handleVariantChange(config.id, v) 
                    : undefined}
                />
              ))}
            </div>
          </section>

          {/* NJ Section */}
          <section>
            <h3 style={{ 
              fontSize: '18px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ color: '#0000FF' }}>○</span>
              NJ Style
              <span style={{ 
                fontSize: '12px', 
                color: '#666',
                fontWeight: 'normal',
              }}>
                ({mascotsByStyle.nj.length} mascots)
              </span>
            </h3>
            <div style={GRID_STYLES}>
              {mascotsByStyle.nj.map(config => (
                <MascotCard
                  key={config.id}
                  config={config}
                  isSelected={selectedMascot === config.id}
                  onClick={() => handleMascotClick(config)}
                  previewSize={previewSize}
                  selectedVariant={variantMap[config.id]}
                  onVariantChange={showVariantSelectors && config.variants 
                    ? (v) => handleVariantChange(config.id, v) 
                    : undefined}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        // Display all together
        <div style={GRID_STYLES}>
          {filteredMascots.map(config => (
            <MascotCard
              key={config.id}
              config={config}
              isSelected={selectedMascot === config.id}
              onClick={() => handleMascotClick(config)}
              previewSize={previewSize}
              selectedVariant={variantMap[config.id]}
              onVariantChange={showVariantSelectors && config.variants 
                ? (v) => handleVariantChange(config.id, v) 
                : undefined}
            />
          ))}
        </div>
      )}

      {/* Selected Mascot Info */}
      {selectedMascot && (
        <div style={{ 
          marginTop: '32px',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 0, 255, 0.2)',
        }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Selected Mascot</h4>
          {(() => {
            const config = MASCOT_CONFIGS.find(c => c.id === selectedMascot);
            if (!config) return null;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <MascotAssetEnhanced
                  animal={config.animal}
                  style={config.style}
                  size={64}
                  animation="celebrate"
                  variant={variantMap[config.id]}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {ANIMAL_INFO[config.animal].label} ({config.style === 'dropout' ? 'Dropout' : 'NJ'})
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {config.description}
                  </div>
                  {variantMap[config.id] && (
                    <div style={{ fontSize: '12px', color: '#0000FF' }}>
                      Variant: {variantMap[config.id]}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default MascotGallery;
