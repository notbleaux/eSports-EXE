/**
 * Voice Notes System
 * Audio recording, playback, and waveform visualization
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { VoiceAnnotation, WaveformData, AudioData } from './types';

// ============================================================================
// Recording Configuration
// ============================================================================

export const RECORDING_CONFIG = {
  sampleRate: 44100,
  channels: 1,
  mimeType: 'audio/webm;codecs=opus',
  maxDuration: 300000, // 5 minutes max
  bufferSize: 4096,
};

export const WAVEFORM_CONFIG = {
  barWidth: 3,
  barGap: 1,
  barMaxHeight: 50,
  samples: 100,
};

// ============================================================================
// Recording State
// ============================================================================

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startTime: number;
  pauseTime: number;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  stream: MediaStream | null;
  analyser: AnalyserNode | null;
  dataArray: Uint8Array | null;
}

// ============================================================================
// Recording Functions
// ============================================================================

/**
 * Initialize audio recording
 */
export async function initRecording(): Promise<{
  mediaRecorder: MediaRecorder;
  stream: MediaStream;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: RECORDING_CONFIG.sampleRate,
      channelCount: RECORDING_CONFIG.channels,
    },
  });

  // Set up audio context for visualization
  const audioContext = new AudioContext({ sampleRate: RECORDING_CONFIG.sampleRate });
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  // Determine supported MIME type
  const mimeType = getSupportedMimeType();
  const mediaRecorder = new MediaRecorder(stream, { mimeType });

  return { mediaRecorder, stream, analyser, dataArray };
}

/**
 * Get supported MIME type for recording
 */
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'audio/webm';
}

/**
 * Start recording
 */
export function startRecording(
  mediaRecorder: MediaRecorder,
  onDataAvailable: (chunk: Blob) => void,
  onError: (error: Error) => void
): void {
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
      onDataAvailable(event.data);
    }
  };

  mediaRecorder.onerror = () => {
    onError(new Error('Recording error'));
  };

  mediaRecorder.onstop = () => {
    // Recording stopped
  };

  mediaRecorder.start(100); // Collect data every 100ms
}

/**
 * Stop recording
 */
export function stopRecording(
  mediaRecorder: MediaRecorder,
  stream: MediaStream
): Blob {
  mediaRecorder.stop();
  
  // Stop all tracks
  stream.getTracks().forEach(track => track.stop());

  // Collect all chunks
  const chunks: Blob[] = [];
  const originalOnDataAvailable = mediaRecorder.ondataavailable;
  
  // Return the recorded audio as a blob
  return new Blob(chunks, { type: mediaRecorder.mimeType });
}

/**
 * Pause recording
 */
export function pauseRecording(mediaRecorder: MediaRecorder): void {
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
  }
}

/**
 * Resume recording
 */
export function resumeRecording(mediaRecorder: MediaRecorder): void {
  if (mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
  }
}

// ============================================================================
// Waveform Generation
// ============================================================================

/**
 * Generate waveform data from audio buffer
 */
export async function generateWaveformData(
  audioBuffer: AudioBuffer,
  samples: number = WAVEFORM_CONFIG.samples
): Promise<WaveformData> {
  const channelData = audioBuffer.getChannelData(0);
  const step = Math.floor(channelData.length / samples);
  const peaks: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    let max = 0;

    for (let j = start; j < end; j++) {
      const amplitude = Math.abs(channelData[j]);
      if (amplitude > max) {
        max = amplitude;
      }
    }

    peaks.push(max);
  }

  return {
    peaks,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
  };
}

/**
 * Generate waveform data from audio blob
 */
export async function generateWaveformFromBlob(
  blob: Blob,
  samples: number = WAVEFORM_CONFIG.samples
): Promise<WaveformData> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  return generateWaveformData(audioBuffer, samples);
}

/**
 * Get real-time audio levels for visualization during recording
 */
export function getAudioLevel(analyser: AnalyserNode, dataArray: Uint8Array): number {
  analyser.getByteFrequencyData(dataArray);
  
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  
  return sum / dataArray.length / 255; // Normalize to 0-1
}

/**
 * Get waveform peaks for real-time visualization
 */
export function getRealtimeWaveform(
  analyser: AnalyserNode,
  dataArray: Uint8Array,
  samples: number = 50
): number[] {
  analyser.getByteTimeDomainData(dataArray);
  
  const step = Math.floor(dataArray.length / samples);
  const peaks: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const start = i * step;
    let max = 0;
    
    for (let j = 0; j < step && start + j < dataArray.length; j++) {
      const value = Math.abs(dataArray[start + j] - 128) / 128;
      if (value > max) {
        max = value;
      }
    }
    
    peaks.push(max);
  }
  
  return peaks;
}

// ============================================================================
// Waveform Rendering
// ============================================================================

export interface RenderWaveformOptions {
  ctx: CanvasRenderingContext2D;
  waveformData: WaveformData;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  progress?: number;
  playedColor?: string;
}

/**
 * Render waveform visualization
 */
export function renderWaveform(options: RenderWaveformOptions): void {
  const {
    ctx,
    waveformData,
    width,
    height,
    color = '#00D4AA',
    backgroundColor = 'rgba(0, 212, 170, 0.3)',
    progress = 0,
    playedColor = '#00D4AA',
  } = options;

  const { peaks } = waveformData;
  const barWidth = (width - (peaks.length - 1)) / peaks.length;
  const centerY = height / 2;
  
  ctx.clearRect(0, 0, width, height);
  
  const progressIndex = Math.floor(peaks.length * progress);
  
  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    const barHeight = peak * height * 0.9;
    const x = i * (barWidth + 1);
    const y = centerY - barHeight / 2;
    
    // Use different color for played portion
    ctx.fillStyle = i < progressIndex ? playedColor : backgroundColor;
    
    // Draw rounded bar
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(1, barWidth), barHeight, 2);
    ctx.fill();
  }
}

/**
 * Render circular waveform (for recording indicator)
 */
export function renderCircularWaveform(
  ctx: CanvasRenderingContext2D,
  level: number,
  centerX: number,
  centerY: number,
  radius: number,
  color: string = '#FF4655'
): void {
  ctx.save();
  
  // Draw base circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 70, 85, 0.3)';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Draw level indicator
  if (level > 0) {
    const endAngle = -Math.PI / 2 + (Math.PI * 2 * level);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  
  // Draw center dot
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.restore();
}

// ============================================================================
// Audio Playback
// ============================================================================

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

/**
 * Create audio element for playback
 */
export function createAudioElement(audioData: AudioData): HTMLAudioElement {
  const audio = new Audio(audioData.url);
  audio.preload = 'metadata';
  return audio;
}

/**
 * Play audio with progress callback
 */
export function playAudio(
  audio: HTMLAudioElement,
  onProgress: (currentTime: number, duration: number) => void,
  onEnded: () => void
): void {
  const updateProgress = () => {
    onProgress(audio.currentTime, audio.duration || 0);
    
    if (!audio.paused && !audio.ended) {
      requestAnimationFrame(updateProgress);
    }
  };

  audio.onended = onEnded;
  audio.onpause = () => {
    // Playback paused
  };

  audio.play().then(() => {
    updateProgress();
  }).catch((error) => {
    console.error('Playback error:', error);
  });
}

/**
 * Pause audio
 */
export function pauseAudio(audio: HTMLAudioElement): void {
  audio.pause();
}

/**
 * Seek to time
 */
export function seekAudio(audio: HTMLAudioElement, time: number): void {
  audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
}

/**
 * Set volume
 */
export function setAudioVolume(audio: HTMLAudioElement, volume: number): void {
  audio.volume = Math.max(0, Math.min(1, volume));
}

/**
 * Set playback rate
 */
export function setAudioPlaybackRate(audio: HTMLAudioElement, rate: number): void {
  audio.playbackRate = Math.max(0.5, Math.min(2, rate));
}

// ============================================================================
// Voice Annotation Management
// ============================================================================

/**
 * Create a voice annotation from recorded audio
 */
export function createVoiceAnnotation(
  audioBlob: Blob,
  timestamp: number,
  author: string,
  duration: number
): Omit<VoiceAnnotation, 'id' | 'createdAt' | 'updatedAt'> {
  const url = URL.createObjectURL(audioBlob);
  
  const audioData: AudioData = {
    blob: audioBlob,
    url,
    duration,
    sampleRate: RECORDING_CONFIG.sampleRate,
    channels: RECORDING_CONFIG.channels,
  };

  return {
    type: 'voice',
    timestamp,
    duration,
    author,
    visible: true,
    opacity: 1,
    audioData,
    status: 'processing',
    volume: 1,
    playbackRate: 1,
  };
}

/**
 * Update waveform data for a voice annotation
 */
export async function updateWaveformData(
  annotation: VoiceAnnotation
): Promise<VoiceAnnotation> {
  if (!annotation.audioData) {
    return annotation;
  }

  try {
    const waveformData = await generateWaveformFromBlob(annotation.audioData.blob);
    return {
      ...annotation,
      waveformData,
      status: 'ready',
    };
  } catch (error) {
    return {
      ...annotation,
      status: 'error',
    };
  }
}

// ============================================================================
// Transcription (Placeholder for future integration)
// ============================================================================

/**
 * Transcribe audio to text using Web Speech API
 */
export async function transcribeAudio(
  audioBlob: Blob
): Promise<string | null> {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null;
  }

  // Note: Web Speech API doesn't directly support blob transcription
  // This would require a server-side transcription service
  // Placeholder for future implementation
  return null;
}

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Serialize voice annotation for storage
 */
export function serializeVoiceAnnotation(annotation: VoiceAnnotation): {
  type: 'voice';
  timestamp: number;
  duration: number;
  author: string;
  visible: boolean;
  opacity: number;
  audioBase64: string;
  waveformData?: WaveformData;
  transcript?: string;
  status: string;
  volume: number;
  playbackRate: number;
} {
  return {
    type: annotation.type,
    timestamp: annotation.timestamp,
    duration: annotation.duration,
    author: annotation.author,
    visible: annotation.visible,
    opacity: annotation.opacity,
    audioBase64: annotation.audioData ? blobToBase64(annotation.audioData.blob) : '',
    waveformData: annotation.waveformData,
    transcript: annotation.transcript,
    status: annotation.status,
    volume: annotation.volume,
    playbackRate: annotation.playbackRate,
  };
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob: Blob): string {
  const reader = new FileReader();
  let result = '';
  
  reader.onloadend = () => {
    if (typeof reader.result === 'string') {
      result = reader.result.split(',')[1];
    }
  };
  
  reader.readAsDataURL(blob);
  return result;
}

/**
 * Deserialize voice annotation from storage
 */
export function deserializeVoiceAnnotation(
  data: ReturnType<typeof serializeVoiceAnnotation>
): VoiceAnnotation {
  const blob = base64ToBlob(data.audioBase64, 'audio/webm');
  const url = URL.createObjectURL(blob);

  return {
    id: `voice-${Date.now()}`,
    type: 'voice',
    timestamp: data.timestamp,
    duration: data.duration,
    author: data.author,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    visible: data.visible,
    opacity: data.opacity,
    audioData: {
      blob,
      url,
      duration: data.duration,
      sampleRate: RECORDING_CONFIG.sampleRate,
      channels: RECORDING_CONFIG.channels,
    },
    waveformData: data.waveformData,
    transcript: data.transcript,
    status: data.status as VoiceAnnotation['status'],
    volume: data.volume,
    playbackRate: data.playbackRate,
  };
}

/**
 * Convert base64 to blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// ============================================================================
// Export
// ============================================================================

export default {
  RECORDING_CONFIG,
  WAVEFORM_CONFIG,
  initRecording,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  generateWaveformData,
  generateWaveformFromBlob,
  getAudioLevel,
  getRealtimeWaveform,
  renderWaveform,
  renderCircularWaveform,
  createAudioElement,
  playAudio,
  pauseAudio,
  seekAudio,
  setAudioVolume,
  setAudioPlaybackRate,
  createVoiceAnnotation,
  updateWaveformData,
  transcribeAudio,
  serializeVoiceAnnotation,
  deserializeVoiceAnnotation,
};
