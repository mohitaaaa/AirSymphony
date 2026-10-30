/**
 * High-definition Video & Audio Recording Manager
 * Synchronously merges live Camera feed, Canvas AR HUD, Singer Microphone, and Gesture Synth Audio
 */
export class VideoRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingState = 'idle'; // 'idle' | 'recording' | 'paused' | 'stopped'
    this.recordedBlobUrl = null;
    this.recordedBlob = null;
    this.startTime = 0;
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.onStateChangeCallback = null;
    this.onTimeUpdateCallback = null;

    // Web Audio mixing nodes
    this.audioContext = null;
    this.micSourceNode = null;
    this.micGainNode = null;
    this.synthGainNode = null;
    this.mixedDestination = null;
    this.mixedStream = null;
  }

  setCallbacks({ onStateChange, onTimeUpdate }) {
    this.onStateChangeCallback = onStateChange;
    this.onTimeUpdateCallback = onTimeUpdate;
  }

  async startRecording(canvasStream, micStream, synthStream, { micGain = 1.0, synthGain = 1.0 } = {}) {
    this.recordedChunks = [];
    if (this.recordedBlobUrl) {
      URL.revokeObjectURL(this.recordedBlobUrl);
      this.recordedBlobUrl = null;
    }

    try {
      // 1. Setup Audio Mixing via Web Audio Context
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.mixedDestination = this.audioContext.createMediaStreamDestination();

      // Singer Microphone Input
      if (micStream && micStream.getAudioTracks().length > 0) {
        this.micSourceNode = this.audioContext.createMediaStreamSource(micStream);
        this.micGainNode = this.audioContext.createGain();
        this.micGainNode.gain.setValueAtTime(micGain, this.audioContext.currentTime);
        this.micSourceNode.connect(this.micGainNode);
        this.micGainNode.connect(this.mixedDestination);
      }

      // AirSymphony Instrument Sound Output
      if (synthStream && synthStream.getAudioTracks().length > 0) {
        const synthSource = this.audioContext.createMediaStreamSource(synthStream);
        this.synthGainNode = this.audioContext.createGain();
        this.synthGainNode.gain.setValueAtTime(synthGain, this.audioContext.currentTime);
        synthSource.connect(this.synthGainNode);
        this.synthGainNode.connect(this.mixedDestination);
      }

      // 2. Combine Canvas Video Track + Mixed Audio Track
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...this.mixedDestination.stream.getAudioTracks()
      ];

      this.mixedStream = new MediaStream(combinedTracks);

      // 3. Determine best supported codec for high-fidelity recording
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const recorderOptions = selectedMimeType ? { 
        mimeType: selectedMimeType, 
        videoBitsPerSecond: 8000000, // 8 Mbps Studio High-Definition
        audioBitsPerSecond: 256000   // 256 kbps Studio Hi-Fi Audio
      } : {};
      this.mediaRecorder = new MediaRecorder(this.mixedStream, recorderOptions);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finishRecording(selectedMimeType || 'video/webm');
      };

      this.mediaRecorder.onerror = (err) => {
        console.error('[VideoRecorder] Recording error:', err);
      };

      // Request data slice every 1000ms for safety
      this.mediaRecorder.start(1000);
      this.recordingState = 'recording';
      this.startTime = Date.now();
      this.elapsedSeconds = 0;

      this.timerInterval = setInterval(() => {
        this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.elapsedSeconds);
        }
      }, 500);

      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(this.recordingState);
      }

      return true;
    } catch (err) {
      console.error('[VideoRecorder] Failed to start recording:', err);
      throw err;
    }
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.recordingState = 'paused';
      if (this.onStateChangeCallback) this.onStateChangeCallback(this.recordingState);
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.recordingState = 'recording';
      if (this.onStateChangeCallback) this.onStateChangeCallback(this.recordingState);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      clearInterval(this.timerInterval);
    }
  }

  finishRecording(mimeType) {
    this.recordingState = 'stopped';
    clearInterval(this.timerInterval);

    this.recordedBlob = new Blob(this.recordedChunks, { type: mimeType });
    this.recordedBlobUrl = URL.createObjectURL(this.recordedBlob);

    // Clean up Web Audio nodes
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.recordingState);
    }
  }

  downloadRecording(filename = null) {
    if (!this.recordedBlobUrl) return;

    const actualName = filename || `AirSymphony_Singer_Take_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = this.recordedBlobUrl;
    a.download = actualName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  }

  reset() {
    if (this.recordedBlobUrl) {
      URL.revokeObjectURL(this.recordedBlobUrl);
      this.recordedBlobUrl = null;
    }
    this.recordedBlob = null;
    this.recordedChunks = [];
    this.recordingState = 'idle';
    this.elapsedSeconds = 0;
    clearInterval(this.timerInterval);
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback('idle');
    }
  }
}

export const videoRecorder = new VideoRecorder();
