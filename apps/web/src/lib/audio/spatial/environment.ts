// @ts-nocheck
/** [Ver001.000]
 * Environment Audio System
 * ========================
 * Environment audio management for immersive spatial soundscapes.
 * 
 * Features:
 * - Reverb zone management
 * - Ambient soundscapes with layering
 * - Environment presets for different spaces
 * - Dynamic mixing based on listener position
 * - Weather/environment effects
 * 
 * Integration:
 * - Integrates with spatial audio engine
 * - Syncs with R3F scene environments
 * - Supports hub-specific audio (SATOR, ROTAS, etc.)
 */

import {
  type Vector3,
  type ReverbZone,
  type ReverbZoneOptions,
  type EnvironmentPreset,
  type EnvironmentConfig,
  ENVIRONMENT_PRESETS,
  DEFAULT_VECTOR3,
} from './types';
import { type SpatialAudioEngine, getSpatialAudioEngine } from './engine';

// ============================================================================
// Ambient Soundscape Types
// ============================================================================

export interface AmbientLayer {
  id: string;
  name: string;
  audioUrl: string;
  volume: number;
  loop: boolean;
  crossfadeDuration: number;
  isSpatial: boolean;
  position?: Vector3;
  minDistance?: number;
  maxDistance?: number;
  reverbSend: number; // 0-1 amount of reverb
  filterFrequency?: number; // Lowpass filter for muffling
}

export interface AmbientSoundscape {
  id: string;
  name: string;
  layers: AmbientLayer[];
  baseVolume: number;
  isPlaying: boolean;
  currentLayerIds: Set<string>;
}

export interface SoundscapeTransition {
  fromSoundscape: string | null;
  toSoundscape: string;
  duration: number;
  easeFunction: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

// ============================================================================
// Weather Effect Types
// ============================================================================

export type WeatherType = 'clear' | 'rain' | 'thunder' | 'wind' | 'snow' | 'fog';

export interface WeatherEffect {
  type: WeatherType;
  intensity: number; // 0-1
  windDirection?: Vector3;
  windSpeed?: number;
}

export interface WeatherAudioLayer {
  weatherType: WeatherType;
  baseAudioUrl: string;
  intensityAudioUrl?: string;
  volumeRange: [number, number];
  filterRange: [number, number]; // Hz
}

// ============================================================================
// Environment Audio Manager
// ============================================================================

export class EnvironmentAudioManager {
  private engine: SpatialAudioEngine;
  private soundscapes: Map<string, AmbientSoundscape>;
  private activeSoundscape: AmbientSoundscape | null;
  private reverbZones: Map<string, ReverbZone>;
  private activeReverbZone: ReverbZone | null;
  private weatherEffect: WeatherEffect | null;
  private audioNodes: Map<string, EnvironmentAudioNodes>;
  private isDisposed: boolean = false;
  private updateInterval: number | null = null;

  constructor(engine?: SpatialAudioEngine) {
    this.engine = engine ?? getSpatialAudioEngine();
    this.soundscapes = new Map();
    this.activeSoundscape = null;
    this.reverbZones = new Map();
    this.activeReverbZone = null;
    this.weatherEffect = null;
    this.audioNodes = new Map();

    this.initializeDefaultSoundscapes();
    this.startUpdateLoop();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeDefaultSoundscapes(): void {
    // SATOR Hub - warm, analytical atmosphere
    this.createSoundscape({
      id: 'sator_hub',
      name: 'SATOR Hub Ambience',
      layers: [
        {
          id: 'sator_base',
          name: 'Base Hum',
          audioUrl: '/audio/ambient/sator_base.mp3',
          volume: 0.3,
          loop: true,
          crossfadeDuration: 2000,
          isSpatial: false,
          reverbSend: 0.4,
        },
        {
          id: 'sator_data',
          name: 'Data Stream',
          audioUrl: '/audio/ambient/data_stream.mp3',
          volume: 0.15,
          loop: true,
          crossfadeDuration: 3000,
          isSpatial: true,
          position: { x: 5, y: 0, z: 0 },
          minDistance: 2,
          maxDistance: 15,
          reverbSend: 0.2,
        },
      ],
      baseVolume: 0.5,
    });

    // ROTAS Hub - energetic, tactical atmosphere
    this.createSoundscape({
      id: 'rotas_hub',
      name: 'ROTAS Hub Ambience',
      layers: [
        {
          id: 'rotas_energy',
          name: 'Energy Core',
          audioUrl: '/audio/ambient/rotas_energy.mp3',
          volume: 0.4,
          loop: true,
          crossfadeDuration: 1500,
          isSpatial: false,
          reverbSend: 0.5,
        },
        {
          id: 'rotas_machines',
          name: 'Machine Hum',
          audioUrl: '/audio/ambient/machinery.mp3',
          volume: 0.2,
          loop: true,
          crossfadeDuration: 2000,
          isSpatial: true,
          position: { x: -3, y: 0, z: 3 },
          minDistance: 1,
          maxDistance: 10,
          reverbSend: 0.3,
        },
      ],
      baseVolume: 0.6,
    });

    // AREPO Hub - mysterious, shifting atmosphere
    this.createSoundscape({
      id: 'arepo_hub',
      name: 'AREPO Hub Ambience',
      layers: [
        {
          id: 'arepo_mystery',
          name: 'Mystery Drone',
          audioUrl: '/audio/ambient/arepo_mystery.mp3',
          volume: 0.35,
          loop: true,
          crossfadeDuration: 4000,
          isSpatial: false,
          reverbSend: 0.6,
          filterFrequency: 8000,
        },
      ],
      baseVolume: 0.45,
    });

    // OPERA Hub - grand, orchestral atmosphere
    this.createSoundscape({
      id: 'opera_hub',
      name: 'OPERA Hub Ambience',
      layers: [
        {
          id: 'opera_grand',
          name: 'Grand Hall',
          audioUrl: '/audio/ambient/opera_grand.mp3',
          volume: 0.4,
          loop: true,
          crossfadeDuration: 3000,
          isSpatial: false,
          reverbSend: 0.7,
        },
      ],
      baseVolume: 0.5,
    });

    // TeNET Navigation Layer - balanced, neutral atmosphere
    this.createSoundscape({
      id: 'tenet_hub',
      name: 'TENET Central Ambience',
      layers: [
        {
          id: 'tenet_balance',
          name: 'Balanced Tone',
          audioUrl: '/audio/ambient/tenet_balance.mp3',
          volume: 0.3,
          loop: true,
          crossfadeDuration: 2500,
          isSpatial: false,
          reverbSend: 0.35,
        },
      ],
      baseVolume: 0.4,
    });

    // Match environment
    this.createSoundscape({
      id: 'match_ongoing',
      name: 'Match Ambience',
      layers: [
        {
          id: 'match_crowd',
          name: 'Crowd Roar',
          audioUrl: '/audio/ambient/crowd.mp3',
          volume: 0.25,
          loop: true,
          crossfadeDuration: 2000,
          isSpatial: false,
          reverbSend: 0.5,
        },
        {
          id: 'match_arena',
          name: 'Arena Atmosphere',
          audioUrl: '/audio/ambient/arena.mp3',
          volume: 0.2,
          loop: true,
          crossfadeDuration: 3000,
          isSpatial: false,
          reverbSend: 0.4,
        },
      ],
      baseVolume: 0.4,
    });
  }

  dispose(): void {
    this.isDisposed = true;

    // Stop update loop
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop all soundscapes
    this.stopAllSoundscapes();

    // Disconnect all nodes
    for (const nodes of this.audioNodes.values()) {
      nodes.source?.stop();
      nodes.source?.disconnect();
      nodes.gain?.disconnect();
      nodes.filter?.disconnect();
      nodes.reverbSend?.disconnect();
    }

    this.audioNodes.clear();
    this.soundscapes.clear();
    this.reverbZones.clear();
  }

  // ============================================================================
  // Soundscape Management
  // ============================================================================

  createSoundscape(config: Omit<AmbientSoundscape, 'isPlaying' | 'currentLayerIds'>): AmbientSoundscape {
    const soundscape: AmbientSoundscape = {
      ...config,
      isPlaying: false,
      currentLayerIds: new Set(),
    };

    this.soundscapes.set(config.id, soundscape);
    return soundscape;
  }

  destroySoundscape(id: string): boolean {
    const soundscape = this.soundscapes.get(id);
    if (!soundscape) return false;

    // Stop if active
    if (this.activeSoundscape?.id === id) {
      this.stopActiveSoundscape();
    }

    // Stop all layers
    for (const layerId of soundscape.currentLayerIds) {
      this.stopLayer(layerId);
    }

    this.soundscapes.delete(id);
    return true;
  }

  async playSoundscape(id: string, transitionDuration: number = 2000): Promise<boolean> {
    const soundscape = this.soundscapes.get(id);
    if (!soundscape || this.isDisposed) return false;

    // If another soundscape is playing, crossfade
    if (this.activeSoundscape && this.activeSoundscape.id !== id) {
      await this.crossfadeSoundscapes(this.activeSoundscape.id, id, transitionDuration);
      return true;
    }

    // Start playing all layers
    this.activeSoundscape = soundscape;
    
    for (const layer of soundscape.layers) {
      await this.playLayer(layer, soundscape.baseVolume, transitionDuration);
      soundscape.currentLayerIds.add(layer.id);
    }

    soundscape.isPlaying = true;
    return true;
  }

  stopActiveSoundscape(fadeOutDuration: number = 2000): void {
    if (!this.activeSoundscape) return;

    // Fade out all layers
    for (const layerId of this.activeSoundscape.currentLayerIds) {
      this.fadeOutLayer(layerId, fadeOutDuration);
    }

    this.activeSoundscape.isPlaying = false;
    this.activeSoundscape.currentLayerIds.clear();
    this.activeSoundscape = null;
  }

  stopAllSoundscapes(): void {
    for (const soundscape of this.soundscapes.values()) {
      if (soundscape.isPlaying) {
        for (const layerId of soundscape.currentLayerIds) {
          this.stopLayer(layerId);
        }
        soundscape.isPlaying = false;
        soundscape.currentLayerIds.clear();
      }
    }
    this.activeSoundscape = null;
  }

  private async crossfadeSoundscapes(
    fromId: string,
    toId: string,
    duration: number
  ): Promise<void> {
    const fromSoundscape = this.soundscapes.get(fromId);
    const toSoundscape = this.soundscapes.get(toId);
    
    if (!fromSoundscape || !toSoundscape) return;

    // Fade out old layers
    for (const layerId of fromSoundscape.currentLayerIds) {
      this.fadeOutLayer(layerId, duration);
    }

    // Fade in new layers
    for (const layer of toSoundscape.layers) {
      await this.playLayer(layer, toSoundscape.baseVolume, duration);
      toSoundscape.currentLayerIds.add(layer.id);
    }

    fromSoundscape.isPlaying = false;
    fromSoundscape.currentLayerIds.clear();
    
    toSoundscape.isPlaying = true;
    this.activeSoundscape = toSoundscape;
  }

  // ============================================================================
  // Layer Management
  // ============================================================================

  private async playLayer(
    layer: AmbientLayer,
    baseVolume: number,
    fadeInDuration: number
  ): Promise<void> {
    const nodes = this.getOrCreateAudioNodes(layer.id);
    if (!nodes.context) return;

    try {
      // Load audio buffer
      const buffer = await this.loadAudioBuffer(layer.audioUrl);
      if (!buffer) return;

      // Create source
      nodes.source = nodes.context.createBufferSource();
      nodes.source.buffer = buffer;
      nodes.source.loop = layer.loop;

      // Set up filter if specified
      if (layer.filterFrequency && nodes.filter) {
        nodes.filter.frequency.value = layer.filterFrequency;
        nodes.source.connect(nodes.filter);
        nodes.filter.connect(nodes.gain);
      } else {
        nodes.source.connect(nodes.gain);
      }

      // Connect to destination
      nodes.gain.connect(nodes.context.destination);

      // Fade in
      const targetVolume = layer.volume * baseVolume;
      nodes.gain.gain.setValueAtTime(0, nodes.context.currentTime);
      nodes.gain.gain.linearRampToValueAtTime(
        targetVolume,
        nodes.context.currentTime + fadeInDuration / 1000
      );

      // Start playback
      nodes.source.start();
    } catch (error) {
      console.warn(`Failed to play ambient layer ${layer.id}:`, error);
    }
  }

  private fadeOutLayer(layerId: string, duration: number): void {
    const nodes = this.audioNodes.get(layerId);
    if (!nodes?.context || !nodes.gain) return;

    const currentTime = nodes.context.currentTime;
    nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, currentTime);
    nodes.gain.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);

    // Stop after fade
    setTimeout(() => {
      this.stopLayer(layerId);
    }, duration);
  }

  private stopLayer(layerId: string): void {
    const nodes = this.audioNodes.get(layerId);
    if (!nodes) return;

    try {
      nodes.source?.stop();
      nodes.source?.disconnect();
    } catch {
      // Already stopped
    }

    this.audioNodes.delete(layerId);
  }

  private getOrCreateAudioNodes(layerId: string): EnvironmentAudioNodes {
    let nodes = this.audioNodes.get(layerId);
    if (nodes) return nodes;

    const context = this.engine['audioContext'];
    if (!context) {
      return { context: null };
    }

    nodes = {
      context,
      source: null,
      gain: context.createGain(),
      filter: context.createBiquadFilter(),
      reverbSend: context.createGain(),
    };

    nodes.filter.type = 'lowpass';
    nodes.filter.frequency.value = 20000;

    this.audioNodes.set(layerId, nodes);
    return nodes;
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    const context = this.engine['audioContext'];
    if (!context) return null;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      return await context.decodeAudioData(arrayBuffer);
    } catch {
      // Return null for missing files (they may not exist yet)
      return null;
    }
  }

  // ============================================================================
  // Reverb Zone Management
  // ============================================================================

  createReverbZone(options: ReverbZoneOptions): string {
    const id = this.engine.createReverbZone(options);
    
    // Store reference
    const zone = this.engine['state']?.reverbZones?.get(id);
    if (zone) {
      this.reverbZones.set(id, zone);
    }
    
    return id;
  }

  destroyReverbZone(id: string): boolean {
    return this.engine.destroyReverbZone(id) && this.reverbZones.delete(id);
  }

  setActiveReverbZone(id: string): boolean {
    const success = this.engine.setActiveReverbZone(id);
    if (success) {
      this.activeReverbZone = this.reverbZones.get(id) ?? null;
    }
    return success;
  }

  getActiveReverbZone(): ReverbZone | null {
    return this.activeReverbZone;
  }

  // ============================================================================
  // Environment Presets
  // ============================================================================

  applyEnvironmentPreset(preset: EnvironmentPreset): void {
    this.engine.applyEnvironmentPreset(preset);

    // Apply preset to active soundscape
    if (this.activeSoundscape) {
      const presetConfig = ENVIRONMENT_PRESETS[preset];
      if (presetConfig?.reverbGain !== undefined) {
        // Adjust reverb send on all layers
        for (const layerId of this.activeSoundscape.currentLayerIds) {
          const nodes = this.audioNodes.get(layerId);
          if (nodes?.reverbSend) {
            nodes.reverbSend.gain.setTargetAtTime(
              presetConfig.reverbGain!,
              this.engine['audioContext']?.currentTime ?? 0,
              0.5
            );
          }
        }
      }
    }
  }

  // ============================================================================
  // Weather Effects
  // ============================================================================

  setWeatherEffect(effect: WeatherEffect, transitionDuration: number = 3000): void {
    const prevEffect = this.weatherEffect;
    this.weatherEffect = effect;

    // Adjust soundscape based on weather
    if (this.activeSoundscape) {
      this.applyWeatherToSoundscape(effect, transitionDuration);
    }

    // Create or update weather audio layer
    this.updateWeatherAudio(effect, prevEffect, transitionDuration);
  }

  clearWeatherEffect(fadeOutDuration: number = 3000): void {
    if (this.weatherEffect) {
      this.fadeOutLayer('weather_effect', fadeOutDuration);
      this.weatherEffect = null;
    }
  }

  private applyWeatherToSoundscape(effect: WeatherEffect, duration: number): void {
    for (const layerId of this.activeSoundscape!.currentLayerIds) {
      const nodes = this.audioNodes.get(layerId);
      if (!nodes?.filter) continue;

      // Apply lowpass filter for rain/snow
      let targetFrequency = 20000;
      
      switch (effect.type) {
        case 'rain':
          targetFrequency = 6000 - effect.intensity * 3000;
          break;
        case 'snow':
          targetFrequency = 8000 - effect.intensity * 2000;
          break;
        case 'fog':
          targetFrequency = 5000 - effect.intensity * 2000;
          break;
        case 'wind':
          targetFrequency = 10000 - effect.intensity * 4000;
          break;
      }

      const context = this.engine['audioContext'];
      if (context) {
        nodes.filter.frequency.setTargetAtTime(
          targetFrequency,
          context.currentTime,
          duration / 3000
        );
      }
    }
  }

  private updateWeatherAudio(
    effect: WeatherEffect,
    prevEffect: WeatherEffect | null,
    duration: number
  ): void {
    // This would integrate with actual weather audio files
    // For now, we just adjust the soundscape mixing
  }

  // ============================================================================
  // Dynamic Mixing
  // ============================================================================

  setSoundscapeVolume(soundscapeId: string, volume: number, fadeDuration: number = 1000): boolean {
    const soundscape = this.soundscapes.get(soundscapeId);
    if (!soundscape) return false;

    soundscape.baseVolume = Math.max(0, Math.min(1, volume));

    // Update all playing layers
    const context = this.engine['audioContext'];
    if (!context) return true;

    for (const layerId of soundscape.currentLayerIds) {
      const layer = soundscape.layers.find(l => l.id === layerId);
      const nodes = this.audioNodes.get(layerId);
      
      if (layer && nodes?.gain) {
        const targetVolume = layer.volume * soundscape.baseVolume;
        nodes.gain.gain.setTargetAtTime(
          targetVolume,
          context.currentTime,
          fadeDuration / 3000
        );
      }
    }

    return true;
  }

  setLayerVolume(
    soundscapeId: string,
    layerId: string,
    volume: number,
    fadeDuration: number = 500
  ): boolean {
    const soundscape = this.soundscapes.get(soundscapeId);
    const layer = soundscape?.layers.find(l => l.id === layerId);
    const nodes = this.audioNodes.get(layerId);
    const context = this.engine['audioContext'];
    
    if (!layer || !nodes?.gain || !context) return false;

    layer.volume = Math.max(0, Math.min(1, volume));
    
    const targetVolume = layer.volume * (soundscape?.baseVolume ?? 1);
    nodes.gain.gain.setTargetAtTime(targetVolume, context.currentTime, fadeDuration / 3000);
    
    return true;
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  private startUpdateLoop(): void {
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 100) as unknown as number;
  }

  private update(): void {
    if (this.isDisposed) return;

    // Update spatial layers based on listener position
    const listenerPos = this.engine.getListenerPosition();

    for (const soundscape of this.soundscapes.values()) {
      if (!soundscape.isPlaying) continue;

      for (const layer of soundscape.layers) {
        if (!layer.isSpatial || !layer.position) continue;

        const nodes = this.audioNodes.get(layer.id);
        if (!nodes?.gain) continue;

        // Calculate distance-based attenuation
        const dist = Math.sqrt(
          Math.pow(layer.position.x - listenerPos.x, 2) +
          Math.pow(layer.position.y - listenerPos.y, 2) +
          Math.pow(layer.position.z - listenerPos.z, 2)
        );

        const minDist = layer.minDistance ?? 1;
        const maxDist = layer.maxDistance ?? 20;

        let attenuation = 1;
        if (dist > minDist) {
          attenuation = Math.max(0, 1 - (dist - minDist) / (maxDist - minDist));
        }

        // Apply to gain
        const targetVolume = layer.volume * soundscape.baseVolume * attenuation;
        const context = this.engine['audioContext'];
        if (context) {
          nodes.gain.gain.setTargetAtTime(targetVolume, context.currentTime, 0.1);
        }
      }
    }

    // Check for reverb zone changes
    const containingZone = this.engine['checkZoneContainment']?.(listenerPos);
    if (containingZone && containingZone.id !== this.activeReverbZone?.id) {
      this.setActiveReverbZone(containingZone.id);
    }
  }

  // ============================================================================
  // State Access
  // ============================================================================

  getActiveSoundscape(): AmbientSoundscape | null {
    return this.activeSoundscape;
  }

  getSoundscape(id: string): AmbientSoundscape | undefined {
    return this.soundscapes.get(id);
  }

  getAllSoundscapes(): AmbientSoundscape[] {
    return Array.from(this.soundscapes.values());
  }

  getWeatherEffect(): WeatherEffect | null {
    return this.weatherEffect;
  }
}

// ============================================================================
// Helper Types
// ============================================================================

interface EnvironmentAudioNodes {
  context: AudioContext | null;
  source?: AudioBufferSourceNode | null;
  gain?: GainNode;
  filter?: BiquadFilterNode;
  reverbSend?: GainNode;
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalEnvironmentManager: EnvironmentAudioManager | null = null;

export function getEnvironmentAudioManager(engine?: SpatialAudioEngine): EnvironmentAudioManager {
  if (!globalEnvironmentManager) {
    globalEnvironmentManager = new EnvironmentAudioManager(engine);
  }
  return globalEnvironmentManager;
}

export function destroyEnvironmentAudioManager(): void {
  globalEnvironmentManager?.dispose();
  globalEnvironmentManager = null;
}

export function createEnvironmentAudioManager(engine?: SpatialAudioEngine): EnvironmentAudioManager {
  return new EnvironmentAudioManager(engine);
}

// Re-export types
export * from './types';
