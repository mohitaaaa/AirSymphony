# 🎵 AirSymphony Studio — Real-Time Neural Network Vocal Accompaniment

> **An ultra-low latency real-time AI hand gesture synthesizer and performance video recording studio designed specifically for singers and vocalists who don't play musical instruments.**

With **AirSymphony Studio**, any singer can accompany themselves in real-time:
- **Dual-Hand Harmony**: Raise 1 to 5 fingers on **either** your Left Hand or Right Hand to voice rich musical chords (`I`, `IV`, `V`, `vi`, `ii`) in perfect harmony with your singing key!
- **Opposite Hand Expression**: Wave down or up to audibly strum acoustic guitar strings, pinch fingers to modulate continuous volume intensity, or raise/lower hand to sweep acoustic brightness.
- **7 Authentic Multi-Timbral Instruments**: Acoustic Grand Piano, Acoustic Guitar, Lush Ambient Pad, 80s Dream Synth, Warm Cello & Strings, Celesta Bell Harp, and Theremin Lead.
- **Air Harp Mode**: Reach out and pluck glowing holographic laser strings floating in mid-air.
- **Studio Performance Video Recorder**: Synchronously captures HD camera video, vocal microphone, and gesture synthesizer audio into a high-definition video take!

---

## 🌟 Architecture & Key Features

### 1. 🧠 Dual-Stage Spatial-Temporal Neural Network (Python + WebGL)
- **Spatial 1D-CNN Backbone**: Extracts 64-D translation and scale-invariant spatial embeddings from 21 3D hand landmarks.
- **Temporal LSTM Recurrent Network**: Models motion dynamics over a $T=16$ frame sequence (~300ms window) for gesture velocity, transition detection, and directional strum swipes.
- **Sub-2ms Inference**: Real-time bidirectional streaming over WebSockets between the browser client and Python FastAPI server (`ws://127.0.0.1:8000/ws/gesture`).
- **On-Device WebGL Fallback**: Runs locally in browser via TensorFlow.js GPU acceleration when offline.

### 2. ⚡ Zero-Lag Camera & Instant Audio Response
- **Streamlined 2-Frame Debouncing**: Transitions between chords in ~35ms without sluggish multi-frame voting delays.
- **Ultra-Low Audio Lookahead**: Web Audio lookAhead set to `0.002s` with `latencyHint: 'interactive'` for instantaneous (<5ms) sound trigger response.
- **Native 60 FPS HD Camera Viewport**: Hardware-accelerated canvas pipeline with synchronized rendering.

### 3. 🎹 Authentic Acoustic Instruments
1. **Acoustic Grand Piano**: Percussive wooden hammer attack (`0.002s`), resonant exponential string decay, and warm singing acoustic sustain (`0.35`) through studio room reverb.
2. **Acoustic Guitar**: Authentic Karplus-Strong string pluck transient with dreadnought soundhole acoustic cavity filter (`3400Hz`) and micro-arpeggiated 15ms pick brush.
3. **Ambient Vocal Pad**: Celestial choral synth with vintage analog chorus, stereo delay, and cathedral reverb.
4. **80s Dream Synth**: Detuned analog saw polyphonic synth with punchy brassy attack and resonant filter sweep.
5. **Warm Cello & Strings**: Bowed orchestral ensemble swell with rich vibrato resonance.
6. **Celesta & Bell Harp**: Crystalline metallic FM bell harmonics with sparkling shimmer.
7. **Theremin Lead**: Continuous pitch glide (C3 to C6) in mid-air with real-time vibrato.

---

## 🚀 How to Run

### Quick Start (1-Click)
Double-click `start.bat` in this folder:
```cmd
start.bat
```
This automatically launches:
1. The **Python CNN + LSTM Neural Network Server** (`http://127.0.0.1:8000`)
2. The **Vite Frontend Studio** (`http://localhost:3000`)
3. Opens your default browser ready to sing!

### Manual Start
```bash
# Terminal 1: Python Neural Network Backend
python python_backend/server.py

# Terminal 2: React Frontend Studio
npm run dev
```

---

## 🎮 Hand Gesture Reference

| Hand | Gesture | Musical Action |
| :--- | :--- | :--- |
| **Either Hand (Left or Right)** | ☝️ 1 Finger (Index) | **Chord I (Tonic)** — Home chord (e.g. C Major) |
| **Either Hand (Left or Right)** | ✌️ 2 Fingers (Peace) | **Chord IV (Subdominant)** — Uplifting chorus chord (e.g. F Major) |
| **Either Hand (Left or Right)** | 🤟 3 Fingers | **Chord V (Dominant)** — Tension & climax chord (e.g. G Major) |
| **Either Hand (Left or Right)** | 🖐️ 4 Fingers | **Chord vi (Relative Minor)** — Emotional ballad chord (e.g. A Minor) |
| **Either Hand (Left or Right)** | ✋ 5 Fingers (Open Palm) | **Chord ii / iii** — Pre-chorus transition chord (e.g. D Minor) |
| **Either Hand** | ✊ Closed Fist | **Mute / Silence** — Silences all notes for dramatic vocal pauses |
| **Opposite / Secondary Hand** | 🌊 Down/Up Wave | **Air Strum** — Strums active chord across strings |
| **Opposite / Secondary Hand** | 🤏 Pinch (Thumb + Index) | **Dynamic Intensity** — Continuous volume & filter sweep (0-100%) |
| **Opposite / Secondary Hand** | ↕️ Vertical Elevation | **Brightness** — Modulates resonant lowpass filter frequency |

*Keyboard Fallbacks: Keys `1`-`5` = Chords, `S` or `Down Arrow` = Strum, `0` or `Space` = Mute.*
