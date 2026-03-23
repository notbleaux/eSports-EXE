/** [Ver001.000]
 * Spatial Audio Engine
 * ====================
 * Core 3D spatial audio engine for immersive mascot experiences.
 * 
 * Features:
 * - 3D audio positioning with Web Audio API PannerNode
 * - Distance attenuation (linear, inverse, exponential models)
 * - Occlusion handling with lowpass filtering
 * - HRTF (Head-Related Transfer Function) support
 * - Doppler effect simulation
 * - Reverb zone integration
 * - Efficient update loop with configurable rate
 * 
 * Integration:
 * - Works with R3F scenes through position synchronization
 * - Integrates with TL-H4-3-A audio manager
 * - Supports mascot voice and effect spatialization
 */

import {
  type Vector3,
  type AudioSourceId,
  type SpatialAudioSource,
  type AudioSourceOptions,
  type AudioListener,
  type ListenerConfig,
  type HRTFConfig,
  type OcclusionConfig,
  type OcclusionState,
  type ReverbZone,
  type ReverbZoneOptions,
  type DopplerConfig,
  type DopplerState,
  type DistanceAttenuationConfig,
  type EnvironmentPreset,
  type EnvironmentConfig,
  type SpatialAudioState,
  type SpatialAudioEngineConfig,
  type SpatialAudioEvent,
  type SpatialAudioEventType,
  type SpatialAudioEventHandler,
  type AudioVisualizationData,
  DEFAULT_VECTOR3,
  DEFAULT_FORWARD,
  DEFAULT_UP,
  DEFAULT_REVERB_ZONE,
  ENVIRONMENT_PRESETS,
  SPEED_OF_SOUND_AIR,
} from './types';

// ============================================================================
// Spatial Audio Engine Class
// ============================================================================

export class SpatialAudioEngine {
  private audioContext: AudioContext | null = null;
  private state: SpatialAudioState;
  private config: Required<SpatialAudioEngineConfig>;
  private listeners: Map<SpatialAudioEventType, Set<SpatialAudioEventHandler>>;
  
  // Audio nodes
  private masterGain: GainNode | null = null;
  private listenerNode: AudioListenerNode | null = null;
  private sourceNodes: Map<AudioSourceId, SourceAudioNodes>;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  
  // State tracking
  private occlusionStates: Map<AudioSourceId, OcclusionState>;
  private dopplerStates: Map<AudioSourceId, DopplerState>;
  private updateInterval: number | null = null;
  private lastUpdateTime: number = 0;
  private isDisposed: boolean = false;
  
  // HRTF support
  private hrtfEnabled: boolean = false;
  private hrtfPannerNodes: Map<AudioSourceId, PannerNode> = new Map();

  constructor(config: SpatialAudioEngineConfig = {}) {
    this.config = {
      masterVolume: config.masterVolume ?? 1.0,
      hrtfEnabled: config.hrtfEnabled ?? true,
      occlusionEnabled: config.occlusionEnabled ?? true,
      dopplerEnabled: config.dopplerEnabled ?? true,
      maxSources: config.maxSources ?? 32,
      updateRate: config.updateRate ?? 60,
      defaultDistanceModel: config.defaultDistanceModel ?? 'inverse',
      audioContext: config.audioContext ?? null,
    };

    this.state = {
      isInitialized: false,
      listener: {
        position: { ...DEFAULT_VECTOR3 },
        velocity: { ...DEFAULT_VECTOR3 },
        forward: { ...DEFAULT_FORWARD },
        up: { ...DEFAULT_UP },
      },
      sources: new Map(),
      reverbZones: new Map(),
      activeReverbZone: null,
      globalReverbGain: 0.3,
      masterVolume: this.config.masterVolume,
      isMuted: false,
    };

    this.listeners = new Map();
    this.sourceNodes = new Map();
    this.occlusionStates = new Map();
    this.dopplerStates = new Map();

    // Initialize with default reverb zone
    this.createReverbZone({ ...DEFAULT_REVERB_ZONE, isGlobal: true });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(audioContext?: AudioContext): Promise<boolean> {
    if (this.state.isInitialized) {
      return true;
    }

    try {
      // Create or use provided AudioContext
      if (audioContext) {
        this.audioContext = audioContext;
      } else {
        const AudioContextClass = window.AudioContext || 
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        
        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported');
        }
        
        this.audioContext = new AudioContextClass({
          latencyHint: 'interactive',
          sampleRate: 48000,
        });
      }

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.config.masterVolume;
      this.masterGain.connect(this.audioContext.destination);

      // Create listener node
      this.listenerNode = this.audioContext.listener;
      this.updateListenerPosition();

      // Create reverb chain
      await this.initializeReverb();

      // Start update loop
      this.startUpdateLoop();

      this.state.isInitialized = true;
      this.emit('sourceCreated', {});
      
      return true;
    } catch (error) {
      this.emit('error', { error });
      return false;
    }
  }

  private async initializeReverb(): Promise<void> {
    if (!this.audioContext) return;

    // Create convolver for reverb
    this.reverbNode = this.audioContext.createConvolver();
    
    // Create synthetic impulse response for default reverb
    const impulseResponse = this.createSyntheticImpulseResponse(
      DEFAULT_REVERB_ZONE.reverbTime,
      DEFAULT_REVERB_ZONE.reverbPreDelay
    );
    this.reverbNode.buffer = impulseResponse;

    // Create reverb gain
    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.gain.value = DEFAULT_REVERB_ZONE.reverbGain;

    // Connect reverb chain
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain!);
  }

  private createSyntheticImpulseResponse(duration: number, preDelay: number): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil((duration + preDelay) * sampleRate);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      // Pre-delay (silence)
      const preDelaySamples = Math.ceil(preDelay * sampleRate);
      
      // Generate decay noise
      for (let i = preDelaySamples; i < length; i++) {
        const t = (i - preDelaySamples) / sampleRate;
        const decay = Math.exp(-3 * t / duration);
        const noise = (Math.random() * 2 - 1) * decay;
        
        // Add some early reflections
        let reflections = 0;
        for (let r = 1; r <= 5; r++) {
          const reflectionTime = r * 0.02;
          if (t >= reflectionTime) {
            const reflectionDecay = Math.exp(-5 * (t - reflectionTime) / duration);
            reflections += (Math.random() * 2 - 1) * reflectionDecay * 0.3;
          }
        }
        
        data[i] = noise + reflections;
      }
    }

    return buffer;
  }

  dispose(): void {
    this.isDisposed = true;
    
    // Stop update loop
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop all sources
    this.stopAllSources();

    // Disconnect nodes
    this.masterGain?.disconnect();
    this.reverbNode?.disconnect();
    this.reverbGain?.disconnect();

    // Clear maps
    this.sourceNodes.clear();
    this.occlusionStates.clear();
    this.dopplerStates.clear();
    this.state.sources.clear();
    this.state.reverbZones.clear();

    this.state.isInitialized = false;
  }

  // ============================================================================
  // Audio Source Management
  // ============================================================================

  createSource(options: AudioSourceOptions): AudioSourceId {
    const id = options.id ?? `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const source: SpatialAudioSource = {
      id,
      type: options.type ?? 'effect',
      position: { ...DEFAULT_VECTOR3, ...options.position },
      velocity: { ...DEFAULT_VECTOR3, ...options.velocity },
      orientation: { ...DEFAULT_FORWARD, ...options.orientation },
      volume: options.volume ?? 1.0,
      pitch: options.pitch ?? 1.0,
      loop: options.loop ?? false,
      audioUrl: options.audioUrl,
      buffer: options.buffer,
      maxDistance: options.maxDistance ?? 10000,
      refDistance: options.refDistance ?? 1,
      rolloffFactor: options.rolloffFactor ?? 1,
      coneInnerAngle: options.coneInnerAngle ?? 360,
      coneOuterAngle: options.coneOuterAngle ?? 360,
      coneOuterGain: options.coneOuterGain ?? 0,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      playbackRate: 1.0,
      muted: false,
    };

    this.state.sources.set(id, source);
    
    // Initialize audio nodes if engine is initialized
    if (this.state.isInitialized) {
      this.initializeSourceNodes(id, source);
    }

    this.emit('sourceCreated', { sourceId: id, source });
    return id;
  }

  private initializeSourceNodes(id: AudioSourceId, source: SpatialAudioSource): void {
    if (!this.audioContext) return;

    // Create source gain
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = source.volume;

    // Create panner for spatialization
    const pannerNode = this.audioContext.createPanner();
    pannerNode.panningModel = this.config.hrtfEnabled ? 'HRTF' : 'equalpower';
    pannerNode.distanceModel = this.config.defaultDistanceModel;
    pannerNode.refDistance = source.refDistance;
    pannerNode.maxDistance = source.maxDistance;
    pannerNode.rolloffFactor = source.rolloffFactor;
    pannerNode.coneInnerAngle = source.coneInnerAngle;
    pannerNode.coneOuterAngle = source.coneOuterAngle;
    pannerNode.coneOuterGain = source.coneOuterGain;

    // Set initial position
    pannerNode.positionX.value = source.position.x;
    pannerNode.positionY.value = source.position.y;
    pannerNode.positionZ.value = source.position.z;

    // Set orientation if directional
    if (source.coneInnerAngle < 360) {
      pannerNode.orientationX.value = source.orientation!.x;
      pannerNode.orientationY.value = source.orientation!.y;
      pannerNode.orientationZ.value = source.orientation!.z;
    }

    // Create occlusion filter if enabled
    let occlusionFilter: BiquadFilterNode | null = null;
    if (this.config.occlusionEnabled) {
      occlusionFilter = this.audioContext.createBiquadFilter();
      occlusionFilter.type = 'lowpass';
      occlusionFilter.frequency.value = 20000;
      occlusionFilter.Q.value = 0;
    }

    // Create reverb send if reverb is enabled
    let reverbSend: GainNode | null = null;
    if (this.reverbNode) {
      reverbSend = this.audioContext.createGain();
      reverbSend.gain.value = this.state.globalReverbGain;
    }

    // Connect chain: gain -> occlusion -> panner -> master
    gainNode.connect(occlusionFilter ?? pannerNode);
    if (occlusionFilter) {
      occlusionFilter.connect(pannerNode);
    }
    pannerNode.connect(this.masterGain!);

    // Connect to reverb as well
    if (reverbSend && this.reverbNode) {
      gainNode.connect(reverbSend);
      reverbSend.connect(this.reverbNode);
    }

    this.sourceNodes.set(id, {
      gainNode,
      pannerNode,
      sourceNode: null,
      occlusionFilter,
      reverbSend,
    });

    // Initialize occlusion state
    if (this.config.occlusionEnabled) {
      this.occlusionStates.set(id, {
        isOccluded: false,
        occlusionFactor: 0,
        lowpassFilter: occlusionFilter,
        lastUpdate: 0,
      });
    }

    // Initialize doppler state
    if (this.config.dopplerEnabled) {
      this.dopplerStates.set(id, {
        lastPosition: { ...source.position },
        lastTime: this.audioContext.currentTime,
        currentPitch: source.pitch,
      });
    }
  }

  destroySource(id: AudioSourceId): boolean {
    const source = this.state.sources.get(id);
    if (!source) return false;

    // Stop playback
    this.stopSource(id);

    // Disconnect nodes
    const nodes = this.sourceNodes.get(id);
    if (nodes) {
      nodes.sourceNode?.stop();
      nodes.sourceNode?.disconnect();
      nodes.gainNode.disconnect();
      nodes.pannerNode.disconnect();
      nodes.occlusionFilter?.disconnect();
      nodes.reverbSend?.disconnect();
    }

    // Remove from maps
    this.sourceNodes.delete(id);
    this.occlusionStates.delete(id);
    this.dopplerStates.delete(id);
    this.state.sources.delete(id);

    this.emit('sourceDestroyed', { sourceId: id });
    return true;
  }

  getSource(id: AudioSourceId): SpatialAudioSource | undefined {
    return this.state.sources.get(id);
  }

  getAllSources(): SpatialAudioSource[] {
    return Array.from(this.state.sources.values());
  }

  // ============================================================================
  // Playback Control
  // ============================================================================

  async playSource(id: AudioSourceId, audioBuffer?: AudioBuffer): Promise<boolean> {
    const source = this.state.sources.get(id);
    if (!source || !this.audioContext) return false;

    // Ensure source nodes are initialized
    if (!this.sourceNodes.has(id)) {
      this.initializeSourceNodes(id, source);
    }

    const nodes = this.sourceNodes.get(id);
    if (!nodes) return false;

    // Stop current playback
    if (nodes.sourceNode) {
      try {
        nodes.sourceNode.stop();
        nodes.sourceNode.disconnect();
      } catch {
        // Already stopped
      }
    }

    // Get audio buffer
    let buffer = audioBuffer ?? source.buffer;
    if (!buffer && source.audioUrl) {
      buffer = await this.loadAudioBuffer(source.audioUrl);
    }

    if (!buffer) {
      this.emit('error', { sourceId: id, error: new Error('No audio buffer available') });
      return false;
    }

    // Create source node
    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = source.loop;
    sourceNode.playbackRate.value = source.playbackRate * source.pitch;

    // Connect to gain
    sourceNode.connect(nodes.gainNode);

    // Start playback
    const startTime = source.isPaused ? source.currentTime : 0;
    sourceNode.start(0, startTime);

    // Update nodes and state
    nodes.sourceNode = sourceNode;
    source.isPlaying = true;
    source.isPaused = false;

    // Handle ended event
    sourceNode.onended = () => {
      source.isPlaying = false;
      source.currentTime = 0;
      this.emit('sourceStopped', { sourceId: id });
    };

    this.emit('sourceStarted', { sourceId: id });
    return true;
  }

  pauseSource(id: AudioSourceId): boolean {
    const source = this.state.sources.get(id);
    const nodes = this.sourceNodes.get(id);
    
    if (!source || !nodes?.sourceNode || !this.audioContext) return false;

    // Store current time
    source.currentTime = this.audioContext.currentTime;
    
    // Stop but keep position
    try {
      nodes.sourceNode.stop();
    } catch {
      // Already stopped
    }

    source.isPlaying = false;
    source.isPaused = true;
    
    this.emit('sourceStopped', { sourceId: id });
    return true;
  }

  stopSource(id: AudioSourceId): boolean {
    const source = this.state.sources.get(id);
    const nodes = this.sourceNodes.get(id);
    
    if (!source || !nodes?.sourceNode) return false;

    try {
      nodes.sourceNode.stop();
      nodes.sourceNode.disconnect();
    } catch {
      // Already stopped
    }

    nodes.sourceNode = null;
    source.isPlaying = false;
    source.isPaused = false;
    source.currentTime = 0;

    this.emit('sourceStopped', { sourceId: id });
    return true;
  }

  stopAllSources(): void {
    for (const id of this.state.sources.keys()) {
      this.stopSource(id);
    }
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | undefined> {
    if (!this.audioContext) return undefined;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      this.emit('error', { error });
      return undefined;
    }
  }

  // ============================================================================
  // Position Management
  // ============================================================================

  setSourcePosition(id: AudioSourceId, position: Partial<Vector3>): boolean {
    const source = this.state.sources.get(id);
    if (!source) return false;

    // Update source position
    source.position = { ...source.position, ...position };

    // Update panner node
    const nodes = this.sourceNodes.get(id);
    if (nodes?.pannerNode) {
      if (position.x !== undefined) nodes.pannerNode.positionX.value = position.x;
      if (position.y !== undefined) nodes.pannerNode.positionY.value = position.y;
      if (position.z !== undefined) nodes.pannerNode.positionZ.value = position.z;
    }

    this.emit('sourceMoved', { sourceId: id, position: source.position });
    return true;
  }

  setSourceVelocity(id: AudioSourceId, velocity: Partial<Vector3>): boolean {
    const source = this.state.sources.get(id);
    if (!source) return false;

    source.velocity = { ...source.velocity, ...velocity };

    // Update panner node velocity
    const nodes = this.sourceNodes.get(id);
    if (nodes?.pannerNode) {
      if (velocity.x !== undefined) nodes.pannerNode.positionX.value = velocity.x;
      if (velocity.y !== undefined) nodes.pannerNode.positionY.value = velocity.y;
      if (velocity.z !== undefined) nodes.pannerNode.positionZ.value = velocity.z;
    }

    return true;
  }

  setListenerPosition(position: Partial<Vector3>, orientation?: { forward?: Partial<Vector3>; up?: Partial<Vector3> }): void {
    this.state.listener.position = { ...this.state.listener.position, ...position };
    
    if (orientation?.forward) {
      this.state.listener.forward = { ...this.state.listener.forward, ...orientation.forward };
    }
    if (orientation?.up) {
      this.state.listener.up = { ...this.state.listener.up, ...orientation.up };
    }

    this.updateListenerPosition();
    this.emit('listenerMoved', { position: this.state.listener.position });
  }

  private updateListenerPosition(): void {
    if (!this.listenerNode || !this.audioContext) return;

    const { position, forward, up } = this.state.listener;

    // Set position
    this.listenerNode.positionX.value = position.x;
    this.listenerNode.positionY.value = position.y;
    this.listenerNode.positionZ.value = position.z;

    // Set orientation (forward and up vectors)
    this.listenerNode.forwardX.value = forward.x;
    this.listenerNode.forwardY.value = forward.y;
    this.listenerNode.forwardZ.value = forward.z;
    this.listenerNode.upX.value = up.x;
    this.listenerNode.upY.value = up.y;
    this.listenerNode.upZ.value = up.z;
  }

  // ============================================================================
  // Distance Attenuation
  // ============================================================================

  calculateDistanceAttenuation(sourcePosition: Vector3, config?: DistanceAttenuationConfig): number {
    const listenerPos = this.state.listener.position;
    const distance = Math.sqrt(
      Math.pow(sourcePosition.x - listenerPos.x, 2) +
      Math.pow(sourcePosition.y - listenerPos.y, 2) +
      Math.pow(sourcePosition.z - listenerPos.z, 2)
    );

    const cfg = config ?? {
      model: this.config.defaultDistanceModel,
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 1,
    };

    switch (cfg.model) {
      case 'linear':
        if (distance <= cfg.refDistance) return 1;
        if (distance >= cfg.maxDistance) return 0;
        return 1 - cfg.rolloffFactor * (distance - cfg.refDistance) / (cfg.maxDistance - cfg.refDistance);

      case 'inverse':
        return cfg.refDistance / (cfg.refDistance + cfg.rolloffFactor * (distance - cfg.refDistance));

      case 'exponential':
        return Math.pow(distance / cfg.refDistance, -cfg.rolloffFactor);

      case 'custom':
        if (!cfg.customCurve) return 1;
        // Interpolate from custom curve
        const t = Math.min(1, Math.max(0, (distance - cfg.refDistance) / (cfg.maxDistance - cfg.refDistance)));
        const index = Math.floor(t * (cfg.customCurve.length - 1));
        return cfg.customCurve[index] ?? 1;

      default:
        return 1;
    }
  }

  // ============================================================================
  // Occlusion Handling
  // ============================================================================

  setOcclusionFactor(id: AudioSourceId, factor: number): void {
    if (!this.config.occlusionEnabled) return;

    const state = this.occlusionStates.get(id);
    const source = this.state.sources.get(id);
    
    if (!state || !source) return;

    // Clamp factor between 0 and 1
    const clampedFactor = Math.max(0, Math.min(1, factor));
    
    state.occlusionFactor = clampedFactor;
    state.isOccluded = clampedFactor > 0;

    // Update lowpass filter
    if (state.lowpassFilter) {
      const minFreq = 200;
      const maxFreq = 20000;
      const frequency = maxFreq - (maxFreq - minFreq) * clampedFactor;
      state.lowpassFilter.frequency.setTargetAtTime(
        frequency,
        this.audioContext!.currentTime,
        0.1
      );

      // Also reduce volume based on occlusion
      const nodes = this.sourceNodes.get(id);
      if (nodes?.gainNode) {
        const attenuatedVolume = source.volume * (1 - clampedFactor * 0.5);
        nodes.gainNode.gain.setTargetAtTime(
          attenuatedVolume,
          this.audioContext!.currentTime,
          0.1
        );
      }
    }

    this.emit('occlusionChanged', { sourceId: id, factor: clampedFactor });
  }

  // ============================================================================
  // Doppler Effect
  // ============================================================================

  private updateDopplerEffect(id: AudioSourceId, deltaTime: number): void {
    if (!this.config.dopplerEnabled) return;

    const source = this.state.sources.get(id);
    const state = this.dopplerStates.get(id);
    const nodes = this.sourceNodes.get(id);
    
    if (!source || !state || !nodes?.sourceNode) return;

    const currentTime = this.audioContext!.currentTime;
    const dt = currentTime - state.lastTime;
    
    if (dt < 0.001) return; // Prevent division by zero

    // Calculate source velocity
    const velocity = {
      x: (source.position.x - state.lastPosition.x) / dt,
      y: (source.position.y - state.lastPosition.y) / dt,
      z: (source.position.z - state.lastPosition.z) / dt,
    };

    // Calculate relative velocity to listener
    const relativeVelocity = {
      x: velocity.x - this.state.listener.velocity.x,
      y: velocity.y - this.state.listener.velocity.y,
      z: velocity.z - this.state.listener.velocity.z,
    };

    // Calculate distance vector
    const distance = {
      x: source.position.x - this.state.listener.position.x,
      y: source.position.y - this.state.listener.position.y,
      z: source.position.z - this.state.listener.position.z,
    };
    const dist = Math.sqrt(distance.x ** 2 + distance.y ** 2 + distance.z ** 2);

    if (dist < 0.001) return;

    // Calculate doppler shift
    const speedOfSound = SPEED_OF_SOUND_AIR;
    const radialVelocity = (relativeVelocity.x * distance.x + 
                           relativeVelocity.y * distance.y + 
                           relativeVelocity.z * distance.z) / dist;

    const dopplerRatio = speedOfSound / (speedOfSound - radialVelocity);
    const clampedRatio = Math.max(0.5, Math.min(2, dopplerRatio));

    // Apply to playback rate
    const targetPitch = source.pitch * clampedRatio;
    nodes.sourceNode.playbackRate.setTargetAtTime(
      targetPitch,
      currentTime,
      0.05
    );

    // Update state
    state.lastPosition = { ...source.position };
    state.lastTime = currentTime;
    state.currentPitch = targetPitch;
  }

  // ============================================================================
  // Reverb Zones
  // ============================================================================

  createReverbZone(options: ReverbZoneOptions): string {
    const id = options.id ?? `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const zone: ReverbZone = {
      id,
      name: options.name ?? 'Reverb Zone',
      type: options.type ?? 'room',
      center: { ...DEFAULT_VECTOR3, ...options.center },
      size: { x: 10, y: 10, z: 10, ...options.size },
      shape: options.shape ?? 'box',
      reverbTime: options.reverbTime ?? 1.5,
      reverbPreDelay: options.reverbPreDelay ?? 0.02,
      reverbDecay: options.reverbDecay ?? 0.5,
      reverbGain: options.reverbGain ?? 0.3,
      transitionDistance: options.transitionDistance ?? 5,
      isGlobal: options.isGlobal ?? false,
    };

    this.state.reverbZones.set(id, zone);
    
    // If this is the first zone or global, set as active
    if (zone.isGlobal || !this.state.activeReverbZone) {
      this.setActiveReverbZone(id);
    }

    return id;
  }

  destroyReverbZone(id: string): boolean {
    const zone = this.state.reverbZones.get(id);
    if (!zone) return false;

    // If this was the active zone, switch to global or null
    if (this.state.activeReverbZone?.id === id) {
      const globalZone = Array.from(this.state.reverbZones.values()).find(z => z.isGlobal && z.id !== id);
      this.state.activeReverbZone = globalZone ?? null;
      this.updateReverbSettings();
    }

    this.state.reverbZones.delete(id);
    return true;
  }

  setActiveReverbZone(id: string): boolean {
    const zone = this.state.reverbZones.get(id);
    if (!zone) return false;

    this.state.activeReverbZone = zone;
    this.updateReverbSettings();
    
    this.emit('reverbChanged', { zoneId: id, zone });
    return true;
  }

  private updateReverbSettings(): void {
    const zone = this.state.activeReverbZone;
    if (!zone || !this.reverbGain || !this.audioContext) return;

    // Update reverb gain
    this.reverbGain.gain.setTargetAtTime(
      zone.reverbGain,
      this.audioContext.currentTime,
      0.1
    );

    // Regenerate impulse response with new settings
    if (this.reverbNode) {
      const impulseResponse = this.createSyntheticImpulseResponse(
        zone.reverbTime,
        zone.reverbPreDelay
      );
      this.reverbNode.buffer = impulseResponse;
    }
  }

  checkZoneContainment(position: Vector3): ReverbZone | null {
    for (const zone of this.state.reverbZones.values()) {
      if (zone.isGlobal) continue;

      if (zone.shape === 'box') {
        const halfSize = {
          x: zone.size.x / 2,
          y: zone.size.y / 2,
          z: zone.size.z / 2,
        };
        
        if (position.x >= zone.center.x - halfSize.x &&
            position.x <= zone.center.x + halfSize.x &&
            position.y >= zone.center.y - halfSize.y &&
            position.y <= zone.center.y + halfSize.y &&
            position.z >= zone.center.z - halfSize.z &&
            position.z <= zone.center.z + halfSize.z) {
          return zone;
        }
      } else if (zone.shape === 'sphere') {
        const radius = Math.max(zone.size.x, zone.size.y, zone.size.z) / 2;
        const distance = Math.sqrt(
          Math.pow(position.x - zone.center.x, 2) +
          Math.pow(position.y - zone.center.y, 2) +
          Math.pow(position.z - zone.center.z, 2)
        );
        
        if (distance <= radius) {
          return zone;
        }
      }
    }

    return null;
  }

  // ============================================================================
  // Environment Presets
  // ============================================================================

  applyEnvironmentPreset(preset: EnvironmentPreset): void {
    const presetConfig = ENVIRONMENT_PRESETS[preset];
    if (!presetConfig) return;

    // Update active reverb zone with preset values
    if (this.state.activeReverbZone) {
      Object.assign(this.state.activeReverbZone, presetConfig);
      this.updateReverbSettings();
    }
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  private startUpdateLoop(): void {
    const intervalMs = 1000 / this.config.updateRate;
    
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, intervalMs) as unknown as number;
  }

  private update(): void {
    if (this.isDisposed || !this.state.isInitialized) return;

    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Update all sources
    for (const [id, source] of this.state.sources) {
      if (source.isPlaying) {
        // Update doppler effect
        this.updateDopplerEffect(id, deltaTime);

        // Check zone containment for reverb
        const containingZone = this.checkZoneContainment(source.position);
        if (containingZone && containingZone.id !== this.state.activeReverbZone?.id) {
          this.setActiveReverbZone(containingZone.id);
        }
      }
    }
  }

  // ============================================================================
  // Volume Control
  // ============================================================================

  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGain && !this.state.isMuted) {
      this.masterGain.gain.setTargetAtTime(
        this.state.masterVolume,
        this.audioContext!.currentTime,
        0.1
      );
    }
  }

  setMuted(muted: boolean): void {
    this.state.isMuted = muted;
    
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.state.masterVolume,
        this.audioContext!.currentTime,
        0.1
      );
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.state.isMuted);
    return this.state.isMuted;
  }

  // ============================================================================
  // Visualization Data
  // ============================================================================

  getVisualizationData(): AudioVisualizationData[] {
    const data: AudioVisualizationData[] = [];
    const listenerPos = this.state.listener.position;

    for (const [id, source] of this.state.sources) {
      const distance = Math.sqrt(
        Math.pow(source.position.x - listenerPos.x, 2) +
        Math.pow(source.position.y - listenerPos.y, 2) +
        Math.pow(source.position.z - listenerPos.z, 2)
      );

      const occlusion = this.occlusionStates.get(id);

      data.push({
        sourceId: id,
        position: source.position,
        volume: source.volume,
        isPlaying: source.isPlaying,
        distance,
        occlusionFactor: occlusion?.occlusionFactor ?? 0,
      });
    }

    return data;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on(event: SpatialAudioEventType, handler: SpatialAudioEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(handler);
    
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(type: SpatialAudioEventType, data: unknown): void {
    const event: SpatialAudioEvent = {
      type,
      timestamp: Date.now(),
      ...(data as Record<string, unknown>),
    };

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Spatial audio event handler error:', error);
        }
      });
    }
  }

  // ============================================================================
  // State Access
  // ============================================================================

  getState(): Readonly<SpatialAudioState> {
    return { ...this.state };
  }

  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  getListenerPosition(): Vector3 {
    return { ...this.state.listener.position };
  }
}

// ============================================================================
// Helper Types
// ============================================================================

interface SourceAudioNodes {
  gainNode: GainNode;
  pannerNode: PannerNode;
  sourceNode: AudioBufferSourceNode | null;
  occlusionFilter: BiquadFilterNode | null;
  reverbSend: GainNode;
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalSpatialAudioEngine: SpatialAudioEngine | null = null;

export function getSpatialAudioEngine(config?: SpatialAudioEngineConfig): SpatialAudioEngine {
  if (!globalSpatialAudioEngine) {
    globalSpatialAudioEngine = new SpatialAudioEngine(config);
  }
  return globalSpatialAudioEngine;
}

export function destroySpatialAudioEngine(): void {
  globalSpatialAudioEngine?.dispose();
  globalSpatialAudioEngine = null;
}

export function createSpatialAudioEngine(config?: SpatialAudioEngineConfig): SpatialAudioEngine {
  return new SpatialAudioEngine(config);
}

// Re-export types
export * from './types';
