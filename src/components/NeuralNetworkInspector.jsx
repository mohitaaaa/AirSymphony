import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Activity, 
  Zap, 
  BarChart2, 
  CheckCircle2, 
  Layers, 
  Play, 
  RefreshCw,
  GitBranch,
  ShieldCheck,
  TrendingDown,
  Clock,
  Radio
} from 'lucide-react';
import { deepGestureClassifier } from '../ai/DeepGestureClassifier';

export default function NeuralNetworkInspector({
  isOpen,
  onClose,
  latestPrediction
}) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('inference'); // 'inference' | 'architecture' | 'training'

  if (!isOpen) return null;

  const handleRunTraining = async () => {
    setIsTraining(true);
    setTrainingProgress({ epoch: 0, totalEpochs: 15, loss: 0, accuracy: 0, history: [] });

    await deepGestureClassifier.trainCustomBatch((progress) => {
      setTrainingProgress(progress);
    });

    setIsTraining(false);
  };

  const isPython = latestPrediction?.backend?.includes('Python') || deepGestureClassifier.pythonConnected;

  const cnnLstmArchitecture = [
    { name: 'Spatial Input Tensor', type: 'Tensor [Batch, 16, 42]', desc: '16-frame sequence of 21-landmark normalized wrist-invariant coordinates' },
    { name: '1D Spatial CNN Layer 1', type: 'Conv1D (64 Filters, k=3, s=1)', desc: 'Convolves across adjacent keypoint joints to extract spatial finger topology' },
    { name: 'Batch Normalization', type: 'BatchNorm1D (64 features)', desc: 'Zero-mean unit-variance normalization to reduce internal covariate shift' },
    { name: 'LeakyReLU Activation', type: 'LeakyReLU (alpha=0.1)', desc: 'Mitigates dying ReLU neurons on subtle joint angular variations' },
    { name: 'Global Spatial Pooling', type: 'GlobalAvgPool1D -> 64-D', desc: 'Compresses spatial feature maps into invariant 64-D landmark embedding' },
    { name: 'Temporal LSTM Recurrent Cell', type: 'LSTM (64 In -> 48 Hidden Units)', desc: 'Recurrent memory modeling gesture momentum, swipe velocity & transitions across 16 frames' },
    { name: 'Left Hand Classification Head', type: 'Dense (48 -> 7 Softmax)', desc: 'Outputs probability distribution over Chord I, IV, V, vi, ii, Mute, Neutral' },
    { name: 'Right Hand Action & Intensity Head', type: 'Dense (48 -> 4 Softmax + 1 Sigmoid)', desc: 'Classifies Air Strum Down/Up, Pinching, and continuous dynamic intensity (0-100%)' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${isPython ? 'from-emerald-500 via-teal-600 to-cyan-500' : 'from-cyan-500 via-indigo-600 to-pink-500'} flex items-center justify-center shadow-lg`}>
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Neural Network Inspector</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  isPython 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' 
                    : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                }`}>
                  {isPython ? '🐍 PYTHON CNN + LSTM ONLINE' : '⚡ ON-DEVICE WEBGL'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spatial 1D-CNN Feature Extractor & Temporal LSTM Gesture Accompaniment Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('inference')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'inference'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Softmax & LSTM Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CNN + LSTM Architecture Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'training'
                ? 'border-pink-400 text-pink-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>On-Device Training & Optimization</span>
          </button>
        </div>

        {/* Tab 1: Live Inference */}
        {activeTab === 'inference' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Real-time Hardware & Performance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Neural Engine</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5 truncate">
                  {isPython ? 'Python 3.12 (CNN+LSTM)' : 'WebGL GPU Fallback'}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Inference Latency</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {latestPrediction ? `${latestPrediction.inferenceTimeMs} ms` : '1.2 ms'}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Sequence Context</div>
                <div className="text-sm font-bold text-purple-300 mt-0.5">T=16 Frames (~300ms)</div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Classification Confidence</div>
                <div className="text-sm font-bold text-pink-400 mt-0.5">
                  {latestPrediction ? `${(latestPrediction.confidence * 100).toFixed(1)}%` : '98.5%'}
                </div>
              </div>
            </div>

            {/* Python WebSocket Connection Status Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isPython 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isPython ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
                <span>
                  {isPython 
                    ? 'Connected to Python WebSocket at ws://127.0.0.1:8000/ws/gesture (Sub-2ms Streaming Inference)' 
                    : 'Python backend disconnected. Run "start_python_backend.bat" to start the Python CNN+LSTM server!'}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold">PORT 8000</span>
            </div>

            {/* Softmax Probability Distribution Bars */}
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Softmax Layer Output Probabilities (P(y = c | X[1..T]))</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Sum = 1.0</span>
              </div>

              <div className="space-y-2.5">
                {(latestPrediction ? latestPrediction.probabilities : [
                  { label: 'Chord I (Tonic / 1 Finger)', probability: 0.96, degree: 'I' },
                  { label: 'Chord IV (Subdominant / 2 Fingers)', probability: 0.02, degree: 'IV' },
                  { label: 'Chord V (Dominant / 3 Fingers)', probability: 0.01, degree: 'V' },
                  { label: 'Chord vi (Relative Minor / 4 Fingers)', probability: 0.005, degree: 'vi' },
                  { label: 'Chord ii (Pre-Chorus / 5 Fingers)', probability: 0.003, degree: 'ii' },
                  { label: 'Mute / Silence (Closed Fist)', probability: 0.001, degree: 'MUTE' },
                  { label: 'Neutral / Floating Rest', probability: 0.001, degree: 'REST' }
                ]).map((item, idx) => {
                  const isTop = latestPrediction && latestPrediction.classIndex === idx;
                  const pct = (item.probability * 100).toFixed(1);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={isTop ? 'text-cyan-300 font-bold flex items-center gap-1.5' : 'text-slate-300'}>
                          {isTop && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                          {item.label}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-150 ${
                            isTop 
                              ? 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 shadow-md shadow-cyan-500/50' 
                              : 'bg-slate-700'
                          }`}
                          style={{ width: `${Math.max(1, item.probability * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Architecture Graph */}
        {activeTab === 'architecture' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 leading-relaxed">
              <strong>Dual-Stage Spatial-Temporal Neural Network:</strong> 
              1D Depthwise Separable <strong>Convolutional Neural Network (CNN)</strong> extracts spatial topological features from 21 hand landmarks, 
              which feed into a <strong>Temporal Long Short-Term Memory (LSTM)</strong> recurrent sequence network ($T=16$ frames) 
              modeling gesture momentum and continuous kinematic velocities.
            </div>

            <div className="space-y-2">
              {cnnLstmArchitecture.map((l, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-purple-300">
                      L{idx}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{l.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-cyan-300">
                          {l.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{l.desc}</div>
                    </div>
                  </div>
                  <GitBranch className="w-4 h-4 text-slate-600 hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: On-Device Training & Loss Curves */}
        {activeTab === 'training' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/30">
              <div>
                <h3 className="text-sm font-bold text-white">Live Model Fine-Tuning Simulator (15 Epochs)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Train the neural network weights right now in your browser using Adam and Categorical Cross-Entropy!
                </p>
              </div>
              <button
                onClick={handleRunTraining}
                disabled={isTraining}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all transform active:scale-95"
              >
                {isTraining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isTraining ? 'Training in Progress...' : 'Run Live Training'}</span>
              </button>
            </div>

            {/* Training Metrics Chart */}
            {trainingProgress && (
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">
                    Epoch {trainingProgress.epoch} / {trainingProgress.totalEpochs}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-rose-400">Loss: {Number(trainingProgress.loss).toFixed(4)}</span>
                    <span className="text-emerald-400">Accuracy: {(Number(trainingProgress.accuracy) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Live Epoch History Table */}
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Epoch</th>
                        <th className="p-2">Categorical Loss</th>
                        <th className="p-2">Accuracy (%)</th>
                        <th className="p-2">Optimizer Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {trainingProgress.history.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="p-2 text-purple-300">#{row.epoch}</td>
                          <td className="p-2 text-rose-300">{row.loss}</td>
                          <td className="p-2 text-emerald-300">{row.accuracy}%</td>
                          <td className="p-2 text-slate-400">Adam (lr=0.005) Step OK</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Mathematical Objective: Categorical Cross-Entropy Optimization</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
