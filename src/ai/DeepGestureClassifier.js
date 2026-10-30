import * as tf from '@tensorflow/tfjs';

/**
 * Deep Learning Gesture Classifier & Python CNN+LSTM Bridge
 * 
 * Integrates:
 * 1. Primary Engine: Python FastAPI / WebSocket Server running Spatial 1D-CNN + Temporal LSTM
 * 2. On-Device Fallback: TensorFlow.js WebGL GPU acceleration
 */

export const GESTURE_CLASSES = [
  { id: 0, label: 'Chord I (Tonic / 1 Finger)', degree: 'I', fingerCount: 1, key: 'tonic' },
  { id: 1, label: 'Chord IV (Subdominant / 2 Fingers)', degree: 'IV', fingerCount: 2, key: 'subdominant' },
  { id: 2, label: 'Chord V (Dominant / 3 Fingers)', degree: 'V', fingerCount: 3, key: 'dominant' },
  { id: 3, label: 'Chord vi (Relative Minor / 4 Fingers)', degree: 'vi', fingerCount: 4, key: 'minor' },
  { id: 4, label: 'Chord ii (Pre-Chorus / 5 Fingers)', degree: 'ii', fingerCount: 5, key: 'supertonic' },
  { id: 5, label: 'Mute / Silence (Closed Fist)', degree: 'MUTE', fingerCount: 0, key: 'fist' },
  { id: 6, label: 'Neutral / Floating Rest', degree: 'REST', fingerCount: -1, key: 'rest' }
];

export class DeepGestureClassifier {
  constructor() {
    this.model = null;
    this.isReady = false;
    this.isTraining = false;
    this.trainingHistory = [];
    this.lastInferenceTimeMs = 0;
    this.deviceBackend = 'webgl';

    // Python CNN + LSTM Server connection
    this.pythonConnected = false;
    this.pythonWs = null;
    this.latestPythonPrediction = null;
    this.predictionListeners = [];
    this.wsConnecting = false;
  }

  async init() {
    if (this.isReady) return;

    // 1. Connect to Python CNN + LSTM Backend
    this.initPythonBackend();

    // 2. Setup WebGL GPU acceleration for fallback
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      this.deviceBackend = tf.getBackend();
    } catch (e) {
      console.warn('[DeepLearning] WebGL fallback to CPU:', e);
      try {
        await tf.setBackend('cpu');
        this.deviceBackend = 'cpu';
      } catch (err) {}
    }

    try {
      this.model = tf.sequential();

      this.model.add(tf.layers.dense({
        inputShape: [42],
        units: 64,
        activation: 'relu',
        kernelInitializer: 'glorotUniform'
      }));

      this.model.add(tf.layers.dense({
        units: 32,
        activation: 'relu'
      }));

      this.model.add(tf.layers.dense({
        units: 7,
        activation: 'softmax'
      }));

      this.model.compile({
        optimizer: tf.train.adam(0.005),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      await this.trainSyntheticBaseline();
    } catch (e) {
      console.warn('[DeepLearning] Local model compilation notice:', e);
    }

    this.isReady = true;
    console.log(`[DeepLearning] AI Classifier initialized. Active Engine: ${this.pythonConnected ? '🐍 Python CNN+LSTM' : this.deviceBackend}`);
  }

  initPythonBackend() {
    if (this.wsConnecting || (this.pythonWs && this.pythonWs.readyState === WebSocket.OPEN)) return;
    this.wsConnecting = true;

    try {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/gesture');
      
      ws.onopen = () => {
        this.pythonConnected = true;
        this.pythonWs = ws;
        this.wsConnecting = false;
        console.log('[DeepLearning] 🐍 Connected to Python CNN + LSTM Neural Network on port 8000!');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.latestPythonPrediction = data;
          this.predictionListeners.forEach(fn => fn(data));
        } catch (e) {}
      };

      ws.onerror = () => {
        this.pythonConnected = false;
        this.wsConnecting = false;
      };

      ws.onclose = () => {
        this.pythonConnected = false;
        this.wsConnecting = false;
        setTimeout(() => this.initPythonBackend(), 4000);
      };
    } catch (e) {
      this.pythonConnected = false;
      this.wsConnecting = false;
    }
  }

  onPrediction(callback) {
    this.predictionListeners.push(callback);
    return () => {
      this.predictionListeners = this.predictionListeners.filter(fn => fn !== callback);
    };
  }

  async trainSyntheticBaseline() {
    if (!this.model) return;
    const samplesPerClass = 25;
    const inputs = [];
    const labels = [];

    for (let c = 0; c < 7; c++) {
      for (let s = 0; s < samplesPerClass; s++) {
        const featureVector = new Float32Array(42);
        for (let i = 0; i < 21; i++) {
          const noiseX = (Math.random() - 0.5) * 0.05;
          const noiseY = (Math.random() - 0.5) * 0.05;
          let baseY = 0.5;
          let baseX = 0.5 + (i % 5 - 2) * 0.08;

          if (c === 0 && i >= 5 && i <= 8) baseY = 0.15; // 1 finger
          if (c === 1 && ((i >= 5 && i <= 8) || (i >= 9 && i <= 12))) baseY = 0.15; // 2 fingers
          if (c === 2 && i >= 5 && i <= 16) baseY = 0.15; // 3 fingers
          if (c === 3 && i >= 5 && i <= 20) baseY = 0.15; // 4 fingers
          if (c === 4) baseY = 0.15; // 5 fingers
          if (c === 5) baseY = 0.65; // fist
          if (c === 6) baseY = 0.45; // neutral

          featureVector[i * 2] = baseX + noiseX;
          featureVector[i * 2 + 1] = baseY + noiseY;
        }
        inputs.push(Array.from(featureVector));

        const oneHot = new Array(7).fill(0);
        oneHot[c] = 1;
        labels.push(oneHot);
      }
    }

    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(labels);

    await this.model.fit(xs, ys, {
      epochs: 10,
      batchSize: 16,
      shuffle: true,
      verbose: 0
    });

    xs.dispose();
    ys.dispose();
  }

  // Stream dual-hand landmarks to Python CNN+LSTM
  sendHandsToPython(leftLandmarks, rightLandmarks) {
    if (this.pythonConnected && this.pythonWs && this.pythonWs.readyState === WebSocket.OPEN) {
      try {
        const payload = {
          leftHand: leftLandmarks || null,
          rightHand: rightLandmarks || null,
          timestamp: performance.now()
        };
        this.pythonWs.send(JSON.stringify(payload));
      } catch (e) {}
    }
  }

  // Preprocess 21 landmarks into 42-D translation & scale-invariant features
  extractFeatures(landmarks) {
    if (!landmarks || landmarks.length < 21) return null;

    const wrist = landmarks[0];
    const middleKnuckle = landmarks[9];

    const dx = middleKnuckle.x - wrist.x;
    const dy = middleKnuckle.y - wrist.y;
    const scale = Math.sqrt(dx * dx + dy * dy) || 1.0;

    const features = new Float32Array(42);
    for (let i = 0; i < 21; i++) {
      features[i * 2] = (landmarks[i].x - wrist.x) / scale;
      features[i * 2 + 1] = (landmarks[i].y - wrist.y) / scale;
    }

    return features;
  }

  // Universal Hand Chord Prediction (Works for Left Hand OR Right Hand)
  predictHandChord(landmarks, handType = 'Left') {
    if (!landmarks) return null;

    // Check Python prediction first
    if (this.pythonConnected && this.latestPythonPrediction) {
      const handData = handType === 'Left' 
        ? this.latestPythonPrediction.leftHand 
        : this.latestPythonPrediction.rightHand;

      if (handData && handData.gestureClass) {
        return {
          classIndex: handData.classId,
          gestureClass: handData.gestureClass,
          confidence: handData.confidence,
          fingerCount: handData.fingerCount,
          probabilities: (handData.probabilities || []).map((prob, idx) => ({
            ...GESTURE_CLASSES[idx],
            probability: prob
          })),
          inferenceTimeMs: this.latestPythonPrediction.inferenceTimeMs || 1.2,
          backend: 'Python (1D-CNN + LSTM)',
          temporalState: handData.temporalEmbedding
        };
      }
    }

    // On-device fallback
    if (!this.isReady || !this.model) return null;

    const startTime = performance.now();
    const features = this.extractFeatures(landmarks);
    if (!features) return null;

    try {
      const result = tf.tidy(() => {
        const inputTensor = tf.tensor2d([Array.from(features)], [1, 42]);
        const prediction = this.model.predict(inputTensor);
        return Array.from(prediction.dataSync());
      });

      this.lastInferenceTimeMs = (performance.now() - startTime).toFixed(1);

      let maxIdx = 0;
      let maxProb = result[0];
      for (let i = 1; i < result.length; i++) {
        if (result[i] > maxProb) {
          maxProb = result[i];
          maxIdx = i;
        }
      }

      return {
        classIndex: maxIdx,
        gestureClass: GESTURE_CLASSES[maxIdx],
        confidence: maxProb,
        probabilities: result.map((prob, idx) => ({
          ...GESTURE_CLASSES[idx],
          probability: prob
        })),
        inferenceTimeMs: this.lastInferenceTimeMs,
        backend: this.deviceBackend
      };
    } catch (e) {
      return null;
    }
  }

  predictLeftHand(landmarks) {
    return this.predictHandChord(landmarks, 'Left');
  }

  predictRightHand(landmarks) {
    return this.predictHandChord(landmarks, 'Right');
  }

  getRightHandPrediction() {
    if (this.pythonConnected && this.latestPythonPrediction && this.latestPythonPrediction.rightHand) {
      return this.latestPythonPrediction.rightHand;
    }
    return null;
  }
}

export const deepGestureClassifier = new DeepGestureClassifier();
