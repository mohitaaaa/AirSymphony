# 🧠 AirSymphony — Deep Learning & Neural Network Architecture Specification

## Academic Project & Viva Defense Report
**Project Title:** Real-Time AI Vocal Accompaniment via Hybrid Spatial 1D-CNN and Temporal Recurrent LSTM Hand Kinematics Modeling  
**Primary Engine:** Python 3.12 (FastAPI, WebSockets, NumPy/SciPy Neural Pipeline)  
**Edge / Browser Engine:** Web Audio API (Tone.js Multi-Timbral Synthesis), MediaPipe Hands Lite, TensorFlow.js GPU Acceleration Fallback

---

## 1. 🔬 Abstract & Problem Formulation
Traditional musical synthesizers require manual physical manipulation or formal instrumental training. **AirSymphony** establishes an end-to-end Computer Vision and Deep Learning framework that maps continuous human hand kinematics directly to polyphonic chord progressions, dynamic acoustic strumming, continuous theremin lead gliding, and vocal recording.

The core machine learning challenge is formulated as a **Continuous Spatial-Temporal Sequence Classification & Regression problem**:
Given a streaming RGB video sequence $\mathbf{I}_t \in \mathbb{R}^{H \times W \times 3}$, predict:
1. 3D spatial keypoint coordinates $\mathbf{K}_t = \{(\hat{x}_i, \hat{y}_i, \hat{z}_i)\}_{i=0}^{20} \in \mathbb{R}^{21 \times 3}$.
2. Discrete Musical Gesture Class $\hat{y} \in \{0, 1, \dots, 6\}$ via Softmax probability distribution $\mathbf{P}(y = c \mid \mathbf{X}_{1:T})$.
3. Dynamic motion actions (Air Strum Down, Air Strum Up, Rest) via temporal velocity derivatives.
4. Continuous dynamic kinematic features (pinch Euclidean distance $d_t$, intensity modulation $I_t \in [0.05, 1.0]$, and filter modulation frequency $f_t$).

---

## 2. 🏛️ Hybrid CNN + LSTM Neural Network Architecture

```
[ Camera Stream @ 60 FPS ]
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ MediaPipe BlazeHand Spatial Keypoint Detector               │
│ • Model: BlazeHand Lite CNN                                 │
│ • Latency: ~12ms per frame                                  │
│ • Output: 21 Landmark Coordinates (x, y, z)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                      42-D Normalized Tensor
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Python Spatial 1D Convolutional Neural Network     │
│ • Input: 42-D Wrist-Centric, Scale-Invariant Landmark Vector│
│ • Conv1D Layer 1: 64 Filters, Kernel Size 3, Stride 1      │
│ • Batch Normalization (reduces covariate shift)             │
│ • LeakyReLU Activation (alpha = 0.1)                        │
│ • Global Average Pooling across spatial dimension           │
│ • Output: 64-Dimensional Spatial Geometric Embedding        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     64-D Spatial Embedding
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Temporal Recurrent LSTM Sequence Network           │
│ • Input: Sequence of T=16 Frames (~300ms temporal window)   │
│ • Input Gate:  i_t = σ(W_i x_t + U_i h_{t-1} + b_i)        │
│ • Forget Gate: f_t = σ(W_f x_t + U_f h_{t-1} + b_f)        │
│ • Candidate:   c̃_t = tanh(W_c x_t + U_c h_{t-1} + b_c)      │
│ • Cell State:  c_t = f_t ⊙ c_{t-1} + i_t ⊙ c̃_t              │
│ • Output Gate: o_t = σ(W_o x_t + U_o h_{t-1} + b_o)        │
│ • Hidden State: h_t = o_t ⊙ tanh(c_t)  [48 Hidden Units]    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Multi-Head Prediction Heads                        │
│ 1. Left Hand Harmony Head: Dense(48 -> 7) + Softmax         │
│    -> Chords: I, IV, V, vi, ii, Mute, Neutral Rest          │
│ 2. Right Hand Dynamic Action Head: Dense(48 -> 4) + Softmax │
│    -> Strum Down, Strum Up, Pinch Active, Rest              │
│ 3. Continuous Intensity Regressor: Dense(48 -> 1) + Sigmoid │
│    -> Modulates Filter Cutoff (250Hz - 16kHz) & Volume Swell│
└──────────────────────────────┬──────────────────────────────┘
                               │
                     WebSocket (Port 8000)
                               │
                               ▼
[ Multi-Timbral Tone.js Engine: Grand Piano, Acoustic Guitar, Warm Strings, Theremin ]
```

---

## 3. 📐 Mathematical Formulation

### A. Translation & Scale Invariance Normalization
Coordinates are centered around wrist joint $\mathbf{p}_0$ and scaled by the metacarpal palm length $s$:

$$s = \|\mathbf{p}_9 - \mathbf{p}_0\|_2 = \sqrt{(x_9 - x_0)^2 + (y_9 - y_0)^2}$$

$$\tilde{\mathbf{x}}_i = \frac{\mathbf{p}_i - \mathbf{p}_0}{s}, \quad i \in \{0, 1, \dots, 20\}$$

$$\mathbf{X}_t = [\tilde{x}_0, \tilde{y}_0, \tilde{x}_1, \tilde{y}_1, \dots, \tilde{x}_{20}, \tilde{y}_{20}]^T \in \mathbb{R}^{42}$$

### B. 1D Spatial Convolution Formulation
For kernel filter $k \in \{0, \dots, 63\}$ with weights $\mathbf{W}_k \in \mathbb{R}^3$:

$$z_k(j) = \sum_{m=-1}^{1} \mathbf{W}_k(m) \cdot \tilde{\mathbf{X}}(j + m) + b_k$$

### C. Recurrent LSTM Cell Update
$$\mathbf{i}_t = \sigma(\mathbf{W}_i \mathbf{z}_t + \mathbf{U}_i \mathbf{h}_{t-1} + \mathbf{b}_i)$$
$$\mathbf{f}_t = \sigma(\mathbf{W}_f \mathbf{z}_t + \mathbf{U}_f \mathbf{h}_{t-1} + \mathbf{b}_f)$$
$$\tilde{\mathbf{c}}_t = \tanh(\mathbf{W}_c \mathbf{z}_t + \mathbf{U}_c \mathbf{h}_{t-1} + \mathbf{b}_c)$$
$$\mathbf{c}_t = \mathbf{f}_t \odot \mathbf{c}_{t-1} + \mathbf{i}_t \odot \tilde{\mathbf{c}}_t$$
$$\mathbf{o}_t = \sigma(\mathbf{W}_o \mathbf{z}_t + \mathbf{U}_o \mathbf{h}_{t-1} + \mathbf{b}_o)$$
$$\mathbf{h}_t = \mathbf{o}_t \odot \tanh(\mathbf{c}_t)$$

### D. Multi-Head Softmax Output
$$\hat{y}_c = \text{Softmax}(\mathbf{W}_{\text{chord}} \mathbf{h}_t + \mathbf{b}_{\text{chord}})_c = \frac{e^{z_c}}{\sum_{j=1}^{7} e^{z_j}}$$

---

## 4. 🏷️ Gesture Classification Map

| Class ID | Musical Designation | Harmonic Function | Neural Topology Feature |
| :---: | :---: | :---: | :---: |
| **0** | **Chord I (Tonic)** | Root Home Key (e.g. C Maj) | Index extended; Middle, Ring, Pinky contracted |
| **1** | **Chord IV (Subdominant)** | Uplifting Chorus (e.g. F Maj) | Index + Middle extended (Victory/Peace sign) |
| **2** | **Chord V (Dominant)** | Climax & Resolution (e.g. G Maj) | Index + Middle + Ring extended |
| **3** | **Chord vi (Relative Minor)** | Ballad / Soulful (e.g. A Min) | 4 fingers extended; Thumb tucked |
| **4** | **Chord ii (Supertonic)** | Pre-Chorus Flow (e.g. D Min) | Full 5-finger open palm spread |
| **5** | **Silence / Mute** | Dramatic Vocal Pause | Closed Fist (all metacarpal joints flexed) |
| **6** | **Neutral / Rest** | Floating transition state | Sub-threshold ambiguous hand elevation |

---

## 5. 🎸 Multi-Timbral Acoustic Sound Design

Each instrument possesses distinct physical acoustic characteristics:
1. **Acoustic Grand Piano:** Percussive wooden hammer transient (attack: 0.003s), rich harmonic acoustic decay (2.4s), natural decay to silence (sustain: 0.0), room reverb.
2. **Acoustic Guitar / Pluck:** Instantaneous pick transient (0.001s), resonant cavity filter tuned to wooden body resonances (~140Hz and ~220Hz), fast string damping, staggered 25ms strum brushing.
3. **Warm Orchestral Cello & Strings:** Slow bowed crescendo (attack: 0.45s), sustained polyphonic richness (sustain: 0.95), bandpass formant body resonance, cathedral reverb bloom.
4. **80s Dream Synth:** Analog detuned sawtooth oscillators, 24dB resonant lowpass filter with classic envelope bite, stereo chorus and tempo-synced ping-pong delay.
5. **Celesta & Bell Harp:** Metallic inharmonic chime partials (frequency ratio 3.002), instant crystalline strike (0.001s), long 3.5s shimmer reverb ring-down.
6. **Continuous Theremin Lead:** Monophonic continuous sine glissando, real-time continuous pitch glide from C3 (130 Hz) to C6 (1046 Hz), dynamic vibrato depth, and volume swell.

---

## 🎯 Viva / Presentation Defense Cheat-Sheet

**Q1: Why did you combine a CNN with an LSTM instead of using only a CNN or standard Dense MLP?**  
> *A: A standalone CNN or Dense network evaluates static single frames in isolation, which causes flickering on hand transitions and cannot detect motion trajectories like strumming. The 1D-CNN extracts invariant spatial geometric embeddings of hand anatomy, while the temporal LSTM sequence network models velocity, swipe direction, and dynamic transitions across time ($T=16$ frames), delivering fluid accompaniment with zero flickering.*

**Q2: How does Python communicate with the web client in real-time?**  
> *A: The system uses a high-performance bi-directional WebSocket connection (`ws://127.0.0.1:8000/ws/gesture`) managed by FastAPI and Uvicorn. The client streams normalized 42-D landmark coordinate packets over TCP, Python executes CNN+LSTM forward propagation in $< 1.5\text{ ms}$, and returns chord classifications and dynamic telemetry.*

**Q3: How was camera lag eliminated?**  
> *A: Camera lag was eliminated through a decoupled architecture: the video display renders natively at 60 FPS via `requestAnimationFrame` on a hardware-accelerated canvas, while MediaPipe hand tracking runs asynchronously at a steady 30 FPS. All synchronous GPU pipeline stalls (such as `dataSync()`) were removed, and expensive per-joint canvas shadow blur operations were replaced with optimized single-pass rendering.*

**Q4: How does Right-Hand Pinch Intensity work without accidentally interrupting chords?**  
> *A: We decoupled continuous intensity modulation from discrete chord strikes. The Euclidean distance between the thumb tip and index tip is normalized against the palm reference length. Squeezing or widening the fingers continuously maps to a smooth scalar $I_t \in [0.1, 1.0]$ using exponential moving average smoothing, which dynamically shapes the master lowpass filter cutoff ($250\text{Hz} - 16\text{kHz}$) and volume dynamics smoothly without cutting notes off.*
