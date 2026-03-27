/** [Ver001.000]
 * Audio Manager
 * =============
 * Centralized audio control system for NJZiteGeisTe.
 * Manages all audio playback including SFX, voice lines, and ambient audio.
 * 
 * Features:
 * - Web Audio API integration with AudioContext management
 * - Category-based volume control (SFX, Voice, Ambient, UI, Ability)
 * - Priority-based sound playback with automatic queue management
 * - Audio buffer caching for performance
 * - Spatial audio support
 * - Compressor/limiter for audio safety
 */

import { createLogger } from '@/utils/logger';
import {
  type AudioState,
  type AudioCategory,
  type AudioCategoryConfig,
  type AudioQuality,
  type AudioManagerState,
  type AudioManagerConfig,
  type AudioEvent,
  type AudioEventType,
  type AudioEventHandler,
  type AudioBufferCache,
  type SFXEvent,
  type ActiveSound,
  type AmbientType,
  type AmbientTrack,
  type AmbientState,
  type VoiceLine,
  type VoicePlaybackState,
  DEFAULT_AUDIO_STATE,
  AUDIO_QUALITY_CONFIGS,
  DEFAULT_CROSSFADE_DURATION,
  MAX_QUEUE_SIZE,
  PRIORITY_WEIGHTS,
} from './types';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('AudioManager');

// ============================================================================
// Audio Manager Class
// ============================================================================

export class AudioManager {
  private state: AudioState;
  private managerState: AudioManagerState;
  private ambientState: AmbientState;
  private voiceState: VoicePlaybackState;
  private listeners: Map<AudioEventType, Set<AudioEventHandler>>;
  private bufferCache: AudioBufferCache;
  private ambientTracks: Map<AmbientType, AmbientTrack>;
  private activeAmbientSource: AudioBufferSourceNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private voiceGainNode: GainNode | null = null;
  private isDisposed = false;

  constructor(config: AudioManagerConfig = {}) {
    // Initialize state
    this.state = {
      ...DEFAULT_AUDIO_STATE,
      masterVolume: config.masterVolume ?? DEFAULT_AUDIO_STATE.masterVolume,
      audioQuality: config.quality ?? DEFAULT_AUDIO_STATE.audioQuality,
      spatialAudioEnabled: config.spatialAudio ?? DEFAULT_AUDIO_STATE.spatialAudioEnabled,
    };

    // Apply category volume overrides
    if (config.categoryVolumes) {
      for (const [category, volume] of Object.entries(config.categoryVolumes)) {
        if (this.state.categories[category as AudioCategory]) {
          this.state.categories[category as AudioCategory].defaultVolume = volume;
        }
      }
    }

    // Initialize manager state
    this.managerState = {
      isInitialized: false,
      isSuspended: true,
      audioContext: null,
      masterGain: null,
      categoryGains: new Map(),
      compressor: null,
      analyser: null,
    };

    // Initialize ambient state
    this.ambientState = {
      currentTrack: null,
      previousTrack: null,
      isTransitioning: false,
      transitionProgress: 0,
    };

    // Initialize voice state
    this.voiceState = {
      isPlaying: false,
      currentLine: null,
      queue: [],
      lastPlayed: new Map(),
    };

    // Initialize listeners
    this.listeners = new Map();

    // Initialize buffer cache
    this.bufferCache = this.createBufferCache();

    // Initialize ambient tracks
    this.ambientTracks = new Map();
    this.initializeAmbientTracks();

    // Auto-initialize if requested
    if (config.autoResume !== false) {
      this.initialize().catch((err) => {
        logger.error('Auto-initialization failed', { error: err instanceof Error ? err.message : String(err) });
      });
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<boolean> {
    if (this.managerState.isInitialized) {
      return true;
    }

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      const audioContext = new AudioContextClass({
        sampleRate: AUDIO_QUALITY_CONFIGS[this.state.audioQuality].sampleRate,
        latencyHint: 'interactive',
      });

      // Create master gain
      const masterGain = audioContext.createGain();
      masterGain.gain.value = this.state.masterMuted ? 0 : this.state.masterVolume;
      masterGain.connect(audioContext.destination);

      // Create compressor for audio safety
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      masterGain.connect(compressor);
      compressor.connect(audioContext.destination);

      // Create analyser for visualizations
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      masterGain.connect(analyser);

      // Create category gain nodes
      const categoryGains = new Map<AudioCategory, GainNode>();
      for (const category of Object.keys(this.state.categories) as AudioCategory[]) {
        const gainNode = audioContext.createGain();
        const config = this.state.categories[category];
        gainNode.gain.value = config.muted ? 0 : config.defaultVolume;
        gainNode.connect(masterGain);
        categoryGains.set(category, gainNode);
      }

      // Create ambient gain node
      this.ambientGainNode = audioContext.createGain();
      this.ambientGainNode.gain.value = this.state.categories.ambient.defaultVolume;
      this.ambientGainNode.connect(categoryGains.get('ambient')!);

      // Create voice gain node
      this.voiceGainNode = audioContext.createGain();
      this.voiceGainNode.gain.value = this.state.categories.voice.defaultVolume;
      this.voiceGainNode.connect(categoryGains.get('voice')!);

      // Update state
      this.managerState = {
        isInitialized: true,
        isSuspended: audioContext.state === 'suspended',
        audioContext,
        masterGain,
        categoryGains,
        compressor,
        analyser,
      };

      // Listen for audio context state changes
      audioContext.addEventListener('statechange', () => {
        this.managerState.isSuspended = audioContext.state === 'suspended';
      });

      // Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        this.managerState.isSuspended = false;
      }

      this.emit('initialized', {});
      return true;
    } catch (error) {
      this.emit('error', { error });
      return false;
    }
  }

  // ============================================================================
  // Audio Context Control
  // ============================================================================

  async suspend(): Promise<void> {
    if (!this.managerState.audioContext || this.managerState.isSuspended) {
      return;
    }

    await this.managerState.audioContext.suspend();
    this.managerState.isSuspended = true;
    this.emit('suspended', {});
  }

  async resume(): Promise<boolean> {
    if (!this.managerState.audioContext) {
      return this.initialize();
    }

    if (!this.managerState.isSuspended) {
      return true;
    }

    try {
      await this.managerState.audioContext.resume();
      this.managerState.isSuspended = false;
      this.emit('resumed', {});
      return true;
    } catch (error) {
      this.emit('error', { error });
      return false;
    }
  }

  // ============================================================================
  // Volume Control
  // ============================================================================

  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.state.masterVolume = clampedVolume;

    if (this.managerState.masterGain && !this.state.masterMuted) {
      this.managerState.masterGain.gain.setTargetAtTime(
        clampedVolume,
        this.managerState.audioContext!.currentTime,
        0.1
      );
    }

    this.emit('volumeChanged', { category: 'master', volume: clampedVolume });
  }

  getMasterVolume(): number {
    return this.state.masterVolume;
  }

  setCategoryVolume(category: AudioCategory, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.state.categories[category].defaultVolume = clampedVolume;

    const gainNode = this.managerState.categoryGains.get(category);
    if (gainNode && !this.state.categories[category].muted) {
      gainNode.gain.setTargetAtTime(
        clampedVolume,
        this.managerState.audioContext!.currentTime,
        0.1
      );
    }

    this.emit('volumeChanged', { category, volume: clampedVolume });
  }

  getCategoryVolume(category: AudioCategory): number {
    return this.state.categories[category].defaultVolume;
  }

  setMasterMuted(muted: boolean): void {
    this.state.masterMuted = muted;

    if (this.managerState.masterGain) {
      this.managerState.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.state.masterVolume,
        this.managerState.audioContext!.currentTime,
        0.1
      );
    }

    this.emit('categoryMuted', { category: 'master', muted });
  }

  toggleMasterMute(): boolean {
    this.setMasterMuted(!this.state.masterMuted);
    return this.state.masterMuted;
  }

  isMasterMuted(): boolean {
    return this.state.masterMuted;
  }

  setCategoryMuted(category: AudioCategory, muted: boolean): void {
    this.state.categories[category].muted = muted;

    const gainNode = this.managerState.categoryGains.get(category);
    if (gainNode) {
      gainNode.gain.setTargetAtTime(
        muted ? 0 : this.state.categories[category].defaultVolume,
        this.managerState.audioContext!.currentTime,
        0.1
      );
    }

    this.emit('categoryMuted', { category, muted });
  }

  toggleCategoryMute(category: AudioCategory): boolean {
    const newMuted = !this.state.categories[category].muted;
    this.setCategoryMuted(category, newMuted);
    return newMuted;
  }

  isCategoryMuted(category: AudioCategory): boolean {
    return this.state.categories[category].muted;
  }

  // ============================================================================
  // SFX Playback
  // ============================================================================

  async playSFX(event: SFXEvent): Promise<string | null> {
    if (!this.managerState.isInitialized) {
      await this.initialize();
    }

    if (!this.managerState.audioContext || this.isDisposed) {
      return null;
    }

    // Check if category is muted
    if (this.state.categories[event.category].muted || this.state.masterMuted) {
      return null;
    }

    // Check concurrent limit
    const activeCount = this.getActiveSoundCount(event.category);
    const maxConcurrent = this.state.categories[event.category].maxConcurrent;

    if (activeCount >= maxConcurrent) {
      // Try to interrupt lower priority sounds
      const canPlay = this.handlePriority(event);
      if (!canPlay) {
        return null;
      }
    }

    try {
      const soundId = `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Apply delay if specified
      if (event.delay && event.delay > 0) {
        setTimeout(() => this.playSFXInternal(soundId, event), event.delay);
        return soundId;
      }

      await this.playSFXInternal(soundId, event);
      return soundId;
    } catch (error) {
      this.emit('error', { error, context: 'playSFX' });
      return null;
    }
  }

  private async playSFXInternal(soundId: string, event: SFXEvent): Promise<void> {
    if (!this.managerState.audioContext) return;

    let buffer: AudioBuffer | undefined;

    if (event.audioUrl) {
      buffer = await this.loadAudioBuffer(event.audioUrl);
    }

    if (!buffer) {
      // Create synthetic sound for testing/development
      buffer = this.createSyntheticBuffer(event);
    }

    const source = this.managerState.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = event.loop ?? false;

    // Create gain node for this sound
    const gainNode = this.managerState.audioContext.createGain();
    const categoryVolume = this.state.categories[event.category].defaultVolume;
    const volumeModifier = event.volumeModifier ?? 1;
    gainNode.gain.value = categoryVolume * volumeModifier * this.state.masterVolume;

    // Connect to category gain
    source.connect(gainNode);
    const categoryGain = this.managerState.categoryGains.get(event.category);
    if (categoryGain) {
      gainNode.connect(categoryGain);
    }

    // Handle spatial audio if position provided
    if (event.spatialPosition && this.state.spatialAudioEnabled) {
      const panner = this.createSpatialPanner(event.spatialPosition);
      gainNode.disconnect();
      gainNode.connect(panner);
      panner.connect(categoryGain!);
    }

    // Track active sound
    const activeSound: ActiveSound = {
      event,
      sourceNode: source,
      gainNode,
      startTime: this.managerState.audioContext.currentTime,
      pausedAt: null,
    };

    // Use a Map to track active sounds internally
    (this as unknown as { activeSounds: Map<string, ActiveSound> }).activeSounds ??= new Map();
    (this as unknown as { activeSounds: Map<string, ActiveSound> }).activeSounds.set(soundId, activeSound);

    // Handle cleanup
    source.onended = () => {
      (this as unknown as { activeSounds: Map<string, ActiveSound> }).activeSounds?.delete(soundId);
      this.emit('sfxStopped', { soundId, event });
    };

    source.start(0);
    this.emit('sfxPlayed', { soundId, event });
  }

  stopSFX(soundId: string): void {
    const activeSounds = (this as unknown as { activeSounds?: Map<string, ActiveSound> }).activeSounds;
    const sound = activeSounds?.get(soundId);
    if (sound?.sourceNode) {
      try {
        sound.sourceNode.stop();
        sound.sourceNode.disconnect();
      } catch {
        // Already stopped
      }
      activeSounds?.delete(soundId);
    }
  }

  stopAllSFX(): void {
    const activeSounds = (this as unknown as { activeSounds?: Map<string, ActiveSound> }).activeSounds;
    activeSounds?.forEach((sound, id) => {
      this.stopSFX(id);
    });
  }

  stopSFXByCategory(category: AudioCategory): void {
    const activeSounds = (this as unknown as { activeSounds?: Map<string, ActiveSound> }).activeSounds;
    activeSounds?.forEach((sound, id) => {
      if (sound.event.category === category) {
        this.stopSFX(id);
      }
    });
  }

  private getActiveSoundCount(category: AudioCategory): number {
    const activeSounds = (this as unknown as { activeSounds?: Map<string, ActiveSound> }).activeSounds;
    if (!activeSounds) return 0;
    return Array.from(activeSounds.values()).filter(s => s.event.category === category).length;
  }

  private handlePriority(event: SFXEvent): boolean {
    const activeSounds = (this as unknown as { activeSounds?: Map<string, ActiveSound> }).activeSounds;
    if (!activeSounds) return true;

    const eventPriority = PRIORITY_WEIGHTS[event.priority];
    const categorySounds = Array.from(activeSounds.entries())
      .filter(([, s]) => s.event.category === event.category)
      .sort((a, b) => PRIORITY_WEIGHTS[a[1].event.priority] - PRIORITY_WEIGHTS[b[1].event.priority]);

    // Find lowest priority sound that we can replace
    for (const [id, sound] of categorySounds) {
      if (PRIORITY_WEIGHTS[sound.event.priority] < eventPriority) {
        this.stopSFX(id);
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // Ambient Audio
  // ============================================================================

  private initializeAmbientTracks(): void {
    const tracks: AmbientTrack[] = [
      { id: 'hub_sator', displayName: 'SATOR Hub', audioUrl: '/audio/ambient/sator.mp3', loop: true, crossfadeDuration: 2000, baseVolume: 0.5 },
      { id: 'hub_rotas', displayName: 'ROTAS Hub', audioUrl: '/audio/ambient/rotas.mp3', loop: true, crossfadeDuration: 2000, baseVolume: 0.5 },
      { id: 'hub_arepo', displayName: 'AREPO Hub', audioUrl: '/audio/ambient/arepo.mp3', loop: true, crossfadeDuration: 2000, baseVolume: 0.5 },
      { id: 'hub_opera', displayName: 'OPERA Hub', audioUrl: '/audio/ambient/opera.mp3', loop: true, crossfadeDuration: 2000, baseVolume: 0.5 },
      { id: 'hub_tenet', displayName: 'TeNET Navigation', audioUrl: '/audio/ambient/tenet.mp3', loop: true, crossfadeDuration: 2000, baseVolume: 0.5 },
      { id: 'menu_main', displayName: 'Main Menu', audioUrl: '/audio/ambient/menu.mp3', loop: true, crossfadeDuration: 3000, baseVolume: 0.4 },
      { id: 'match_ongoing', displayName: 'Match Background', audioUrl: '/audio/ambient/match.mp3', loop: true, crossfadeDuration: 2000, baseVolume: 0.3 },
      { id: 'match_intense', displayName: 'Intense Match', audioUrl: '/audio/ambient/intense.mp3', loop: true, crossfadeDuration: 1500, baseVolume: 0.5 },
      { id: 'victory', displayName: 'Victory', audioUrl: '/audio/ambient/victory.mp3', loop: false, crossfadeDuration: 1000, baseVolume: 0.6 },
      { id: 'defeat', displayName: 'Defeat', audioUrl: '/audio/ambient/defeat.mp3', loop: false, crossfadeDuration: 1000, baseVolume: 0.5 },
    ];

    for (const track of tracks) {
      this.ambientTracks.set(track.id, track);
    }
  }

  async playAmbient(type: AmbientType, crossfadeDuration?: number): Promise<void> {
    if (!this.managerState.isInitialized) {
      await this.initialize();
    }

    if (this.ambientState.currentTrack === type) {
      return;
    }

    const track = this.ambientTracks.get(type);
    if (!track) {
      return;
    }

    const fadeDuration = crossfadeDuration ?? track.crossfadeDuration;

    // Update state
    this.ambientState.previousTrack = this.ambientState.currentTrack;
    this.ambientState.currentTrack = type;
    this.ambientState.isTransitioning = true;

    // Fade out current ambient
    if (this.activeAmbientSource && this.ambientGainNode) {
      const currentGain = this.ambientGainNode.gain.value;
      this.ambientGainNode.gain.setTargetAtTime(
        0,
        this.managerState.audioContext!.currentTime,
        fadeDuration / 3000
      );

      // Stop after fade
      setTimeout(() => {
        try {
          this.activeAmbientSource?.stop();
          this.activeAmbientSource?.disconnect();
        } catch {
          // Already stopped
        }
      }, fadeDuration);
    }

    // Load and play new track
    try {
      const buffer = await this.loadAudioBuffer(track.audioUrl);
      if (!buffer || !this.managerState.audioContext || !this.ambientGainNode) {
        return;
      }

      const source = this.managerState.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = track.loop;

      // Start at 0 volume and fade in
      const oldGain = this.ambientGainNode.gain.value;
      this.ambientGainNode.gain.value = 0;
      source.connect(this.ambientGainNode);

      source.start(0);
      this.activeAmbientSource = source;

      // Fade in
      const targetVolume = track.baseVolume * this.state.categories.ambient.defaultVolume;
      this.ambientGainNode.gain.setTargetAtTime(
        targetVolume,
        this.managerState.audioContext.currentTime,
        fadeDuration / 3000
      );

      source.onended = () => {
        if (!track.loop) {
          this.ambientState.currentTrack = null;
        }
      };

      setTimeout(() => {
        this.ambientState.isTransitioning = false;
      }, fadeDuration);

      this.emit('ambientChanged', { track: type, previousTrack: this.ambientState.previousTrack });
    } catch (error) {
      this.emit('error', { error, context: 'playAmbient' });
    }
  }

  stopAmbient(fadeOutDuration: number = DEFAULT_CROSSFADE_DURATION): void {
    if (!this.ambientGainNode || !this.managerState.audioContext) {
      return;
    }

    this.ambientGainNode.gain.setTargetAtTime(
      0,
      this.managerState.audioContext.currentTime,
      fadeOutDuration / 3000
    );

    setTimeout(() => {
      try {
        this.activeAmbientSource?.stop();
        this.activeAmbientSource?.disconnect();
      } catch {
        // Already stopped
      }
      this.activeAmbientSource = null;
      this.ambientState.currentTrack = null;
    }, fadeOutDuration);
  }

  getCurrentAmbient(): AmbientType | null {
    return this.ambientState.currentTrack;
  }

  // ============================================================================
  // Voice Playback
  // ============================================================================

  async playVoiceLine(line: VoiceLine): Promise<boolean> {
    if (!this.managerState.isInitialized) {
      await this.initialize();
    }

    // Check cooldown
    const lastPlayed = this.voiceState.lastPlayed.get(line.id);
    if (lastPlayed && Date.now() - lastPlayed < line.cooldown * 1000) {
      return false;
    }

    // Stop current voice if playing
    if (this.voiceState.isPlaying) {
      this.stopVoice();
    }

    try {
      this.voiceState.currentLine = line;
      this.voiceState.isPlaying = true;
      this.voiceState.lastPlayed.set(line.id, Date.now());

      // If no audio URL, use speech synthesis as fallback
      if (!line.audioUrl) {
        this.playVoiceWithSpeechSynthesis(line);
        return true;
      }

      const buffer = await this.loadAudioBuffer(line.audioUrl);
      if (!buffer || !this.managerState.audioContext || !this.voiceGainNode) {
        this.playVoiceWithSpeechSynthesis(line);
        return true;
      }

      const source = this.managerState.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.voiceGainNode);

      source.onended = () => {
        this.voiceState.isPlaying = false;
        this.voiceState.currentLine = null;
        this.emit('voiceEnded', { line });
        this.processVoiceQueue();
      };

      source.start(0);
      this.emit('voiceStarted', { line });
      return true;
    } catch (error) {
      this.emit('error', { error, context: 'playVoiceLine' });
      // Try fallback
      this.playVoiceWithSpeechSynthesis(line);
      return true;
    }
  }

  private playVoiceWithSpeechSynthesis(line: VoiceLine): void {
    if (!window.speechSynthesis) {
      this.voiceState.isPlaying = false;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(line.fallbackText);
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => {
      this.voiceState.isPlaying = false;
      this.voiceState.currentLine = null;
      this.emit('voiceEnded', { line });
      this.processVoiceQueue();
    };

    utterance.onerror = () => {
      this.voiceState.isPlaying = false;
      this.voiceState.currentLine = null;
    };

    window.speechSynthesis.speak(utterance);
    this.emit('voiceStarted', { line, synthesized: true });
  }

  queueVoiceLine(line: VoiceLine): boolean {
    if (this.voiceState.queue.length >= MAX_QUEUE_SIZE) {
      return false;
    }

    this.voiceState.queue.push(line);
    return true;
  }

  private processVoiceQueue(): void {
    if (this.voiceState.queue.length === 0 || this.voiceState.isPlaying) {
      return;
    }

    const nextLine = this.voiceState.queue.shift();
    if (nextLine) {
      this.playVoiceLine(nextLine);
    }
  }

  stopVoice(): void {
    // Stop any speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.voiceState.isPlaying = false;
    this.voiceState.currentLine = null;
    this.voiceState.queue = [];
  }

  isVoicePlaying(): boolean {
    return this.voiceState.isPlaying;
  }

  getVoiceQueueLength(): number {
    return this.voiceState.queue.length;
  }

  clearVoiceQueue(): void {
    this.voiceState.queue = [];
  }

  // ============================================================================
  // Audio Buffer Management
  // ============================================================================

  private createBufferCache(): AudioBufferCache {
    const cache = new Map<string, AudioBuffer>();

    return {
      get: (url: string) => cache.get(url),
      set: (url: string, buffer: AudioBuffer) => cache.set(url, buffer),
      has: (url: string) => cache.has(url),
      clear: () => cache.clear(),
      get size() { return cache.size; },
    };
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | undefined> {
    // Check cache first
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url);
    }

    if (!this.managerState.audioContext) {
      return undefined;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.managerState.audioContext.decodeAudioData(arrayBuffer);

      // Cache the buffer
      this.bufferCache.set(url, audioBuffer);

      return audioBuffer;
    } catch (error) {
      console.warn(`Failed to load audio from ${url}:`, error);
      return undefined;
    }
  }

  private createSyntheticBuffer(event: SFXEvent): AudioBuffer {
    if (!this.managerState.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const sampleRate = this.managerState.audioContext.sampleRate;
    const duration = event.duration || 0.3;
    const length = sampleRate * duration;
    const buffer = this.managerState.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate simple tone based on event type
    const frequency = this.getFrequencyForEventType(event.type);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Add envelope
      const envelope = Math.min(1, (1 - t / duration) * 10);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  private getFrequencyForEventType(type: string): number {
    const frequencies: Record<string, number> = {
      'ability_cast': 440,
      'ability_hit': 880,
      'ability_block': 220,
      'ui_click': 660,
      'ui_hover': 330,
      'ui_success': 550,
      'ui_error': 150,
      'ui_transition': 440,
      'event_alert': 1000,
      'event_achievement': 1320,
      'ambient_hub': 110,
      'ambient_match': 55,
    };
    return frequencies[type] || 440;
  }

  // ============================================================================
  // Spatial Audio
  // ============================================================================

  private createSpatialPanner(position: { x: number; y: number; z: number }): PannerNode {
    if (!this.managerState.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const panner = this.managerState.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;

    return panner;
  }

  // ============================================================================
  // Quality Settings
  // ============================================================================

  setQuality(quality: AudioQuality): void {
    this.state.audioQuality = quality;

    // Recreate AudioContext with new sample rate if needed
    if (this.managerState.audioContext) {
      const newSampleRate = AUDIO_QUALITY_CONFIGS[quality].sampleRate;
      if (this.managerState.audioContext.sampleRate !== newSampleRate) {
        // Suspend current context
        this.suspend();
        // Re-initialize with new quality
        this.managerState.isInitialized = false;
        this.initialize();
      }
    }
  }

  getQuality(): AudioQuality {
    return this.state.audioQuality;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on(event: AudioEventType, handler: AudioEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(type: AudioEventType, data: unknown): void {
    const event: AudioEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          logger.error('Audio event handler error', { error: error instanceof Error ? error.message : String(error) });
        }
      });
    }

    // Also emit to wildcard listeners (stateChange)
    const wildcards = this.listeners.get('initialized');
    if (wildcards && type !== 'initialized') {
      wildcards.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          logger.error('Audio wildcard handler error', { error: error instanceof Error ? error.message : String(error) });
        }
      });
    }
  }

  // ============================================================================
  // State Access
  // ============================================================================

  getState(): Readonly<AudioState> {
    return { ...this.state };
  }

  isInitialized(): boolean {
    return this.managerState.isInitialized;
  }

  isSuspended(): boolean {
    return this.managerState.isSuspended;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    this.isDisposed = true;

    // Stop all sounds
    this.stopAllSFX();
    this.stopVoice();
    this.stopAmbient(0);

    // Disconnect nodes
    this.managerState.masterGain?.disconnect();
    this.managerState.compressor?.disconnect();
    this.managerState.analyser?.disconnect();

    // Close audio context
    if (this.managerState.audioContext?.state !== 'closed') {
      this.managerState.audioContext?.close();
    }

    // Clear listeners
    this.listeners.clear();

    // Clear cache
    this.bufferCache.clear();

    // Reset state
    this.managerState = {
      isInitialized: false,
      isSuspended: true,
      audioContext: null,
      masterGain: null,
      categoryGains: new Map(),
      compressor: null,
      analyser: null,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalAudioManager: AudioManager | null = null;

export function getAudioManager(config?: AudioManagerConfig): AudioManager {
  if (!globalAudioManager) {
    globalAudioManager = new AudioManager(config);
  }
  return globalAudioManager;
}

export function destroyAudioManager(): void {
  if (globalAudioManager) {
    globalAudioManager.dispose();
    globalAudioManager = null;
  }
}

export function createAudioManager(config?: AudioManagerConfig): AudioManager {
  return new AudioManager(config);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  AudioState,
  AudioCategory,
  AudioCategoryConfig,
  AudioQuality,
  AudioManagerConfig,
  AudioManagerState,
  SFXEvent,
  AmbientType,
  AmbientTrack,
  VoiceLine,
};
