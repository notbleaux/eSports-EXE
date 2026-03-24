/**
 * [Ver001.000]
 * Alternative Input Methods for Motor Accessibility
 * Head tracking, sip-and-puff, and joystick/gamepad support
 */

// ============================================
// Head Tracking Support
// ============================================

export interface HeadTrackingConfig {
  /** Sensitivity multiplier */
  sensitivity: number;
  /** Deadzone for head movement (degrees) */
  deadzone: number;
  /** Smoothing factor (0-1) */
  smoothing: number;
  /** Invert X axis */
  invertX: boolean;
  /** Invert Y axis */
  invertY: boolean;
  /** Enable head tilt for clicking */
  tiltClick: boolean;
  /** Tilt threshold for click (degrees) */
  tiltThreshold: number;
}

export interface HeadPosition {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (up to down)
  z: number; // Distance from camera
  pitch: number; // Up/down rotation
  yaw: number; // Left/right rotation
  roll: number; // Tilt
  timestamp: number;
}

export const DEFAULT_HEAD_TRACKING_CONFIG: HeadTrackingConfig = {
  sensitivity: 1.5,
  deadzone: 5,
  smoothing: 0.6,
  invertX: false,
  invertY: false,
  tiltClick: true,
  tiltThreshold: 15,
};

class HeadTrackingManager {
  private config: HeadTrackingConfig;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private animationFrame: number | null = null;
  private currentPosition: HeadPosition | null = null;
  private smoothedPosition: HeadPosition | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private isActive: boolean = false;
  private lastTiltClick: number = 0;

  constructor(config: Partial<HeadTrackingConfig> = {}) {
    this.config = { ...DEFAULT_HEAD_TRACKING_CONFIG, ...config };
  }

  async initialize(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      await new Promise<void>((resolve) => {
        this.videoElement!.onloadedmetadata = () => resolve();
      });

      this.isActive = true;
      this.startTracking();
      this.emit('initialized');

      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  private startTracking(): void {
    const track = () => {
      if (!this.isActive) return;

      const position = this.detectHeadPosition();
      if (position) {
        this.currentPosition = position;
        this.smoothedPosition = this.applySmoothing(position);
        this.processPosition(this.smoothedPosition);
        this.emit('position', this.smoothedPosition);
      }

      this.animationFrame = requestAnimationFrame(track);
    };

    this.animationFrame = requestAnimationFrame(track);
  }

  private detectHeadPosition(): HeadPosition | null {
    // Placeholder for actual head detection
    // In production, use face-api.js or MediaPipe Face Mesh
    return {
      x: Math.sin(Date.now() / 1000) * 0.3,
      y: Math.cos(Date.now() / 1500) * 0.2,
      z: 0.5,
      pitch: 0,
      yaw: Math.sin(Date.now() / 1000) * 10,
      roll: Math.cos(Date.now() / 2000) * 5,
      timestamp: Date.now(),
    };
  }

  private applySmoothing(position: HeadPosition): HeadPosition {
    if (!this.smoothedPosition) return position;

    const s = this.config.smoothing;
    return {
      x: this.smoothedPosition.x * s + position.x * (1 - s),
      y: this.smoothedPosition.y * s + position.y * (1 - s),
      z: this.smoothedPosition.z * s + position.z * (1 - s),
      pitch: this.smoothedPosition.pitch * s + position.pitch * (1 - s),
      yaw: this.smoothedPosition.yaw * s + position.yaw * (1 - s),
      roll: this.smoothedPosition.roll * s + position.roll * (1 - s),
      timestamp: position.timestamp,
    };
  }

  private processPosition(position: HeadPosition): void {
    // Apply deadzone
    const applyDeadzone = (value: number) => {
      return Math.abs(value) < this.config.deadzone / 45 ? 0 : value;
    };

    const x = applyDeadzone(position.x) * this.config.sensitivity * (this.config.invertX ? -1 : 1);
    const y = applyDeadzone(position.y) * this.config.sensitivity * (this.config.invertY ? -1 : 1);

    // Move cursor
    this.emit('cursor', {
      x: (x + 1) / 2 * window.innerWidth,
      y: (y + 1) / 2 * window.innerHeight,
    });

    // Check for tilt click
    if (this.config.tiltClick) {
      const now = Date.now();
      if (
        Math.abs(position.roll) > this.config.tiltThreshold &&
        now - this.lastTiltClick > 1000
      ) {
        this.lastTiltClick = now;
        this.emit('click');
      }
    }
  }

  getPosition(): HeadPosition | null {
    return this.smoothedPosition;
  }

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }

  stop(): void {
    this.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.stream?.getTracks().forEach((track) => track.stop());
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

// ============================================
// Sip-and-Puff Device Support
// ============================================

export type SipPuffAction = 'sip' | 'puff' | 'hardSip' | 'hardPuff';
export type SipPuffPattern = 'single' | 'double' | 'hold';

export interface SipPuffConfig {
  /** Threshold for sip detection */
  sipThreshold: number;
  /** Threshold for puff detection */
  puffThreshold: number;
  /** Threshold for hard sip/puff */
  hardThreshold: number;
  /** Minimum duration for hold detection (ms) */
  holdDuration: number;
  /** Maximum time between double actions (ms) */
  doubleInterval: number;
  /** Debounce time (ms) */
  debounce: number;
}

export interface SipPuffEvent {
  action: SipPuffAction;
  pattern: SipPuffPattern;
  duration: number;
  intensity: number;
  timestamp: number;
}

export const DEFAULT_SIP_PUFF_CONFIG: SipPuffConfig = {
  sipThreshold: -0.3,
  puffThreshold: 0.3,
  hardThreshold: 0.6,
  holdDuration: 800,
  doubleInterval: 300,
  debounce: 100,
};

class SipPuffManager {
  private config: SipPuffConfig;
  private listeners: Map<string, Set<(event: SipPuffEvent) => void>> = new Map();
  private audioContext: AudioContext | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isActive: boolean = false;
  private animationFrame: number | null = null;
  
  // State tracking
  private lastAction: SipPuffAction | null = null;
  private lastActionTime: number = 0;
  private actionStartTime: number = 0;
  private isActionActive: boolean = false;
  private maxIntensity: number = 0;

  constructor(config: Partial<SipPuffConfig> = {}) {
    this.config = { ...DEFAULT_SIP_PUFF_CONFIG, ...config };
  }

  async initialize(): Promise<boolean> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      this.microphone.connect(this.analyser);
      
      this.isActive = true;
      this.startDetection();
      this.emit('initialized');
      
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  private startDetection(): void {
    const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
    
    const detect = () => {
      if (!this.isActive) return;
      
      this.analyser!.getByteFrequencyData(dataArray);
      const pressure = this.calculatePressure(dataArray);
      
      this.processPressure(pressure);
      
      this.animationFrame = requestAnimationFrame(detect);
    };
    
    this.animationFrame = requestAnimationFrame(detect);
  }

  private calculatePressure(dataArray: Uint8Array): number {
    // Calculate average intensity from low frequencies
    // Negative values = sip, positive = puff
    const lowFreq = dataArray.slice(0, 10);
    const average = lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length;
    return (average / 128) - 1; // Normalize to -1 to 1
  }

  private processPressure(pressure: number): void {
    const now = Date.now();
    let action: SipPuffAction | null = null;

    // Detect action type
    if (pressure < -this.config.hardThreshold) {
      action = 'hardSip';
    } else if (pressure < this.config.sipThreshold) {
      action = 'sip';
    } else if (pressure > this.config.hardThreshold) {
      action = 'hardPuff';
    } else if (pressure > this.config.puffThreshold) {
      action = 'puff';
    }

    // Track intensity
    if (action) {
      this.maxIntensity = Math.max(this.maxIntensity, Math.abs(pressure));
    }

    // State machine
    if (action && !this.isActionActive) {
      // Action started
      this.isActionActive = true;
      this.actionStartTime = now;
      this.maxIntensity = Math.abs(pressure);
    } else if (!action && this.isActionActive) {
      // Action ended
      this.isActionActive = false;
      const duration = now - this.actionStartTime;
      
      // Determine pattern
      let pattern: SipPuffPattern = 'single';
      if (duration >= this.config.holdDuration) {
        pattern = 'hold';
      } else if (now - this.lastActionTime < this.config.doubleInterval) {
        pattern = 'double';
      }

      // Emit event
      if (this.lastAction) {
        const event: SipPuffEvent = {
          action: this.lastAction,
          pattern,
          duration,
          intensity: this.maxIntensity,
          timestamp: now,
        };
        this.emit('action', event);
      }

      this.lastAction = null;
    }

    if (action) {
      this.lastAction = action;
      this.lastActionTime = now;
    }
  }

  on(event: string, callback: (event: SipPuffEvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  stop(): void {
    this.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.audioContext?.close();
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

// ============================================
// Joystick/Gamepad Support
// ============================================

export interface GamepadConfig {
  /** Deadzone for analog sticks (0-1) */
  deadzone: number;
  /** Sensitivity for cursor movement */
  sensitivity: number;
  /** Button mapping */
  buttonMapping: Record<number, string>;
  /** Enable analog cursor */
  analogCursor: boolean;
  /** Cursor speed */
  cursorSpeed: number;
}

export interface GamepadState {
  buttons: boolean[];
  axes: number[];
  timestamp: number;
}

export const DEFAULT_GAMEPAD_CONFIG: GamepadConfig = {
  deadzone: 0.15,
  sensitivity: 1,
  buttonMapping: {
    0: 'select',
    1: 'back',
    2: 'menu',
    3: 'home',
    12: 'up',
    13: 'down',
    14: 'left',
    15: 'right',
  },
  analogCursor: true,
  cursorSpeed: 8,
};

class GamepadManager {
  private config: GamepadConfig;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private animationFrame: number | null = null;
  private connectedGamepads: Map<number, Gamepad> = new Map();
  private previousStates: Map<number, GamepadState> = new Map();
  private cursorPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  constructor(config: Partial<GamepadConfig> = {}) {
    this.config = { ...DEFAULT_GAMEPAD_CONFIG, ...config };
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (e) => {
      this.connectedGamepads.set(e.gamepad.index, e.gamepad);
      this.emit('connected', e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      this.connectedGamepads.delete(e.gamepad.index);
      this.previousStates.delete(e.gamepad.index);
      this.emit('disconnected', e.gamepad);
    });
  }

  start(): void {
    const poll = () => {
      this.pollGamepads();
      this.animationFrame = requestAnimationFrame(poll);
    };
    this.animationFrame = requestAnimationFrame(poll);
  }

  private pollGamepads(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    for (const gamepad of gamepads) {
      if (!gamepad) continue;

      const state: GamepadState = {
        buttons: gamepad.buttons.map((b) => b.pressed),
        axes: [...gamepad.axes],
        timestamp: Date.now(),
      };

      const previous = this.previousStates.get(gamepad.index);
      
      if (previous) {
        this.detectChanges(gamepad.index, previous, state);
      }

      this.previousStates.set(gamepad.index, state);
      
      // Process analog input for cursor
      if (this.config.analogCursor) {
        this.processAnalogInput(state);
      }
    }
  }

  private detectChanges(index: number, previous: GamepadState, current: GamepadState): void {
    // Detect button presses
    current.buttons.forEach((pressed, i) => {
      if (pressed && !previous.buttons[i]) {
        const action = this.config.buttonMapping[i] || `button${i}`;
        this.emit('buttonPress', { gamepadIndex: index, button: i, action });
      }
      if (!pressed && previous.buttons[i]) {
        this.emit('buttonRelease', { gamepadIndex: index, button: i });
      }
    });

    // Detect axis changes
    current.axes.forEach((value, i) => {
      const prevValue = previous.axes[i];
      if (Math.abs(value - prevValue) > 0.1) {
        this.emit('axisChange', { gamepadIndex: index, axis: i, value });
      }
    });
  }

  private processAnalogInput(state: GamepadState): void {
    // Use left stick (axes 0, 1) for cursor
    const x = Math.abs(state.axes[0]) > this.config.deadzone ? state.axes[0] : 0;
    const y = Math.abs(state.axes[1]) > this.config.deadzone ? state.axes[1] : 0;

    if (x !== 0 || y !== 0) {
      this.cursorPosition.x += x * this.config.cursorSpeed * this.config.sensitivity;
      this.cursorPosition.y += y * this.config.cursorSpeed * this.config.sensitivity;

      // Clamp to screen
      this.cursorPosition.x = Math.max(0, Math.min(window.innerWidth, this.cursorPosition.x));
      this.cursorPosition.y = Math.max(0, Math.min(window.innerHeight, this.cursorPosition.y));

      this.emit('cursorMove', { ...this.cursorPosition });
    }
  }

  getCursorPosition(): { x: number; y: number } {
    return { ...this.cursorPosition };
  }

  getConnectedGamepads(): Gamepad[] {
    return Array.from(this.connectedGamepads.values());
  }

  vibrate(gamepadIndex: number, intensity: number, duration: number): void {
    const gamepad = this.connectedGamepads.get(gamepadIndex);
    if (gamepad?.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.5,
      });
    }
  }

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.connectedGamepads.clear();
    this.previousStates.clear();
  }
}

// Export managers
export const headTracking = new HeadTrackingManager();
export const sipPuff = new SipPuffManager();
export const gamepad = new GamepadManager();

// Combined alternative input hook
export function useAlternativeInput(config?: {
  headTracking?: Partial<HeadTrackingConfig>;
  sipPuff?: Partial<SipPuffConfig>;
  gamepad?: Partial<GamepadConfig>;
}) {
  return {
    headTracking: new HeadTrackingManager(config?.headTracking),
    sipPuff: new SipPuffManager(config?.sipPuff),
    gamepad: new GamepadManager(config?.gamepad),
    defaultConfigs: {
      headTracking: DEFAULT_HEAD_TRACKING_CONFIG,
      sipPuff: DEFAULT_SIP_PUFF_CONFIG,
      gamepad: DEFAULT_GAMEPAD_CONFIG,
    },
  };
}

export { HeadTrackingManager, SipPuffManager, GamepadManager };
