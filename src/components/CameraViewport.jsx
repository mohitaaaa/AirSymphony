import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Video, 
  VideoOff, 
  Circle, 
  Square, 
  Pause, 
  Play, 
  Eye, 
  EyeOff, 
  FlipHorizontal, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Sparkles,
  Layers,
  Activity,
  Flame,
  Cpu
} from 'lucide-react';
import { GestureRecognizer } from '../vision/gestureRecognizer';
import { soundEngine } from '../audio/SoundEngine';
import { videoRecorder } from '../video/VideoRecorder';
import { deepGestureClassifier } from '../ai/DeepGestureClassifier';

// Helper to convert frequency (Hz) to musical note name
function getNoteNameFromFreq(freq) {
  if (!freq || freq <= 0) return 'A4';
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = ((midi % 12) + 12) % 12;
  return `${noteNames[noteIndex]}${octave}`;
}

// Hand landmark connection skeleton pairs
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
];

export default function CameraViewport({
  onHandsDetected,
  currentChord,
  onChordChange,
  recordingState,
  onRecordingStateChange,
  playMode,
  setPlayMode,
  currentInstrument,
  audioStarted,
  setAudioStarted,
  onNeuralPrediction
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const gestureRecognizerRef = useRef(new GestureRecognizer());
  const latestNeuralPredRef = useRef(null);

  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [micStream, setMicStream] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [recordTimer, setRecordTimer] = useState('00:00');
  const [chordHandPref, setChordHandPref] = useState('auto'); // 'auto' | 'left' | 'right'

  // Active state refs for 60fps render loop
  const chordHandPrefRef = useRef(chordHandPref);
  chordHandPrefRef.current = chordHandPref;

  const lastFingerCountRef = useRef({ left: 0, right: 0 });
  const lastActiveHandRef = useRef('left');

  const isMirroredRef = useRef(isMirrored);
  isMirroredRef.current = isMirrored;

  const showOverlayRef = useRef(showOverlay);
  showOverlayRef.current = showOverlay;

  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;

  const currentInstrumentRef = useRef(currentInstrument);
  currentInstrumentRef.current = currentInstrument;

  const latestHandsRef = useRef([]);
  const isDetectingRef = useRef(false);

  // Particle bursts & trails
  const particlesRef = useRef([]);
  const virtualStringsRef = useRef([]);

  // Strumming & chord state tracking
  const lastChordTriggerRef = useRef(null);
  const lastStrumTriggerTimeRef = useRef(0);

  // Real-time Theremin status
  const thereminStatusRef = useRef(null);
  const strumWavesRef = useRef([]);

  // Right Hand interactive feedback & virtual strings
  const gestureToastRef = useRef(null);
  const acousticStringsRef = useRef([
    { yRatio: 0.32, vibration: 0 },
    { yRatio: 0.44, vibration: 0 },
    { yRatio: 0.56, vibration: 0 },
    { yRatio: 0.68, vibration: 0 }
  ]);

  // Mode synchronization
  useEffect(() => {
    if (soundEngine.isInitialized) {
      if (playMode !== 'theremin' && currentInstrument !== 'theremin') {
        soundEngine.stopTheremin();
        thereminStatusRef.current = null;
      }
      if (playMode !== 'chords') {
        soundEngine.stopAllNotes();
        lastChordTriggerRef.current = null;
      }
    }
  }, [playMode, currentInstrument]);

  // Reset last chord trigger reference on instrument change for seamless responsiveness
  useEffect(() => {
    lastChordTriggerRef.current = null;
  }, [currentInstrument]);

  // Initialize Virtual Air Harp strings
  useEffect(() => {
    const scaleNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    virtualStringsRef.current = scaleNotes.map((note, idx) => ({
      note,
      xRatio: 0.15 + (idx * 0.1),
      isHit: false,
      glowIntensity: 0
    }));
  }, []);

  // Format recording timer
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Video recorder callbacks
  useEffect(() => {
    videoRecorder.setCallbacks({
      onStateChange: (state) => {
        onRecordingStateChange(state);
      },
      onTimeUpdate: (secs) => {
        setRecordTimer(formatTime(secs));
      }
    });
  }, [onRecordingStateChange]);

  // Listen to Python CNN+LSTM real-time WebSocket events
  useEffect(() => {
    const unsubscribe = deepGestureClassifier.onPrediction((pyData) => {
      if (pyData) {
        const activeHand = pyData.leftHand || pyData.rightHand;
        if (activeHand && activeHand.gestureClass) {
          const mappedPred = {
            classIndex: activeHand.classId,
            gestureClass: activeHand.gestureClass,
            confidence: activeHand.confidence,
            probabilities: (activeHand.probabilities || []).map((prob, idx) => ({
              id: idx,
              label: activeHand.gestureClass?.label || `Chord ${idx}`,
              probability: prob
            })),
            inferenceTimeMs: pyData.inferenceTimeMs || 1.2,
            backend: 'Python (1D-CNN + LSTM)'
          };
          latestNeuralPredRef.current = mappedPred;
          if (onNeuralPrediction) onNeuralPrediction(mappedPred);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onNeuralPrediction]);

  // Start Camera & Vision Engine with Crisp HD resolution
  useEffect(() => {
    let activeStream = null;
    let stopAi = null;

    async function initCamera() {
      try {
        setCameraLoading(true);
        setCameraError(null);

        // Request crisp HD 720p with low latency constraints (prevents camera hardware frame buffering lag)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 60, min: 30 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          }
        });

        activeStream = stream;
        setMicStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Match main canvas dimensions to native camera track resolution for crisp output
        const track = stream.getVideoTracks()[0];
        if (track && track.getSettings) {
          const s = track.getSettings();
          if (canvasRef.current && s.width && s.height) {
            canvasRef.current.width = s.width;
            canvasRef.current.height = s.height;
          }
        }

        // Initialize dedicated offscreen canvas for lightweight zero-lag MediaPipe downsampling
        if (!offscreenCanvasRef.current) {
          const off = document.createElement('canvas');
          off.width = 480;
          off.height = 270;
          offscreenCanvasRef.current = off;
        }

        // Initialize Deep Learning Classifier bridge
        await deepGestureClassifier.init();

        // Initialize MediaPipe Hands
        await initMediaPipe();
        
        // Start decoupled 60 FPS Render Loop
        startRenderLoop();

        // Start asynchronous AI Hand Detection Loop
        stopAi = startAiLoop();

        setCameraLoading(false);
      } catch (err) {
        console.error('[CameraViewport] Camera access error:', err);
        setCameraError(err.message || 'Could not access camera. Please allow camera and microphone permissions.');
        setCameraLoading(false);
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stopAi) {
        stopAi();
      }
      if (handsInstanceRef.current) {
        handsInstanceRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Initialize MediaPipe Hands solution
  const initMediaPipe = async () => {
    let HandsConstructor = window.Hands;
    if (!HandsConstructor) {
      try {
        const mpHands = await import('@mediapipe/hands');
        HandsConstructor = mpHands.Hands || window.Hands;
      } catch (e) {
        console.warn('[CameraViewport] Dynamic import fallback:', e);
      }
    }

    if (!HandsConstructor) {
      throw new Error('MediaPipe Hands is initializing. Please refresh if camera does not appear.');
    }

    const hands = new HandsConstructor({
      locateFile: (file) => `/mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0, // Lite model for sub-5ms inference
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(handleHandResults);
    handsInstanceRef.current = hands;
  };

  // Zero-Lag Asynchronous AI Detection Loop:
  // Downsamples video frame to 480x270 offscreen canvas before passing to MediaPipe
  // Prevents CPU starvation and guarantees full 60 FPS video rendering with minimum frame delay
  const startAiLoop = () => {
    let isRunning = true;

    const detect = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const hands = handsInstanceRef.current;
      const offscreen = offscreenCanvasRef.current;

      // Immediately process frame whenever AI is ready (eliminates artificial 30ms throttling latency)
      if (video && video.readyState >= 2 && hands && offscreen && !isDetectingRef.current) {
        isDetectingRef.current = true;
        try {
          const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
          offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
          await hands.send({ image: offscreen });
        } catch (e) {}
        isDetectingRef.current = false;
      }

      if (video && 'requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        video.requestVideoFrameCallback(detect);
      } else {
        requestAnimationFrame(detect);
      }
    };

    detect();

    return () => {
      isRunning = false;
    };
  };

  // Continuous 60 FPS Native HD Render Loop
  const startRenderLoop = () => {
    const loop = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 1. Draw Native HD Camera Video Frame
        ctx.save();
        if (isMirroredRef.current) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        // 2. Cinematic dark vignette
        ctx.fillStyle = 'rgba(10, 15, 26, 0.16)';
        ctx.fillRect(0, 0, width, height);

        // 3. Audio Spectrum Visualizer
        const freqData = soundEngine.isInitialized ? soundEngine.getAnalyzerData() : null;
        if (freqData) {
          drawAudioVisualizer(ctx, freqData, width, height);
        }

        const isThereminActive = playModeRef.current === 'theremin' || currentInstrumentRef.current === 'theremin';

        // 4. Mode-specific Interactive AR HUDs
        if (isThereminActive) {
          drawThereminHUD(ctx, width, height);
        } else if (playModeRef.current === 'airHarp') {
          drawVirtualStrings(ctx, width, height);
        } else {
          drawAcousticStrumStrings(ctx, width, height);
          const rightHandObj = latestHandsRef.current.find(h => h.hand === 'Right') || latestHandsRef.current[0];
          drawRightHandControlCard(ctx, width, height, rightHandObj);
        }

        // 5. Strumming Waves & Animated Feedback
        updateAndDrawStrumWaves(ctx, width, height);
        drawGestureToast(ctx, width, height);

        // 6. Draw AR Hand Skeletons & Holograms
        if (showOverlayRef.current && latestHandsRef.current.length > 0) {
          latestHandsRef.current.forEach((analyzed) => {
            drawHandSkeleton(ctx, analyzed, width, height, isMirroredRef.current);
          });
        }

        // 7. Render particle bursts
        updateAndDrawParticles(ctx);

        // 8. Draw Watermark & Neural Status
        drawHUDStatus(ctx, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  // Handle MediaPipe detection results
  const handleHandResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      latestHandsRef.current = [];
      onHandsDetected(0);
      if (soundEngine.isInitialized) {
        if (playModeRef.current === 'chords' && currentInstrumentRef.current !== 'theremin') {
          soundEngine.stopAllNotes();
          onChordChange(null);
          lastChordTriggerRef.current = null;
        } else if (playModeRef.current === 'theremin' || currentInstrumentRef.current === 'theremin') {
          soundEngine.stopTheremin();
          thereminStatusRef.current = null;
        }
      }
      return;
    }

    const detected = [];
    results.multiHandLandmarks.forEach((landmarks, index) => {
      const classification = results.multiHandedness ? results.multiHandedness[index] : null;
      const rawLabel = classification ? classification.label : (index === 0 ? 'Right' : 'Left');
      
      const analyzed = gestureRecognizerRef.current.analyzeHand(landmarks, rawLabel, isMirroredRef.current, width);
      if (!analyzed) return;
      detected.push(analyzed);
    });

    let leftHandData = null;
    let rightHandData = null;

    if (detected.length === 1) {
      // Single hand detected: can be either hand, mapped cleanly to its screen position
      if (detected[0].screenXNorm < 0.5) {
        leftHandData = detected[0];
      } else {
        rightHandData = detected[0];
      }
    } else if (detected.length >= 2) {
      // Sort hands strictly by on-screen position (left-to-right) in mirror mode:
      // The hand on the left of screen is always user's Left hand
      // The hand on the right of screen is always user's Right hand
      detected.sort((a, b) => a.screenXNorm - b.screenXNorm);
      leftHandData = detected[0];
      rightHandData = detected[1];
    }

    latestHandsRef.current = detected;
    onHandsDetected(detected.length);

    // Stream landmarks to Python CNN+LSTM
    deepGestureClassifier.sendHandsToPython(
      leftHandData ? leftHandData.landmarks : null,
      rightHandData ? rightHandData.landmarks : null
    );

    // Predict chords on whatever hand is active
    const activeHandForAi = leftHandData || rightHandData;
    if (activeHandForAi) {
      const neuralPred = deepGestureClassifier.predictHandChord(activeHandForAi.landmarks, activeHandForAi.hand);
      if (neuralPred) {
        latestNeuralPredRef.current = neuralPred;
        if (onNeuralPrediction) onNeuralPrediction(neuralPred);
      }
    }

    // Execute Musical Sound Engine logic
    if (soundEngine.isInitialized) {
      const isThereminActive = playModeRef.current === 'theremin' || currentInstrumentRef.current === 'theremin';

      if (isThereminActive) {
        handleThereminMode(leftHandData, rightHandData, width, height);
      } else if (playModeRef.current === 'airHarp') {
        handleAirHarpMode(leftHandData, rightHandData, width, height);
      } else {
        handleChordsMode(leftHandData, rightHandData, width, height);
      }
    }
  }, [onHandsDetected, onChordChange, onNeuralPrediction]);

  // Mode 1: Singer Chords & Strumming Companion (Seamless Dual-Hand Harmony: Left OR Right Hand!)
  const handleChordsMode = (leftHand, rightHand, width, height) => {
    let selectedChord = null;
    let chordControllingHand = null;
    let expressionHand = null;
    let isMute = false;

    const pref = chordHandPrefRef.current; // 'auto' | 'left' | 'right'
    const leftCount = (leftHand && leftHand.extendedCount >= 1 && leftHand.extendedCount <= 5) ? leftHand.extendedCount : 0;
    const rightCount = (rightHand && rightHand.extendedCount >= 1 && rightHand.extendedCount <= 5) ? rightHand.extendedCount : 0;

    // Track which hand recently changed its finger count for intuitive Auto switching
    if (leftHand && leftHand.extendedCount !== lastFingerCountRef.current.left) {
      if (leftCount > 0) lastActiveHandRef.current = 'left';
      lastFingerCountRef.current.left = leftHand.extendedCount;
    }
    if (rightHand && rightHand.extendedCount !== lastFingerCountRef.current.right) {
      if (rightCount > 0) lastActiveHandRef.current = 'right';
      lastFingerCountRef.current.right = rightHand.extendedCount;
    }

    // Determine intentional mute (closed fist held steady)
    if (leftHand && rightHand && leftHand.isFist && rightHand.isFist) {
      isMute = true;
    }

    // Decide which hand drives chords based on user preference
    if (pref === 'left') {
      if (leftHand && leftHand.isFist) isMute = true;
      if (leftCount > 0) {
        selectedChord = soundEngine.getChordFromFingerCount(leftCount);
        chordControllingHand = leftHand;
        expressionHand = rightHand;
      }
    } else if (pref === 'right') {
      if (rightHand && rightHand.isFist) isMute = true;
      if (rightCount > 0) {
        selectedChord = soundEngine.getChordFromFingerCount(rightCount);
        chordControllingHand = rightHand;
        expressionHand = leftHand;
      }
    } else {
      // 'auto' mode: works seamlessly on whichever hand is raised or gesturing!
      if (leftCount > 0 && rightCount > 0) {
        if (lastActiveHandRef.current === 'right') {
          selectedChord = soundEngine.getChordFromFingerCount(rightCount);
          chordControllingHand = rightHand;
          expressionHand = leftHand;
        } else {
          selectedChord = soundEngine.getChordFromFingerCount(leftCount);
          chordControllingHand = leftHand;
          expressionHand = rightHand;
        }
      } else if (leftCount > 0) {
        selectedChord = soundEngine.getChordFromFingerCount(leftCount);
        chordControllingHand = leftHand;
        expressionHand = rightHand;
      } else if (rightCount > 0) {
        selectedChord = soundEngine.getChordFromFingerCount(rightCount);
        chordControllingHand = rightHand;
        expressionHand = leftHand;
      } else {
        if ((leftHand && leftHand.isFist) || (rightHand && rightHand.isFist)) {
          isMute = true;
        }
      }
    }

    // 1. Python CNN+LSTM Neural Network integration fallback/enhancement
    const pyData = deepGestureClassifier.latestPythonPrediction;
    if (pyData && deepGestureClassifier.pythonConnected && !selectedChord && !isMute) {
      const activePyHand = (pref === 'right' ? pyData.rightHand : pyData.leftHand) || pyData.leftHand || pyData.rightHand;
      if (activePyHand && activePyHand.gestureClass) {
        const clsId = activePyHand.classId;
        if (clsId === 5) {
          isMute = true;
        } else if (clsId >= 0 && clsId <= 4) {
          const degreeMap = [1, 4, 5, 6, 2];
          const deg = degreeMap[clsId] || 1;
          selectedChord = soundEngine.getChordForDegree(deg);
        }
      }
    }

    if (isMute) {
      soundEngine.stopAllNotes();
      onChordChange(null);
      lastChordTriggerRef.current = null;
      return;
    }

    // 2. Dynamic Controls (Air Strumming & Pinch Intensity)
    // Only detect strumming on the non-chord expression hand, or when no chord is currently held
    const dynamicHand = expressionHand || (!chordControllingHand ? (rightHand || leftHand) : null);
    if (dynamicHand) {
      // Pinch Intensity Modulation: Active when user is pinching (not holding 2-5 fingers)
      if (dynamicHand.isPinchControlActive && dynamicHand.extendedCount <= 1) {
        soundEngine.setIntensity(dynamicHand.pinchIntensity);
      }

      // Hand elevation filter sweep
      const heightY = 1.0 - dynamicHand.center.y;
      const cutoff = 250 + Math.pow(heightY, 2) * 15500;
      soundEngine.setFilterCutoff(cutoff);

      // Dynamic Air Strumming (only on expression hand to prevent chord cut-offs)
      const now = performance.now();
      const strum = gestureRecognizerRef.current.detectStrum(dynamicHand);
      
      if (strum && (now - lastStrumTriggerTimeRef.current > 180)) {
        lastStrumTriggerTimeRef.current = now;
        const chordToStrum = selectedChord || soundEngine.activeChord || soundEngine.getChordForDegree(1);
        
        if (chordToStrum) {
          soundEngine.strumChord(chordToStrum, strum.direction, strum.speed, strum.intensity);
          onChordChange(chordToStrum);

          // Visual feedback
          spawnStrumParticles(dynamicHand.center.x * width, dynamicHand.center.y * height, strum.direction);
          spawnStrumWave(dynamicHand.center.y * height, strum.direction);

          // Vibrate virtual acoustic strings
          acousticStringsRef.current.forEach(str => { str.vibration = 1.0; });

          gestureToastRef.current = {
            text: `🎸 AIR STRUM (${strum.direction.toUpperCase()}) • ${chordToStrum.name}`,
            time: performance.now(),
            color: '#ffd200'
          };
        }
      }
    }

    // 3. Smoothly sustain active chord when finger count changes or continues
    if (selectedChord) {
      if (!lastChordTriggerRef.current || lastChordTriggerRef.current.name !== selectedChord.name) {
        soundEngine.playChord(selectedChord, 0.85);
        onChordChange(selectedChord);
        lastChordTriggerRef.current = selectedChord;
      }
    } else if (!leftHand && !rightHand) {
      soundEngine.stopAllNotes();
      onChordChange(null);
      lastChordTriggerRef.current = null;
    }
  };

  // Mode 2: Air Harp Virtual Strings
  const handleAirHarpMode = (leftHand, rightHand, width, height) => {
    const checkFingerStringCollision = (hand) => {
      if (!hand) return;
      const indexTip = hand.landmarks[8];
      const middleTip = hand.landmarks[12];
      const thumbTip = hand.landmarks[4];

      const checkPoint = (p) => {
        const screenX = isMirroredRef.current ? (1 - p.x) * width : p.x * width;
        const normX = screenX / width;

        virtualStringsRef.current.forEach((str) => {
          const dist = Math.abs(normX - str.xRatio);
          if (dist < 0.025) {
            if (!str.isHit) {
              str.isHit = true;
              str.glowIntensity = 1.0;
              soundEngine.playSingleNote(str.note, '4n', 0.85);
              spawnNoteRipples(str.xRatio * width, p.y * height);
            }
          } else if (dist > 0.05) {
            str.isHit = false;
          }
        });
      };

      if (indexTip) checkPoint(indexTip);
      if (middleTip) checkPoint(middleTip);
      if (thumbTip) checkPoint(thumbTip);
    };

    checkFingerStringCollision(leftHand);
    checkFingerStringCollision(rightHand);
  };

  // Mode 3: Continuous Theremin & Lead Melody
  const handleThereminMode = (leftHand, rightHand, width, height) => {
    const activeLeadHand = rightHand || leftHand;

    if (activeLeadHand) {
      // Continuous pitch glide from C3 (130 Hz) to C6 (1046 Hz)
      const pitchNorm = isMirroredRef.current ? (1.0 - activeLeadHand.center.x) : activeLeadHand.center.x;
      const clampedNorm = Math.max(0.04, Math.min(0.96, pitchNorm));

      const minFreq = 130.81; // C3
      const maxFreq = 1046.50; // C6
      const freqHz = minFreq * Math.pow(maxFreq / minFreq, clampedNorm);

      // Volume & Expression Control
      let volumeNorm = 0.85;
      if (leftHand && rightHand) {
        if (leftHand.gestureName === 'fist') {
          volumeNorm = 0.0;
        } else {
          volumeNorm = Math.max(0.0, Math.min(1.0, (1.0 - leftHand.center.y) * 1.3));
        }
      } else {
        if (activeLeadHand.isPinchControlActive) {
          volumeNorm = activeLeadHand.pinchIntensity;
        } else {
          volumeNorm = Math.max(0.2, Math.min(1.0, (1.0 - activeLeadHand.center.y) * 1.25));
        }
      }

      const vibratoDepth = activeLeadHand.isPinching ? 0.05 : 0.18;

      soundEngine.updateTheremin(freqHz, volumeNorm, vibratoDepth);

      thereminStatusRef.current = {
        freqHz,
        volumeNorm,
        pitchNorm: clampedNorm,
        noteName: getNoteNameFromFreq(freqHz),
        rightHandPos: {
          x: isMirroredRef.current ? (1.0 - activeLeadHand.center.x) * width : activeLeadHand.center.x * width,
          y: activeLeadHand.center.y * height
        },
        indexTipPos: activeLeadHand.landmarks[8] ? {
          x: isMirroredRef.current ? (1.0 - activeLeadHand.landmarks[8].x) * width : activeLeadHand.landmarks[8].x * width,
          y: activeLeadHand.landmarks[8].y * height
        } : null
      };
    } else {
      soundEngine.stopTheremin();
      thereminStatusRef.current = null;
    }
  };

  // Keyboard accompaniment shortcuts for quick testing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const count = parseInt(e.key, 10);
        const chord = soundEngine.getChordFromFingerCount(count);
        if (chord) {
          soundEngine.playChord(chord, 0.85);
          onChordChange(chord);
        }
      } else if (e.key === '0' || e.code === 'Space') {
        soundEngine.stopAllNotes();
        onChordChange(null);
      } else if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
        const chordToStrum = currentChord || soundEngine.activeChord || soundEngine.getChordForDegree(1);
        if (chordToStrum) {
          soundEngine.strumChord(chordToStrum, 'down', 0.03);
          acousticStringsRef.current.forEach(str => { str.vibration = 1.0; });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChord, onChordChange]);

  // Draw AR Hand Skeleton & Holographic HUD
  const drawHandSkeleton = (ctx, handData, width, height, mirrored) => {
    const { landmarks, hand, extendedCount, gestureName } = handData;
    const isLeft = hand === 'Left';

    const boneColor = isLeft ? 'rgba(0, 243, 255, 0.7)' : 'rgba(255, 45, 117, 0.7)';
    const jointColor = isLeft ? '#00f3ff' : '#ff2d75';

    const toScreen = (lm) => ({
      x: mirrored ? (1 - lm.x) * width : lm.x * width,
      y: lm.y * height
    });

    // Draw bones
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = boneColor;

    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = toScreen(landmarks[startIdx]);
      const p2 = toScreen(landmarks[endIdx]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw joints
    landmarks.forEach((lm, idx) => {
      const p = toScreen(lm);
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const radius = isTip ? 5.5 : 3.0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#ffffff' : jointColor;
      ctx.fill();

      if (isTip) {
        ctx.strokeStyle = jointColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Holographic Intensity Arc on Pinch Point
    if (handData.isPinchControlActive) {
      const thumbPt = toScreen(landmarks[4]);
      const indexPt = toScreen(landmarks[8]);
      const pinchMidX = (thumbPt.x + indexPt.x) / 2;
      const pinchMidY = (thumbPt.y + indexPt.y) / 2;
      const radius = 22;
      const intensity = handData.pinchIntensity || 0.85;

      ctx.save();
      ctx.beginPath();
      ctx.arc(pinchMidX, pinchMidY, radius, -Math.PI * 0.75, Math.PI * 0.75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      const endAngle = -Math.PI * 0.75 + (Math.PI * 1.5) * intensity;
      ctx.arc(pinchMidX, pinchMidY, radius, -Math.PI * 0.75, endAngle);
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffd200';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${(intensity * 100).toFixed(0)}%`, pinchMidX, pinchMidY);
      ctx.restore();
    }

    // Gesture HUD badge floating above wrist
    const wristScreen = toScreen(landmarks[0]);
    const badgeX = wristScreen.x;
    const badgeY = Math.max(30, wristScreen.y - 45);

    ctx.font = '600 11px "Outfit", sans-serif';
    let roleText = '';
    if (extendedCount >= 1 && extendedCount <= 5) {
      const chord = soundEngine.getChordFromFingerCount(extendedCount);
      roleText = chord ? ` • ${chord.name} (${chord.degree})` : '';
    }
    const labelText = extendedCount > 0 
      ? `${hand.toUpperCase()}: ${extendedCount} Finger${extendedCount === 1 ? '' : 's'}${roleText}`
      : (handData.isFist ? `${hand.toUpperCase()}: MUTE (FIST)` : `${hand.toUpperCase()}: ${(handData.pinchIntensity * 100).toFixed(0)}% (${gestureName.toUpperCase()})`);
    const metrics = ctx.measureText(labelText);
    const boxW = metrics.width + 16;
    const boxH = 22;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX - boxW / 2, badgeY - boxH / 2, boxW, boxH, 6);
    ctx.fill();

    ctx.strokeStyle = jointColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, badgeX, badgeY);
  };

  // Draw Continuous Theremin Lead Pitch & Volume Antennas
  const drawThereminHUD = (ctx, width, height) => {
    const status = thereminStatusRef.current;
    const isMirrored = isMirroredRef.current;

    ctx.save();

    // 1. Pitch Antenna on Right Edge
    const antennaX = width - 40;
    const grad = ctx.createLinearGradient(antennaX, 35, antennaX, height - 35);
    grad.addColorStop(0, '#ff2d75');
    grad.addColorStop(0.5, '#00f3ff');
    grad.addColorStop(1, '#b829ff');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(antennaX, 35);
    ctx.lineTo(antennaX, height - 35);
    ctx.stroke();

    // Pitch ribbon scale ticks
    const keyNotes = [
      { name: 'C3', norm: 0.05 },
      { name: 'E3', norm: 0.16 },
      { name: 'G3', norm: 0.26 },
      { name: 'C4', norm: 0.38 },
      { name: 'E4', norm: 0.50 },
      { name: 'G4', norm: 0.62 },
      { name: 'C5', norm: 0.80 },
      { name: 'C6', norm: 0.95 }
    ];

    keyNotes.forEach((kn) => {
      const screenX = isMirrored ? (1.0 - kn.norm) * width : kn.norm * width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX, 55);
      ctx.lineTo(screenX, 70);
      ctx.stroke();

      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText(kn.name, screenX, 84);
    });

    // 2. Volume Antenna on Left Edge
    const volAntennaX = 35;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(volAntennaX, 60);
    ctx.lineTo(volAntennaX, height - 60);
    ctx.stroke();

    const vol = status ? status.volumeNorm : 0.6;
    const volBarH = (height - 120) * vol;
    ctx.fillStyle = 'rgba(0, 243, 255, 0.7)';
    ctx.fillRect(volAntennaX - 4, height - 60 - volBarH, 8, volBarH);

    ctx.font = '600 11px "Outfit", sans-serif';
    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'left';
    ctx.fillText(`VOL: ${(vol * 100).toFixed(0)}%`, volAntennaX + 10, height - 65 - volBarH);

    // 3. Dynamic Plasma Arc & Reticle to Hand
    if (status && status.rightHandPos) {
      const rx = status.rightHandPos.x;
      const ry = status.rightHandPos.y;
      const tipX = status.indexTipPos ? status.indexTipPos.x : rx;
      const tipY = status.indexTipPos ? status.indexTipPos.y : ry;

      ctx.strokeStyle = 'rgba(255, 45, 117, 0.85)';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      const midX = (tipX + antennaX) / 2 + (Math.random() - 0.5) * 15;
      const midY = (tipY + antennaX) / 2 + (Math.random() - 0.5) * 15;
      ctx.quadraticCurveTo(midX, midY, antennaX, tipY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(tipX, tipY, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 45, 117, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#ff2d75';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${status.noteName} (${status.freqHz.toFixed(1)} Hz)`, tipX, Math.max(30, tipY - 24));
    }

    ctx.restore();
  };

  // Draw acoustic strum strings
  const drawAcousticStrumStrings = (ctx, width, height) => {
    ctx.save();
    const rightZoneStartX = width * 0.65;
    const rightZoneEndX = width * 0.95;

    acousticStringsRef.current.forEach((str, idx) => {
      const y = str.yRatio * height;
      const vib = str.vibration;
      const isVibrating = vib > 0.05;

      ctx.strokeStyle = isVibrating 
        ? `rgba(255, 210, 0, ${0.4 + vib * 0.6})`
        : 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = isVibrating ? 3.0 : 1.5;

      ctx.beginPath();
      ctx.moveTo(rightZoneStartX, y);
      if (isVibrating) {
        const waveAmp = vib * 10 * Math.sin(performance.now() * 0.04 + idx);
        ctx.quadraticCurveTo((rightZoneStartX + rightZoneEndX) / 2, y + waveAmp, rightZoneEndX, y);
      } else {
        ctx.lineTo(rightZoneEndX, y);
      }
      ctx.stroke();

      str.vibration = Math.max(0, str.vibration - 0.04);
    });

    ctx.font = '600 11px "Outfit", sans-serif';
    ctx.fillStyle = 'rgba(255, 210, 0, 0.75)';
    ctx.textAlign = 'right';
    ctx.fillText('🎸 AIR STRUM STRINGS (Wave hand down/up)', rightZoneEndX, acousticStringsRef.current[0].yRatio * height - 12);
    ctx.restore();
  };

  // Right Hand gesture status HUD
  const drawRightHandControlCard = (ctx, width, height, handObj) => {
    if (!handObj) return;
    ctx.save();
    const cardW = 210;
    const cardH = 64;
    const cardX = width - cardW - 16;
    const cardY = 55;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 45, 117, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 11px "Outfit", sans-serif';
    ctx.fillStyle = '#ff2d75';
    ctx.textAlign = 'left';
    ctx.fillText('🖐️ GESTURE DYNAMICS', cardX + 10, cardY + 16);

    const intensity = Math.round((handObj.pinchIntensity || 0.85) * 100);
    const heightY = Math.round((1.0 - handObj.center.y) * 100);

    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`• 🌊 STRUM: Ready (Swipe down/up)`, cardX + 10, cardY + 32);
    ctx.fillText(`• 🤏 PINCH INTENSITY: ${intensity}%`, cardX + 10, cardY + 46);
    ctx.fillText(`• 🎚️ BRIGHTNESS: ${heightY}%`, cardX + 10, cardY + 59);
    ctx.restore();
  };

  // Strumming wave animations
  const updateAndDrawStrumWaves = (ctx, width, height) => {
    for (let i = strumWavesRef.current.length - 1; i >= 0; i--) {
      const wave = strumWavesRef.current[i];
      wave.alpha -= 0.035;
      wave.y += wave.dir === 'down' ? 4 : -4;

      if (wave.alpha <= 0) {
        strumWavesRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = wave.alpha;
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(0, wave.y);
      ctx.bezierCurveTo(width * 0.35, wave.y + 15, width * 0.65, wave.y - 15, width, wave.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const spawnStrumWave = (y, dir) => {
    strumWavesRef.current.push({
      y,
      dir,
      alpha: 0.9,
      color: '#ffd200'
    });
  };

  // Gesture trigger toast
  const drawGestureToast = (ctx, width, height) => {
    if (!gestureToastRef.current) return;
    const now = performance.now();
    const age = now - gestureToastRef.current.time;
    if (age > 1200) {
      gestureToastRef.current = null;
      return;
    }

    const alpha = Math.max(0, 1.0 - age / 1200);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 13px "Outfit", sans-serif';
    ctx.textAlign = 'center';

    const text = gestureToastRef.current.text;
    const textWidth = ctx.measureText(text).width;
    const badgeW = textWidth + 28;
    const badgeH = 32;
    const badgeX = width / 2;
    const badgeY = height * 0.28;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 16);
    ctx.fill();

    ctx.strokeStyle = gestureToastRef.current.color || '#ffd200';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX, badgeY);
    ctx.restore();
  };

  // Draw Air Harp laser strings
  const drawVirtualStrings = (ctx, width, height) => {
    virtualStringsRef.current.forEach((str) => {
      const x = str.xRatio * width;
      const isLit = str.glowIntensity > 0.05;

      ctx.save();
      ctx.lineWidth = isLit ? 3.0 : 1.5;
      ctx.strokeStyle = isLit 
        ? `rgba(0, 243, 255, ${0.4 + str.glowIntensity * 0.6})`
        : 'rgba(255, 255, 255, 0.15)';

      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height - 30);
      ctx.stroke();

      ctx.fillStyle = isLit ? '#00f3ff' : 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(str.note, x, 16);

      ctx.restore();
      str.glowIntensity = Math.max(0, str.glowIntensity - 0.04);
    });
  };

  // Draw Audio Spectrum Visualizer
  const drawAudioVisualizer = (ctx, freqData, width, height) => {
    const barCount = 28;
    const barWidth = 7;
    const gap = 5;
    const totalW = barCount * (barWidth + gap);
    const startX = (width - totalW) / 2;
    const bottomY = height - 12;

    ctx.save();
    for (let i = 0; i < barCount; i++) {
      const db = freqData[i] || -100;
      const norm = Math.max(0, Math.min(1, (db + 90) / 70));
      const barH = Math.max(3, norm * 40);
      const x = startX + i * (barWidth + gap);
      const y = bottomY - barH;

      const grad = ctx.createLinearGradient(x, y, x, bottomY);
      grad.addColorStop(0, '#00f3ff');
      grad.addColorStop(0.5, '#b829ff');
      grad.addColorStop(1, '#ff2d75');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
      ctx.fill();
    }
    ctx.restore();
  };

  // Particle management
  const updateAndDrawParticles = (ctx) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = p.life / 25;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const spawnStrumParticles = (x, y, dir) => {
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: dir === 'down' ? Math.random() * 3 + 1 : -(Math.random() * 3 + 1),
        radius: Math.random() * 3 + 1,
        color: '#ffd200',
        alpha: 1.0,
        life: 25
      });
    }
  };

  const spawnNoteRipples = (x, y) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: Math.random() * 3 + 1,
        color: '#00f3ff',
        alpha: 1.0,
        life: 20
      });
    }
  };

  const drawHUDStatus = (ctx, width, height) => {
    ctx.save();
    ctx.font = '500 11px "Outfit", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('AIRSYMPHONY STUDIO • PYTHON CNN + LSTM NEURAL ENGINE (HD 60FPS)', 16, height - 16);

    // Live Neural Network Inference HUD Badge
    if (latestNeuralPredRef.current) {
      const np = latestNeuralPredRef.current;
      const isPy = np.backend.includes('Python');
      const label = `${isPy ? '🐍 PYTHON CNN+LSTM' : '⚡ ON-DEVICE AI'}: ${np.gestureClass.degree} (${(np.confidence * 100).toFixed(0)}%) • ${np.inferenceTimeMs}ms`;
      
      ctx.font = '600 11px "JetBrains Mono", monospace';
      const m = ctx.measureText(label);
      const bw = m.width + 16;
      const bx = width - bw - 16;
      const by = height - 28;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(bx, by - 12, bw, 22, 6);
      ctx.fill();

      ctx.strokeStyle = isPy ? '#10b981' : '#00f3ff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isPy ? '#34d399' : '#00f3ff';
      ctx.fillText(label, bx + 8, by + 3);
    }

    if (recordingState === 'recording') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(16, 16, 115, 30, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(28, 31, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`REC ${recordTimer}`, 40, 35);
    }
    ctx.restore();
  };

  const handleStartAudio = async () => {
    await soundEngine.init();
    setAudioStarted(true);
  };

  const triggerRecording = async () => {
    if (!audioStarted) {
      await handleStartAudio();
    }

    if (recordingState === 'recording') {
      videoRecorder.stopRecording();
      return;
    }

    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countInterval);
          executeStartRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeStartRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Stream native 60fps canvas at full resolution
    const canvasStream = canvas.captureStream(60);
    const synthStream = soundEngine.getRecordingStream();

    await videoRecorder.startRecording(canvasStream, micStream, synthStream, {
      micGain: 1.0,
      synthGain: 1.0
    });
  };

  const handlePauseResume = () => {
    if (recordingState === 'recording') {
      videoRecorder.pauseRecording();
    } else if (recordingState === 'paused') {
      videoRecorder.resumeRecording();
    }
  };

  const handleStopRecording = () => {
    videoRecorder.stopRecording();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center">
      
      {/* Viewport Area */}
      <div className="relative w-full aspect-video max-h-[68vh] bg-slate-900 flex items-center justify-center overflow-hidden">
        
        {/* Hardware-accelerated video element */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-0"
        />

        {/* Master 60fps Native HD Output Canvas */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain relative z-10"
        />

        {/* Loading Spinner */}
        {cameraLoading && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-300">Connecting Camera & Vision Engine...</p>
            <p className="text-xs text-slate-500">Please allow camera permissions if prompted.</p>
          </div>
        )}

        {/* Camera Error Display */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3 p-6 text-center z-30">
            <VideoOff className="w-12 h-12 text-rose-500" />
            <h3 className="text-lg font-bold text-white">Camera Access Required</h3>
            <p className="text-sm text-slate-300 max-w-md">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Retry Camera Connection
            </button>
          </div>
        )}

        {/* Audio Initialization Banner */}
        {!audioStarted && !cameraLoading && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/25">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to AirSymphony Studio</h2>
            <p className="text-sm text-slate-300 max-w-lg mb-5">
              Sing freely while your hands play authentic grand piano, acoustic guitar, and lush choral pads. 
              Click below to activate the Web Audio engine and begin!
            </p>
            <button
              onClick={handleStartAudio}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105 active:scale-95"
            >
              ENABLE SOUND & START SINGING
            </button>
          </div>
        )}

        {/* 3-2-1 Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-in fade-in duration-200">
            <div className="text-8xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-pink-500 to-purple-600 animate-bounce">
              {countdown}
            </div>
            <p className="text-lg font-semibold text-slate-300 mt-4 tracking-widest uppercase">
              Get ready to sing & play!
            </p>
          </div>
        )}

        {/* Floating Active Chord Banner */}
        {currentChord && playMode !== 'theremin' && currentInstrument !== 'theremin' && (
          <div className="absolute top-4 right-4 z-20 glass-panel-accent px-4 py-2 rounded-xl flex items-center gap-3 border border-cyan-400/40 shadow-xl shadow-cyan-500/10">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-cyan-300 font-mono uppercase tracking-wider">Active Chord</div>
              <div className="text-xl font-bold font-mono text-white text-glow-cyan leading-tight">
                {currentChord.name} <span className="text-xs text-slate-400 font-normal">({currentChord.degree})</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Mode Switcher inside Viewport */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => {
              setPlayMode('chords');
              if (currentInstrument === 'theremin') {
                soundEngine.setInstrument('ambientPad');
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              playMode === 'chords' && currentInstrument !== 'theremin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chords & Strum</span>
          </button>
          <button
            onClick={() => {
              setPlayMode('airHarp');
              if (currentInstrument === 'theremin') {
                soundEngine.setInstrument('celesta');
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              playMode === 'airHarp' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Air Harp</span>
          </button>
          <button
            onClick={() => {
              setPlayMode('theremin');
              soundEngine.setInstrument('theremin');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              playMode === 'theremin' || currentInstrument === 'theremin'
                ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Theremin Lead</span>
          </button>
        </div>

      </div>

      {/* Studio Viewport Controls Bar */}
      <div className="w-full bg-slate-900/90 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left Side: Viewport Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showOverlay 
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle AR Hand Skeleton & Hologram"
          >
            {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>AR HUD: {showOverlay ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Flip Mirror Camera"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Chord Hand Mode Selector */}
          {playMode === 'chords' && (
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 px-2 font-medium">Chords:</span>
              <button
                onClick={() => setChordHandPref('auto')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  chordHandPref === 'auto'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Either hand triggers chords automatically"
              >
                Auto (Both)
              </button>
              <button
                onClick={() => setChordHandPref('left')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  chordHandPref === 'left'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Left hand plays chords (fingers 1-5)"
              >
                Left Hand
              </button>
              <button
                onClick={() => setChordHandPref('right')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  chordHandPref === 'right'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Right hand plays chords (fingers 1-5)"
              >
                Right Hand
              </button>
            </div>
          )}
        </div>

        {/* Center: BIG RECORD BUTTON */}
        <div className="flex items-center gap-3">
          {recordingState === 'idle' ? (
            <button
              onClick={triggerRecording}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-sm flex items-center gap-2.5 shadow-lg shadow-red-600/30 transform hover:scale-105 active:scale-95 transition-all"
            >
              <Circle className="w-4 h-4 fill-white animate-pulse" />
              <span>RECORD PERFORMANCE (HD)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePauseResume}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                {recordingState === 'recording' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{recordingState === 'recording' ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                onClick={handleStopRecording}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-red-600/40 animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>FINISH & PREVIEW ({recordTimer})</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Quick Singer Gesture Tip */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Either Hand: 1-5 fingers (chords)</span>
          <span className="text-slate-600">|</span>
          <span className="w-2 h-2 rounded-full bg-pink-400" />
          <span>Wave down/up (strum)</span>
          <span className="text-slate-600">|</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]" title="Keys 1-5 = Chords, S = Strum, Space = Mute">
            Keys 1-5 / S
          </span>
        </div>

      </div>

    </div>
  );
}
