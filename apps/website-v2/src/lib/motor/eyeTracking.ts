/**
 * [Ver001.000]
 * Eye Tracking Integration for Motor Accessibility
 * WebGazer.js integration with gaze-based selection and dwell clicking
 */

export interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
  confidence: number;
}

export interface CalibrationPoint {
  x: number;
  y: number;
  index: number;
}

export interface EyeTrackingConfig {
  /** Dwell time in milliseconds before triggering click */
  dwellTime: number;
  /** Radius in pixels for dwell detection */
  dwellRadius: number;
  /** Enable click on blink */
  blinkClick: boolean;
  /** Show gaze cursor */
  showCursor: boolean;
  /** Smoothing factor (0-1) */
  smoothing: number;
  /** Prediction interval in ms */
  predictionInterval: number;
  /** Webcam constraints */
  videoConstraints: MediaTrackConstraints;
}

export interface DwellTarget {
  element: HTMLElement;
  bounds: DOMRect;
  dwellStartTime: number | null;
  isDwelling: boolean;
  dwellProgress: number;
}

export type CalibrationStatus = 'unstarted' | 'in-progress' | 'completed' | 'failed';
export type EyeTrackingStatus = 'inactive' | 'initializing' | 'active' | 'error';

// Default calibration points (9-point grid)
export const DEFAULT_CALIBRATION_POINTS: CalibrationPoint[] = [
  { x: 0.1, y: 0.1, index: 0 },
  { x: 0.5, y: 0.1, index: 1 },
  { x: 0.9, y: 0.1, index: 2 },
  { x: 0.1, y: 0.5, index: 3 },
  { x: 0.5, y: 0.5, index: 4 },
  { x: 0.9, y: 0.5, index: 5 },
  { x: 0.1, y: 0.9, index: 6 },
  { x: 0.5, y: 0.9, index: 7 },
  { x: 0.9, y: 0.9, index: 8 },
];

export const DEFAULT_EYE_TRACKING_CONFIG: EyeTrackingConfig = {
  dwellTime: 800,
  dwellRadius: 30,
  blinkClick: false,
  showCursor: true,
  smoothing: 0.7,
  predictionInterval: 50,
  videoConstraints: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user',
  },
};

// Gaze point smoothing buffer
class GazeSmoother {
  private buffer: GazePoint[] = [];
  private maxSize: number = 5;

  add(point: GazePoint): GazePoint {
    this.buffer.push(point);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    return this.getSmoothed();
  }

  getSmoothed(): GazePoint {
    if (this.buffer.length === 0) {
      return { x: 0, y: 0, timestamp: Date.now(), confidence: 0 };
    }

    const sum = this.buffer.reduce(
      (acc, p) => ({
        x: acc.x + p.x,
        y: acc.y + p.y,
        confidence: acc.confidence + p.confidence,
      }),
      { x: 0, y: 0, confidence: 0 }
    );

    return {
      x: sum.x / this.buffer.length,
      y: sum.y / this.buffer.length,
      timestamp: this.buffer[this.buffer.length - 1].timestamp,
      confidence: sum.confidence / this.buffer.length,
    };
  }

  clear(): void {
    this.buffer = [];
  }
}

class EyeTrackingManager {
  private config: EyeTrackingConfig;
  private status: EyeTrackingStatus = 'inactive';
  private calibrationStatus: CalibrationStatus = 'unstarted';
  private currentGaze: GazePoint | null = null;
  private smoother: GazeSmoother = new GazeSmoother();
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private predictionLoop: number | null = null;
  private dwellTargets: Map<HTMLElement, DwellTarget> = new Map();
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private cursorElement: HTMLElement | null = null;
  private currentDwellTarget: DwellTarget | null = null;
  private calibrationPoints: CalibrationPoint[] = [];
  private currentCalibrationIndex: number = 0;
  private calibrationData: { x: number; y: number; expectedX: number; expectedY: number }[] = [];

  // Simple gaze prediction model (would be replaced with WebGazer in production)
  private gazeModel: {
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
  } = { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };

  constructor(config: Partial<EyeTrackingConfig> = {}) {
    this.config = { ...DEFAULT_EYE_TRACKING_CONFIG, ...config };
    this.calibrationPoints = [...DEFAULT_CALIBRATION_POINTS];
  }

  /**
   * Initialize eye tracking
   */
  async initialize(): Promise<boolean> {
    try {
      this.status = 'initializing';
      this.emit('statusChange', this.status);

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: this.config.videoConstraints,
      });

      // Setup video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        this.videoElement!.onloadedmetadata = () => resolve();
      });

      // Setup canvas for processing
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;

      // Create gaze cursor
      if (this.config.showCursor) {
        this.createGazeCursor();
      }

      this.status = 'active';
      this.emit('statusChange', this.status);

      // Start prediction loop
      this.startPrediction();

      return true;
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      this.emit('statusChange', this.status);
      return false;
    }
  }

  /**
   * Create visual gaze cursor
   */
  private createGazeCursor(): void {
    this.cursorElement = document.createElement('div');
    this.cursorElement.className = 'gaze-cursor';
    this.cursorElement.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid #00d4ff;
      background: rgba(0, 212, 255, 0.3);
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
      transition: opacity 0.2s ease;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    `;
    document.body.appendChild(this.cursorElement);
  }

  /**
   * Update cursor position
   */
  private updateCursor(x: number, y: number, dwelling: boolean): void {
    if (!this.cursorElement) return;

    this.cursorElement.style.left = `${x}px`;
    this.cursorElement.style.top = `${y}px`;

    if (dwelling) {
      this.cursorElement.style.borderColor = '#ff6b35';
      this.cursorElement.style.background = 'rgba(255, 107, 53, 0.3)';
    } else {
      this.cursorElement.style.borderColor = '#00d4ff';
      this.cursorElement.style.background = 'rgba(0, 212, 255, 0.3)';
    }
  }

  /**
   * Start gaze prediction loop
   */
  private startPrediction(): void {
    const predict = () => {
      if (this.status !== 'active') return;

      const gazePoint = this.predictGaze();
      if (gazePoint.confidence > 0.5) {
        this.currentGaze = this.smoother.add(gazePoint);
        this.processGaze(this.currentGaze);
        this.emit('gaze', this.currentGaze);
      }

      this.predictionLoop = requestAnimationFrame(predict);
    };

    this.predictionLoop = requestAnimationFrame(predict);
  }

  /**
   * Predict gaze point from video
   * This is a simplified model - real implementation would use WebGazer.js or similar
   */
  private predictGaze(): GazePoint {
    if (!this.videoElement) {
      return { x: 0, y: 0, timestamp: Date.now(), confidence: 0 };
    }

    // Simulate gaze prediction based on face detection
    // In production, this would use WebGazer.js or a custom ML model
    const canvas = this.canvasElement!;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Simple face/eye detection simulation
    // In production, use face-api.js or similar
    const facePosition = this.detectFace(imageData);

    if (facePosition) {
      // Map face position to screen coordinates
      const screenX =
        (facePosition.x / canvas.width) * window.innerWidth * this.gazeModel.scaleX +
        this.gazeModel.offsetX;
      const screenY =
        (facePosition.y / canvas.height) * window.innerHeight * this.gazeModel.scaleY +
        this.gazeModel.offsetY;

      return {
        x: Math.max(0, Math.min(window.innerWidth, screenX)),
        y: Math.max(0, Math.min(window.innerHeight, screenY)),
        timestamp: Date.now(),
        confidence: facePosition.confidence,
      };
    }

    return { x: 0, y: 0, timestamp: Date.now(), confidence: 0 };
  }

  /**
   * Simple face detection (placeholder for real ML model)
   */
  private detectFace(imageData: ImageData): { x: number; y: number; confidence: number } | null {
    // This is a placeholder - real implementation would use face-api.js
    // For demo purposes, return center with varying confidence
    return {
      x: imageData.width / 2 + (Math.random() - 0.5) * 50,
      y: imageData.height / 2 + (Math.random() - 0.5) * 30,
      confidence: 0.7 + Math.random() * 0.3,
    };
  }

  /**
   * Process gaze point for dwell detection
   */
  private processGaze(gaze: GazePoint): void {
    // Update cursor
    this.updateCursor(gaze.x, gaze.y, false);

    // Check dwell targets
    let dwellingTarget: DwellTarget | null = null;

    this.dwellTargets.forEach((target) => {
      const centerX = target.bounds.left + target.bounds.width / 2;
      const centerY = target.bounds.top + target.bounds.height / 2;
      const distance = Math.sqrt(
        Math.pow(gaze.x - centerX, 2) + Math.pow(gaze.y - centerY, 2)
      );

      if (distance <= this.config.dwellRadius) {
        dwellingTarget = target;
      } else {
        // Reset dwell state
        target.dwellStartTime = null;
        target.isDwelling = false;
        target.dwellProgress = 0;
        this.updateDwellVisual(target, 0);
      }
    });

    if (dwellingTarget) {
      this.handleDwell(dwellingTarget, gaze);
    } else {
      this.currentDwellTarget = null;
    }
  }

  /**
   * Handle dwell on target
   */
  private handleDwell(target: DwellTarget, gaze: GazePoint): void {
    const now = Date.now();

    if (!target.dwellStartTime) {
      target.dwellStartTime = now;
      target.isDwelling = true;
      this.currentDwellTarget = target;
      this.emit('dwellStart', { target, gaze });
    }

    const dwellDuration = now - target.dwellStartTime;
    target.dwellProgress = Math.min(dwellDuration / this.config.dwellTime, 1);

    // Update visual feedback
    this.updateDwellVisual(target, target.dwellProgress);
    this.updateCursor(gaze.x, gaze.y, true);

    // Emit progress
    this.emit('dwellProgress', { target, progress: target.dwellProgress });

    // Trigger click if dwell complete
    if (target.dwellProgress >= 1) {
      this.triggerDwellClick(target);
    }
  }

  /**
   * Update dwell visual feedback
   */
  private updateDwellVisual(target: DwellTarget, progress: number): void {
    target.element.style.setProperty('--dwell-progress', `${progress * 100}%`);
    target.element.classList.toggle('gaze-dwelling', progress > 0);
    target.element.classList.toggle('gaze-dwell-complete', progress >= 1);
  }

  /**
   * Trigger dwell click
   */
  private triggerDwellClick(target: DwellTarget): void {
    target.dwellStartTime = null;
    target.isDwelling = false;
    target.dwellProgress = 0;
    this.updateDwellVisual(target, 0);

    this.emit('dwellClick', { element: target.element });

    // Simulate click
    target.element.click();
    target.element.focus();
  }

  /**
   * Register element for dwell detection
   */
  registerDwellTarget(element: HTMLElement): () => void {
    const target: DwellTarget = {
      element,
      bounds: element.getBoundingClientRect(),
      dwellStartTime: null,
      isDwelling: false,
      dwellProgress: 0,
    };

    this.dwellTargets.set(element, target);

    // Update bounds on scroll/resize
    const updateBounds = () => {
      target.bounds = element.getBoundingClientRect();
    };

    window.addEventListener('scroll', updateBounds, { passive: true });
    window.addEventListener('resize', updateBounds);

    return () => {
      this.dwellTargets.delete(element);
      window.removeEventListener('scroll', updateBounds);
      window.removeEventListener('resize', updateBounds);
    };
  }

  /**
   * Start calibration process
   */
  startCalibration(): void {
    this.calibrationStatus = 'in-progress';
    this.currentCalibrationIndex = 0;
    this.calibrationData = [];
    this.emit('calibrationStart');
    this.showCalibrationPoint();
  }

  /**
   * Show current calibration point
   */
  private showCalibrationPoint(): void {
    if (this.currentCalibrationIndex >= this.calibrationPoints.length) {
      this.completeCalibration();
      return;
    }

    const point = this.calibrationPoints[this.currentCalibrationIndex];
    this.emit('calibrationPoint', {
      point,
      progress: this.currentCalibrationIndex / this.calibrationPoints.length,
    });
  }

  /**
   * Record calibration point
   */
  recordCalibrationPoint(): void {
    if (this.currentGaze && this.calibrationStatus === 'in-progress') {
      const expected = this.calibrationPoints[this.currentCalibrationIndex];
      this.calibrationData.push({
        x: this.currentGaze.x,
        y: this.currentGaze.y,
        expectedX: expected.x * window.innerWidth,
        expectedY: expected.y * window.innerHeight,
      });

      this.currentCalibrationIndex++;
      this.showCalibrationPoint();
    }
  }

  /**
   * Complete calibration and compute model
   */
  private completeCalibration(): void {
    if (this.calibrationData.length < 3) {
      this.calibrationStatus = 'failed';
      this.emit('calibrationFailed', { reason: 'Insufficient data' });
      return;
    }

    // Compute linear mapping from gaze to screen
    const xOffsets = this.calibrationData.map((d) => d.expectedX - d.x);
    const yOffsets = this.calibrationData.map((d) => d.expectedY - d.y);

    this.gazeModel.offsetX = xOffsets.reduce((a, b) => a + b, 0) / xOffsets.length;
    this.gazeModel.offsetY = yOffsets.reduce((a, b) => a + b, 0) / yOffsets.length;

    // Compute scale factors
    const xScales = this.calibrationData.map((d) => d.expectedX / (d.x + this.gazeModel.offsetX));
    const yScales = this.calibrationData.map((d) => d.expectedY / (d.y + this.gazeModel.offsetY));

    this.gazeModel.scaleX = xScales.reduce((a, b) => a + b, 0) / xScales.length;
    this.gazeModel.scaleY = yScales.reduce((a, b) => a + b, 0) / yScales.length;

    this.calibrationStatus = 'completed';
    this.emit('calibrationComplete', { model: this.gazeModel });
  }

  /**
   * Skip current calibration point
   */
  skipCalibrationPoint(): void {
    this.currentCalibrationIndex++;
    this.showCalibrationPoint();
  }

  /**
   * Get current gaze point
   */
  getCurrentGaze(): GazePoint | null {
    return this.currentGaze;
  }

  /**
   * Get status
   */
  getStatus(): EyeTrackingStatus {
    return this.status;
  }

  /**
   * Get calibration status
   */
  getCalibrationStatus(): CalibrationStatus {
    return this.calibrationStatus;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EyeTrackingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }

  /**
   * Stop eye tracking
   */
  stop(): void {
    if (this.predictionLoop) {
      cancelAnimationFrame(this.predictionLoop);
      this.predictionLoop = null;
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.cursorElement?.remove();

    this.status = 'inactive';
    this.emit('statusChange', this.status);
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.stop();
    this.dwellTargets.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const eyeTracking = new EyeTrackingManager();

// React hook for eye tracking
export function useEyeTracking(config?: Partial<EyeTrackingConfig>) {
  return {
    initialize: () => {
      const manager = new EyeTrackingManager(config);
      return manager.initialize();
    },
    eyeTracking,
    defaultConfig: DEFAULT_EYE_TRACKING_CONFIG,
    calibrationPoints: DEFAULT_CALIBRATION_POINTS,
  };
}

export default EyeTrackingManager;
