import React, { useState } from 'react';
import { SatorLayer } from '../components/SatorLayer';
import { OperaLayer } from '../components/OperaLayer';
import { TenetLayer } from '../components/TenetLayer';
import { ArepoLayer } from '../components/ArepoLayer';
import { RotasLayer } from '../components/RotasLayer';
import { useSpatialData } from '../hooks/useSpatialData';
import { LayerControls } from '../components/LayerControls';

interface LayerConfig {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  opacity: number;
  visible: boolean;
}

/**
 * LayerComposition - Stack all 5 SATOR Square layers
 * 
 * Demonstrates how layers can be composed and controlled independently.
 */
export const LayerComposition: React.FC = () => {
  const { data, isLoading } = useSpatialData({
    matchId: 'match-123',
    round: 1,
  });

  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'rotas', name: 'ROTAS (Trails)', component: RotasLayer, opacity: 0.8, visible: true },
    { id: 'arepo', name: 'AREPO (Death)', component: ArepoLayer, opacity: 0.7, visible: true },
    { id: 'tenet', name: 'TENET (Control)', component: TenetLayer, opacity: 0.6, visible: true },
    { id: 'opera', name: 'OPERA (Fog)', component: OperaLayer, opacity: 0.5, visible: true },
    { id: 'sator', name: 'SATOR (Halo)', component: SatorLayer, opacity: 1.0, visible: true },
  ]);

  const updateLayerOpacity = (id: string, opacity: number) => {
    setLayers(prev => 
      prev.map(l => l.id === id ? { ...l, opacity } : l)
    );
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => 
      prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    );
  };

  if (isLoading || !data) {
    return <div className="loading">Loading spatial data...</div>;
  }

  const VIEWPORT_WIDTH = 1024;
  const VIEWPORT_HEIGHT = 768;

  return (
    <div className="layer-composition">
      <LayerControls
        layers={layers}
        onOpacityChange={updateLayerOpacity}
        onToggleVisibility={toggleLayerVisibility}
      />
      
      <div 
        className="viewport"
        style={{
          position: 'relative',
          width: VIEWPORT_WIDTH,
          height: VIEWPORT_HEIGHT,
          backgroundColor: '#1a1a2e',
        }}
      >
        {layers.map(({ id, component: LayerComponent, opacity, visible }) =>
          visible &&; (
            <LayerComponent
              key={id}
              data={data}
              width={VIEWPORT_WIDTH}
              height={VIEWPORT_HEIGHT}
              opacity={opacity}
            />
          )
        )}
      </div>
    </div>
  );
};

export default LayerComposition;
