import * as Tone from 'tone';

// Musical scale formulas (semitone offsets from root)
export const SCALES = {
  major: {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    chordQualities: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
    degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
  },
  minor: {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    chordQualities: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
    degrees: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']
  },
  dorian: {
    name: 'Dorian Minor (Soul / Jazz)',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    chordQualities: ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],
    degrees: ['i', 'ii', 'III', 'IV', 'v', 'vi°', 'VII']
  },
  pentatonic: {
    name: 'Pentatonic (Never hits a wrong note)',
    intervals: [0, 2, 4, 7, 9],
    chordQualities: ['maj', 'min', 'min', 'maj', 'min'],
    degrees: ['I', 'ii', 'iii', 'V', 'vi']
  },
  blues: {
    name: 'Blues Scale',
    intervals: [0, 3, 5, 6, 7, 10],
    chordQualities: ['7', '7', '7', 'dim', '7', '7'],
    degrees: ['I7', 'bIII', 'IV7', 'bV', 'V7', 'bVII']
  }
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Chord progressions famous in pop, ballads, and songwriting
export const POPULAR_PROGRESSIONS = [
  {
    name: 'Pop 4-Chords (Let It Be, Someone Like You)',
    degrees: [1, 5, 6, 4], // I - V - vi - IV
    fingerMap: [1, 3, 4, 2] // mapped to 1 finger, 3 fingers, 4 fingers, 2 fingers
  },
  {
    name: 'Emotional Singer-Songwriter (Hallelujah, Adele)',
    degrees: [6, 4, 1, 5], // vi - IV - I - V
    fingerMap: [4, 2, 1, 3]
  },
  {
    name: '50s Doo-Wop / Classic Ballad',
    degrees: [1, 6, 4, 5], // I - vi - IV - V
    fingerMap: [1, 4, 2, 3]
  },
  {
    name: 'R&B / Soul Flow',
    degrees: [2, 5, 1, 6], // ii - V - I - vi
    fingerMap: [5, 3, 1, 4]
  },
  {
    name: 'Acoustic Folk / Indie Melancholy',
    degrees: [1, 3, 4, 5], // I - iii - IV - V
    fingerMap: [1, 5, 2, 3]
  }
];

// ============================================================================
// DEDICATED ACOUSTIC GUITAR PHYSICAL MODELING ENGINE
// Karplus-Strong physical string models (Tone.PluckSynth pool) + Dreadnought
// wooden soundhole resonance + pick scrape transients + room reverb
// ============================================================================
class AcousticGuitarEngine {
  constructor(roomReverb) {
    this.name = 'AcousticGuitarEngine';
    this.roomReverb = roomReverb;

    // 1. Acoustic Dreadnought Body Soundhole Filter & Resonance EQ
    this.bodyFilter = new Tone.Filter({
      frequency: 4200,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.5
    });

    this.bodyEQ = new Tone.EQ3({
      low: 4.5,       // Warm 140Hz dreadnought body & soundhole air resonance
      mid: 2.2,       // Crisp steel-string pick attack presence (2.2kHz)
      high: -2.0,     // Warm acoustic roll-off above 4.5kHz
      lowFrequency: 180,
      highFrequency: 4500
    });

    this.bodyFilter.connect(this.bodyEQ);
    if (this.roomReverb) {
      this.bodyEQ.connect(this.roomReverb);
    }

    // 2. Karplus-Strong PluckSynth physical string voice pool (12 voices for rich 6-string polyphony)
    this.voicePoolSize = 12;
    this.pluckVoices = [];
    this.voiceIndex = 0;

    for (let i = 0; i < this.voicePoolSize; i++) {
      try {
        const v = new Tone.PluckSynth({
          attackNoise: 2.2, // Authentic acoustic pick strike on steel string
          dampening: 3600,  // Realistic steel/bronze string frequency-dependent damping
          resonance: 0.975, // Rich acoustic body sustain
          release: 1.4
        });
        v.volume.value = 1.5;
        v.connect(this.bodyFilter);
        this.pluckVoices.push(v);
      } catch (e) {
        console.warn('[AcousticGuitarEngine] PluckSynth voice init:', e);
      }
    }

    // 3. Companion Acoustic Wooden Body Resonance PolySynth layer
    // Adds warm acoustic chamber depth and low-end projection to the Karplus-Strong pick
    this.resonanceSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle8' // Rich warm acoustic overtone series
      },
      envelope: {
        attack: 0.002, // Crisp pick pluck
        decay: 2.4,    // Natural guitar acoustic decay
        sustain: 0.0,  // Real strings decay naturally to silence! NO synth drone!
        release: 0.4
      }
    });
    this.resonanceSynth.volume.value = -3.5;
    this.resonanceSynth.maxPolyphony = 12;
    this.resonanceSynth.connect(this.bodyFilter);
  }

  _getPluckVoice() {
    if (this.pluckVoices.length === 0) return null;
    const voice = this.pluckVoices[this.voiceIndex];
    this.voiceIndex = (this.voiceIndex + 1) % this.pluckVoices.length;
    return voice;
  }

  triggerAttack(notes, time = Tone.now(), velocity = 0.85) {
    const noteArray = Array.isArray(notes) ? notes : [notes];
    const now = typeof time === 'number' ? time : Tone.now();

    // Natural finger/pick brush spread across strings (14ms per string)
    noteArray.forEach((note, idx) => {
      const stringTime = now + (noteArray.length > 1 ? idx * 0.014 : 0);
      const voice = this._getPluckVoice();
      if (voice) {
        try {
          voice.triggerAttack(note, stringTime);
        } catch (e) {}
      }
    });

    try {
      this.resonanceSynth.triggerAttack(noteArray, now, velocity);
    } catch (e) {}
  }

  triggerRelease(notes, time = Tone.now()) {
    try {
      this.resonanceSynth.triggerRelease(notes, time);
    } catch (e) {}
    this.pluckVoices.forEach(v => {
      try {
        v.triggerRelease(time);
      } catch (e) {}
    });
  }

  triggerAttackRelease(notes, duration = '1m', time = Tone.now(), velocity = 0.85) {
    const noteArray = Array.isArray(notes) ? notes : [notes];
    const now = typeof time === 'number' ? time : Tone.now();

    noteArray.forEach((note, idx) => {
      const stringTime = now + (noteArray.length > 1 ? idx * 0.016 : 0);
      const voice = this._getPluckVoice();
      if (voice) {
        try {
          voice.triggerAttack(note, stringTime);
        } catch (e) {}
      }
    });

    try {
      this.resonanceSynth.triggerAttackRelease(noteArray, duration, now, velocity);
    } catch (e) {}
  }

  releaseAll(time = Tone.now()) {
    try {
      this.resonanceSynth.releaseAll(time);
    } catch (e) {}
    this.pluckVoices.forEach(v => {
      try {
        v.triggerRelease(time);
      } catch (e) {}
    });
  }

  connect(destination) {
    this.bodyEQ.connect(destination);
    return this;
  }
}

// ============================================================================
// DEDICATED CONCERT GRAND PIANO ENGINE
// FM Acoustic Piano Physics: Felt Hammer Strike + Spruce Soundboard Resonance
// ============================================================================
class GrandPianoEngine {
  constructor(roomReverb) {
    this.name = 'GrandPianoEngine';
    this.roomReverb = roomReverb;

    // 1. Piano spruce soundboard & wooden rim EQ/Filter
    this.soundboardEQ = new Tone.EQ3({
      low: 4.2,      // Deep 150Hz spruce soundboard & cast-iron plate authority
      mid: 2.0,      // Felt hammer attack transient clarity around 2.4kHz
      high: -3.0,    // Softens upper digital harmonics for warm concert hall realism
      lowFrequency: 180,
      highFrequency: 5500
    });

    this.pianoFilter = new Tone.Filter({
      frequency: 6400,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.0
    });

    this.pianoFilter.connect(this.soundboardEQ);
    if (this.roomReverb) {
      this.soundboardEQ.connect(this.roomReverb);
    }

    // 2. High-Fidelity FM Acoustic Piano Synth Engine:
    // Harmonicity 1.0 = fundamental steel string coupling
    // Modulator = felt hammer impact transient
    // Natural singing grand piano acoustic decay
    this.pianoSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.0,
      modulationIndex: 4.6, // Rich wooden felt hammer strike
      oscillator: {
        type: 'sine' // Pure fundamental string tone
      },
      envelope: {
        attack: 0.002, // Crisp felt hammer strike
        decay: 3.2,    // Long singing grand piano decay
        sustain: 0.02, // Acoustic piano naturally fades (never drones like an organ!)
        release: 0.55  // Felt dampers falling on strings
      },
      modulation: {
        type: 'triangle' // Rich hammer strike harmonic series
      },
      modulationEnvelope: {
        attack: 0.001, // Immediate hammer impact transient
        decay: 0.16,   // Hammer impact rapidly dampens in 160ms
        sustain: 0.01, // Leaves clean singing string
        release: 0.25
      }
    });

    this.pianoSynth.volume.value = 2.5;
    this.pianoSynth.maxPolyphony = 12;
    this.pianoSynth.connect(this.pianoFilter);
  }

  triggerAttack(notes, time = Tone.now(), velocity = 0.85) {
    const noteArray = Array.isArray(notes) ? notes : [notes];
    const now = typeof time === 'number' ? time : Tone.now();
    try {
      this.pianoSynth.triggerAttack(noteArray, now, velocity);
    } catch (e) {}
  }

  triggerRelease(notes, time = Tone.now()) {
    try {
      this.pianoSynth.triggerRelease(notes, time);
    } catch (e) {}
  }

  triggerAttackRelease(notes, duration = '2n', time = Tone.now(), velocity = 0.85) {
    const noteArray = Array.isArray(notes) ? notes : [notes];
    const now = typeof time === 'number' ? time : Tone.now();
    try {
      this.pianoSynth.triggerAttackRelease(noteArray, duration, now, velocity);
    } catch (e) {}
  }

  releaseAll(time = Tone.now()) {
    try {
      this.pianoSynth.releaseAll(time);
    } catch (e) {}
  }

  connect(destination) {
    this.soundboardEQ.connect(destination);
    return this;
  }
}

class SoundEngine {
  constructor() {
    this.isInitialized = false;
    this.currentInstrument = 'ambientPad';
    this.rootKey = 'C';
    this.scaleType = 'major';
    this.octave = 4;
    this.activeChordName = null;
    this.activeNotes = [];
    this.isMuted = false;
    this.intensity = 0.85;

    // Master volume & bus FX
    this.masterVolume = null;
    this.limiter = null;
    this.analyzer = null;
    this.filter = null;

    // Dedicated FX buses for distinct instrument timbres
    this.ambientReverb = null;
    this.roomReverb = null;
    this.shimmerReverb = null;
    this.stereoDelay = null;
    this.analogChorus = null;

    // Output for recording stream
    this.recordingDestination = null;

    // Instruments collection
    this.instruments = {};

    // Dedicated Karplus-Strong Physical String Modeling Acoustic Guitar Engine
    this.guitarStrings = [];
    this.guitarBodyFilter = null;

    // Dedicated Continuous Theremin Lead Engine
    this.thereminOsc = null;
    this.thereminVibrato = null;
    this.thereminFilter = null;
    this.thereminGain = null;
    this.isThereminPlaying = false;
    this.currentThereminPitch = 440;

    // Active chord tracking
    this.activeChord = null;
    this.lastTriggeredFingerCount = -1;
  }

  async init() {
    if (this.isInitialized) return;

    await Tone.start();
    // Ultra-low latency configuration for instantaneous gesture response (no sound delay!)
    Tone.getContext().lookAhead = 0.002;
    try {
      Tone.getContext().latencyHint = 'interactive';
    } catch (e) {}
    const ctx = Tone.getContext().rawContext;

    // Create recording destination node for composite video recording capture
    this.recordingDestination = ctx.createMediaStreamDestination();

    // Master Ear-Protection Limiter
    this.limiter = new Tone.Limiter(-1).toDestination();

    // Master Analyzer for UI audio visualizer
    this.analyzer = new Tone.Analyser('fft', 32);

    // Master Volume node
    this.masterVolume = new Tone.Volume(-2);
    this.masterVolume.connect(this.analyzer);
    this.analyzer.connect(this.limiter);
    Tone.connect(this.masterVolume, this.recordingDestination);

    // Dynamic Master Lowpass Filter (Modulated by hand elevation & pinch intensity)
    this.filter = new Tone.Filter({
      frequency: 8000,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.0
    }).connect(this.masterVolume);

    // 1. Ambient Cathedral Reverb (Lush wash for choral vocal pad & cello, zero preDelay!)
    this.ambientReverb = new Tone.Reverb({
      decay: 3.8,
      preDelay: 0.005,
      wet: 0.35
    });
    await this.ambientReverb.generate();
    this.ambientReverb.connect(this.filter);

    // 2. Acoustic Studio Room Reverb (Natural tight acoustic decay for piano & guitar)
    this.roomReverb = new Tone.Reverb({
      decay: 1.6,
      preDelay: 0.005,
      wet: 0.22
    });
    await this.roomReverb.generate();
    this.roomReverb.connect(this.filter);

    // 3. Shimmer Reverb (Crystalline sparkle for celesta bell harp)
    this.shimmerReverb = new Tone.Reverb({
      decay: 3.0,
      preDelay: 0.005,
      wet: 0.35
    });
    await this.shimmerReverb.generate();
    this.shimmerReverb.connect(this.masterVolume);

    // 4. Stereo Feedback Delay (For 80s dream synth & ambient pad)
    this.stereoDelay = new Tone.FeedbackDelay({
      delayTime: '8n.',
      feedback: 0.20,
      wet: 0.18
    }).connect(this.ambientReverb);

    // 5. Vintage Analog Stereo Chorus
    this.analogChorus = new Tone.Chorus({
      frequency: 2.2,
      delayTime: 3.2,
      depth: 0.65,
      wet: 0.32
    }).start().connect(this.stereoDelay);

    // Build unique, authentic instruments with specialized acoustic & synthesis architectures
    this.buildInstruments();

    // Initialize dedicated Continuous Theremin Lead synth
    this.buildTheremin();

    // Initialize default active chord (Tonic Chord I)
    this.activeChord = this.getChordForDegree(1);

    this.isInitialized = true;
    console.log('[SoundEngine] Multi-timbral acoustic & synthesizer engines successfully initialized.');
  }

  buildInstruments() {
    // ------------------------------------------------------------------------
    // 1. Ambient Vocal Pad: Lush celestial choral synth with instant response
    // Fast 0.06s attack so chords trigger immediately when fingers raise
    // ------------------------------------------------------------------------
    this.instruments.ambientPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 3,
        spread: 26
      },
      envelope: {
        attack: 0.06,
        decay: 1.2,
        sustain: 0.85,
        release: 2.0
      }
    });
    this.instruments.ambientPad.maxPolyphony = 12;
    this.instruments.ambientPad.connect(this.analogChorus);

    // ------------------------------------------------------------------------
    // 2. Acoustic Grand Piano: Dedicated FM Felt Hammer + Spruce Soundboard Engine
    // Authentic acoustic physics: felt hammer transient + singing acoustic decay
    // ------------------------------------------------------------------------
    this.instruments.grandPiano = new GrandPianoEngine(this.roomReverb);

    // ------------------------------------------------------------------------
    // 3. Acoustic Guitar: Dedicated Karplus-Strong Physical String Modeling + Dreadnought Body Engine
    // Authentic steel & bronze plucked strings with wooden soundhole resonance
    // ------------------------------------------------------------------------
    this.instruments.acousticGuitar = new AcousticGuitarEngine(this.roomReverb);

    // ------------------------------------------------------------------------
    // 4. 80s Dream Synth: Detuned analog saw with resonant filter sweep
    // ------------------------------------------------------------------------
    const dreamFilter = new Tone.Filter({
      frequency: 2400,
      type: 'lowpass',
      rolloff: -24,
      Q: 3.0
    }).connect(this.analogChorus);

    this.instruments.dreamSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 3,
        spread: 35
      },
      envelope: {
        attack: 0.04,
        decay: 0.6,
        sustain: 0.7,
        release: 1.2
      }
    });
    this.instruments.dreamSynth.maxPolyphony = 12;
    this.instruments.dreamSynth.connect(dreamFilter);

    // ------------------------------------------------------------------------
    // 5. Warm Cello & Strings: Orchestral chamber swell with responsive attack
    // ------------------------------------------------------------------------
    const stringsFormant = new Tone.Filter({
      frequency: 2200,
      type: 'bandpass',
      Q: 1.2
    }).connect(this.ambientReverb);

    this.instruments.warmStrings = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sawtooth' // Classic bowed string timbre
      },
      envelope: {
        attack: 0.08,   // Responsive bowed swell
        decay: 0.8,
        sustain: 0.95,  // Sustains with vocal harmony
        release: 1.8
      }
    });
    this.instruments.warmStrings.maxPolyphony = 12;
    this.instruments.warmStrings.connect(stringsFormant);

    // ------------------------------------------------------------------------
    // 6. Celesta & Bell Harp: Crystalline FM metallic bell harmonics
    // ------------------------------------------------------------------------
    this.instruments.celesta = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.002, // Metallic bell ratio
      modulationIndex: 9.0,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.001,  // Instantaneous metal chime strike
        decay: 2.4,     // Long sparkling ring
        sustain: 0.0,   // Bells do not drone
        release: 1.8
      },
      modulation: {
        type: 'sine'
      },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.8,
        sustain: 0.0,
        release: 0.8
      }
    });
    this.instruments.celesta.maxPolyphony = 12;
    this.instruments.celesta.connect(this.shimmerReverb);
  }

  // ------------------------------------------------------------------------
  // Dedicated Continuous Theremin Lead Engine
  // ------------------------------------------------------------------------
  buildTheremin() {
    this.thereminGain = new Tone.Gain(0).connect(this.masterVolume);

    this.thereminVibrato = new Tone.Vibrato({
      frequency: 5.5,
      depth: 0.15
    }).connect(this.thereminGain);

    this.thereminFilter = new Tone.Filter({
      frequency: 4500,
      type: 'lowpass',
      rolloff: -12
    }).connect(this.thereminVibrato);

    this.thereminOsc = new Tone.Synth({
      oscillator: {
        type: 'sine' // Pure Theremin sine wave
      },
      envelope: {
        attack: 0.03,
        decay: 0.1,
        sustain: 1.0,
        release: 0.2
      },
      portamento: 0.03
    }).connect(this.thereminFilter);
  }

  startTheremin(freqHz = 440, volNorm = 0.7) {
    if (!this.isInitialized) return;
    const clampedFreq = Math.max(80, Math.min(2200, freqHz));
    this.currentThereminPitch = clampedFreq;

    if (!this.isThereminPlaying) {
      try {
        this.thereminOsc.triggerAttack(clampedFreq);
      } catch (e) {}
      this.isThereminPlaying = true;
    } else {
      this.thereminOsc.frequency.rampTo(clampedFreq, 0.02);
    }

    const targetGain = Math.max(0.0, Math.min(1.0, volNorm * this.intensity));
    this.thereminGain.gain.rampTo(targetGain, 0.04);
  }

  updateTheremin(freqHz, volNorm = 0.7, vibratoAmount = 0.15) {
    if (!this.isInitialized) return;
    const clampedFreq = Math.max(80, Math.min(2200, freqHz));
    this.currentThereminPitch = clampedFreq;

    if (!this.isThereminPlaying) {
      this.startTheremin(clampedFreq, volNorm);
      return;
    }

    // Continuous smooth pitch glide
    this.thereminOsc.frequency.rampTo(clampedFreq, 0.02);

    // Dynamic continuous volume
    const targetGain = Math.max(0.0, Math.min(1.0, volNorm * this.intensity));
    this.thereminGain.gain.rampTo(targetGain, 0.03);

    if (this.thereminVibrato) {
      this.thereminVibrato.depth.value = Math.max(0.0, Math.min(0.45, vibratoAmount));
    }
  }

  stopTheremin() {
    if (!this.isInitialized || !this.isThereminPlaying) return;
    this.thereminGain.gain.rampTo(0.0, 0.05);
    setTimeout(() => {
      if (this.isThereminPlaying) {
        try {
          this.thereminOsc.triggerRelease();
        } catch (e) {}
        this.isThereminPlaying = false;
      }
    }, 60);
  }

  getActiveInstrument() {
    return this.instruments[this.currentInstrument] || this.instruments.ambientPad;
  }

  setInstrument(name) {
    if (this.currentInstrument === name && this.instruments[name]) {
      return;
    }

    if (name === 'theremin') {
      this.stopAllNotes();
      this.currentInstrument = 'theremin';
      console.log('[SoundEngine] Switched to Theremin Lead mode');
      return;
    }

    this.currentInstrument = name;
    console.log(`[SoundEngine] Switched instrument to: ${name}`);
    this.stopAllNotes();

    // If sound engine is initialized, voice a distinct signature chord preview in the new instrument timbre!
    if (this.isInitialized) {
      const chord = this.activeChord || this.getChordForDegree(1);
      if (chord) {
        this.playChord(chord, 0.85);
      }
    }
  }

  setKeyAndScale(rootKey, scaleType) {
    this.rootKey = rootKey;
    this.scaleType = scaleType;
    this.activeChord = this.getChordForDegree(1);
  }

  setMasterVolume(val) {
    if (this.masterVolume) {
      if (val <= 0.01) {
        this.masterVolume.mute = true;
      } else {
        this.masterVolume.mute = false;
        this.masterVolume.volume.rampTo(Tone.gainToDb(val), 0.04);
      }
    }
  }

  // Continuous expression & intensity modulation (triggered by Right Hand pinch or elevation)
  setIntensity(val) {
    const clamped = Math.max(0.1, Math.min(1.0, val));
    this.intensity = clamped;

    if (this.filter) {
      // Dynamic expressive sweep: 300Hz to 16000Hz
      const cutoff = 250 + Math.pow(clamped, 2) * 15750;
      this.filter.frequency.rampTo(cutoff, 0.04);
    }

    if (this.masterVolume && !this.masterVolume.mute) {
      // Dynamic volume swell (±5dB)
      const dbOffset = (clamped - 0.75) * 8;
      this.masterVolume.volume.rampTo(-2 + dbOffset, 0.04);
    }
  }

  setReverbDecay(decay) {
    if (this.ambientReverb) {
      this.ambientReverb.wet.rampTo(decay, 0.08);
    }
    if (this.roomReverb) {
      this.roomReverb.wet.rampTo(decay * 0.45, 0.08);
    }
  }

  setFilterCutoff(frequencyHz) {
    if (this.filter) {
      const clamped = Math.max(200, Math.min(18000, frequencyHz));
      this.filter.frequency.rampTo(clamped, 0.05);
    }
  }

  // Calculate notes for a scale degree (1-indexed: 1 = Tonic, 2 = ii, etc.)
  getChordForDegree(degreeIndex, octaveShift = 0) {
    const scale = SCALES[this.scaleType] || SCALES.major;
    const intervals = scale.intervals;
    const qualities = scale.chordQualities;
    const count = intervals.length;

    const zeroIndex = (degreeIndex - 1) % count;
    const rootOffset = intervals[zeroIndex];
    const thirdOffset = intervals[(zeroIndex + 2) % count];
    const fifthOffset = intervals[(zeroIndex + 4) % count];

    // Compute MIDI note for Root
    const baseOctave = this.octave + octaveShift;
    const rootMidi = Tone.Frequency(`${this.rootKey}${baseOctave}`).toMidi();

    const note1 = Tone.Frequency(rootMidi + rootOffset, 'midi').toNote();
    const note3 = Tone.Frequency(rootMidi + (thirdOffset < rootOffset ? thirdOffset + 12 : thirdOffset), 'midi').toNote();
    const note5 = Tone.Frequency(rootMidi + (fifthOffset < rootOffset ? fifthOffset + 12 : fifthOffset), 'midi').toNote();
    
    // Add deep bass root 1 octave lower for full accompaniment
    const bassNote = Tone.Frequency(rootMidi + rootOffset - 12, 'midi').toNote();

    const quality = qualities[zeroIndex] || '';
    const roman = scale.degrees[zeroIndex] || `deg-${degreeIndex}`;
    const chordName = `${note1.replace(/\d/, '')}${quality === 'min' ? 'm' : quality === 'dim' ? '°' : quality === '7' ? '7' : ''}`;

    const chordObj = {
      name: chordName,
      degree: roman,
      notes: [bassNote, note1, note3, note5],
      trebleNotes: [note1, note3, note5]
    };

    return chordObj;
  }

  // Map finger counts (1..5) to standard singer chord progressions
  getChordFromFingerCount(count, customMap = null) {
    if (count <= 0) return null;

    let degree = 1;
    if (customMap && customMap[count - 1]) {
      degree = customMap[count - 1];
    } else {
      switch (count) {
        case 1: degree = 1; break; // I (Tonic)
        case 2: degree = 4; break; // IV (Subdominant)
        case 3: degree = 5; break; // V (Dominant)
        case 4: degree = 6; break; // vi (Relative Minor)
        case 5: degree = 2; break; // ii (Pre-chorus)
        default: degree = 1; break;
      }
    }
    const chord = this.getChordForDegree(degree);
    if (chord) {
      this.activeChord = chord;
    }
    return chord;
  }

  // Play full sustained or acoustic chord based on authentic instrument physics
  playChord(chordData, velocity = 0.85) {
    if (!this.isInitialized) return;
    const targetChord = chordData || this.activeChord || this.getChordForDegree(1);
    if (!targetChord) return;

    this.activeChord = targetChord;
    this.activeChordName = targetChord.name;

    // In theremin mode, theremin uses continuous lead
    if (this.currentInstrument === 'theremin') {
      const rootMidi = Tone.Frequency(targetChord.notes[1]).toFrequency();
      this.startTheremin(rootMidi, 0.85);
      return;
    }

    const inst = this.getActiveInstrument();

    // Release previous sustained notes if changing chord
    if (this.activeNotes.length > 0) {
      try {
        inst.triggerRelease(this.activeNotes);
      } catch (e) {}
      this.activeNotes = [];
    }

    this.activeNotes = targetChord.notes;
    const finalVelocity = Math.max(0.3, Math.min(1.0, velocity * this.intensity));
    const now = Tone.now();

    // 1. Acoustic Grand Piano: Strike chord with rich wooden hammer attack and singing acoustic decay
    if (this.currentInstrument === 'grandPiano') {
      inst.triggerAttack(this.activeNotes, now, finalVelocity);
    } 
    // 2. Acoustic Guitar: Rapid acoustic plectrum string brush (15ms acoustic pick spread)
    // Makes chords sound like a real plucked acoustic guitar with natural wood resonance!
    else if (this.currentInstrument === 'acousticGuitar') {
      this.activeNotes.forEach((n, idx) => {
        inst.triggerAttack(n, now + idx * 0.015, finalVelocity * (1.0 - idx * 0.03));
      });
    } 
    // 3. Celesta / Bells: Crystalline chime arpeggio with shimmering ringing
    else if (this.currentInstrument === 'celesta') {
      this.activeNotes.forEach((n, idx) => {
        inst.triggerAttackRelease(n, '1m', now + idx * 0.020, finalVelocity);
      });
    } 
    // 4. Sustained Accompaniment: Strings, Vocal Pad, 80s Dream Synth
    else {
      inst.triggerAttack(this.activeNotes, now, finalVelocity);
    }
  }

  // Strum a chord (arpeggiate notes with realistic acoustic guitar pick timing)
  strumChord(chordData, direction = 'down', speed = 0.028, intensity = 0.9) {
    if (!this.isInitialized) return;
    const targetChord = chordData || this.activeChord || this.getChordForDegree(1);
    if (!targetChord) return;

    this.activeChord = targetChord;
    this.activeChordName = targetChord.name;

    const inst = this.getActiveInstrument();
    const notesToStrum = direction === 'down' ? [...targetChord.notes] : [...targetChord.notes].reverse();

    const now = Tone.now();
    const finalSpeed = Math.max(0.015, Math.min(0.038, speed));
    const baseVel = Math.max(0.45, Math.min(1.0, intensity * this.intensity));

    // Release any lingering sustained notes for clear strum articulation
    if (this.activeNotes.length > 0) {
      try {
        inst.triggerRelease(this.activeNotes);
      } catch (e) {}
      this.activeNotes = [];
    }

    notesToStrum.forEach((note, idx) => {
      // Natural velocity tapering across strings
      const vel = Math.max(0.4, baseVel - idx * 0.035);
      inst.triggerAttackRelease(note, '1m', now + (idx * finalSpeed), vel);
    });
  }

  // Play a single note (used for air harp virtual strings)
  playSingleNote(note, duration = '4n', velocity = 0.85) {
    if (!this.isInitialized) return;
    const inst = this.getActiveInstrument();
    inst.triggerAttackRelease(note, duration, Tone.now(), velocity * this.intensity);
  }

  // Stop active sustained notes
  stopAllNotes() {
    if (!this.isInitialized) return;
    if (this.isThereminPlaying) {
      this.stopTheremin();
    }
    // Stop all instrument poly synths cleanly so notes never hang or leak into one another
    Object.keys(this.instruments).forEach(key => {
      const inst = this.instruments[key];
      try {
        if (inst && typeof inst.releaseAll === 'function') {
          inst.releaseAll();
        }
      } catch (e) {}
    });
    this.activeNotes = [];
    this.activeChordName = null;
  }

  // Get audio stream for video recording composite
  getRecordingStream() {
    return this.recordingDestination ? this.recordingDestination.stream : null;
  }

  // Get real-time FFT values for audio visualizer
  getAnalyzerData() {
    if (!this.analyzer) return new Uint8Array(32);
    return this.analyzer.getValue();
  }
}

export const soundEngine = new SoundEngine();
