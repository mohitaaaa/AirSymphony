import React, { useState } from 'react';
import { 
  Piano, 
  Waves, 
  Guitar, 
  Radio, 
  Volume2, 
  Sparkles, 
  Sliders, 
  Maximize2,
  Wind,
  Flame
} from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

export const INSTRUMENTS = [
  {
    id: 'ambientPad',
    name: 'Ambient Vocal Pad',
    category: 'Vocal Pad',
    icon: Wind,
    color: 'from-cyan-500 to-blue-600',
    description: 'Lush celestial pad, perfect for emotional singing ballads'
  },
  {
    id: 'grandPiano',
    name: 'Acoustic Piano',
    category: 'Keyboard',
    icon: Piano,
    color: 'from-amber-500 to-orange-600',
    description: 'Dynamic grand piano with rich harmonic acoustic decay'
  },
  {
    id: 'acousticGuitar',
    name: 'Acoustic Guitar',
    category: 'Strings',
    icon: Guitar,
    color: 'from-emerald-500 to-teal-600',
    description: 'Warm plucked string timbre for singer-songwriter accompaniment'
  },
  {
    id: 'dreamSynth',
    name: '80s Dream Synth',
    category: 'Synth',
    icon: Radio,
    color: 'from-purple-500 to-pink-600',
    description: 'Analog retro warmth with rich polyphonic detune'
  },
  {
    id: 'warmStrings',
    name: 'Warm Cello & Strings',
    category: 'Orchestral',
    icon: Waves,
    color: 'from-rose-500 to-red-600',
    description: 'Smooth sustained orchestral strings that swell with your voice'
  },
  {
    id: 'celesta',
    name: 'Celesta & Bell Harp',
    category: 'Acoustic Bells',
    icon: Sparkles,
    color: 'from-yellow-400 to-amber-500',
    description: 'Delicate crystalline bell chimes with sparkle acoustic reverb'
  },
  {
    id: 'theremin',
    name: 'Theremin Lead',
    category: 'Continuous Lead',
    icon: Flame,
    color: 'from-pink-500 to-amber-500',
    description: 'Continuous vocal pitch glide and expressiveness in mid-air'
  }
];

export default function InstrumentSelector({ 
  currentInstrument, 
  onSelectInstrument,
  octave,
  setOctave,
  audioStarted,
  setAudioStarted
}) {
  const [volume, setVolume] = useState(85);
  const [reverbWet, setReverbWet] = useState(42);

  const handleInstrumentChange = async (id) => {
    if (!soundEngine.isInitialized) {
      await soundEngine.init();
      if (setAudioStarted) setAudioStarted(true);
    }
    soundEngine.setInstrument(id);
    onSelectInstrument(id);
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    soundEngine.setMasterVolume(val / 100);
  };

  const handleReverbChange = (e) => {
    const val = Number(e.target.value);
    setReverbWet(val);
    soundEngine.setReverbDecay(val / 100);
  };

  const handleOctaveShift = (delta) => {
    const newOctave = Math.max(2, Math.min(6, octave + delta));
    setOctave(newOctave);
    soundEngine.octave = newOctave;
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Virtual Instrument & Studio Tone</span>
          </h3>
          <p className="text-xs text-slate-400">Select the sound that best complements your singing style</p>
        </div>

        {/* Octave Range Transposition for Singer Vocal Range */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
          <span className="text-xs text-slate-400 font-medium">Vocal Octave:</span>
          <button
            onClick={() => handleOctaveShift(-1)}
            disabled={octave <= 2}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 transition-colors"
          >
            -
          </button>
          <span className="text-xs font-mono font-bold text-cyan-300 w-5 text-center">
            {octave}
          </span>
          <button
            onClick={() => handleOctaveShift(1)}
            disabled={octave >= 6}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Instruments Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {INSTRUMENTS.map((inst) => {
          const Icon = inst.icon;
          const isSelected = currentInstrument === inst.id;

          return (
            <button
              key={inst.id}
              onClick={() => handleInstrumentChange(inst.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-24 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-md shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${inst.color} flex items-center justify-center shadow`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow shadow-cyan-400 animate-pulse" />
                )}
              </div>

              <div>
                <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {inst.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {inst.category}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Audio FX Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
        {/* Master Volume */}
        <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800">
          <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
              <span>Instrument Volume</span>
              <span className="font-mono text-cyan-300">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Reverb Space */}
        <div className="flex items-center gap-3 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
              <span>Acoustic Reverb Hall</span>
              <span className="font-mono text-purple-300">{reverbWet}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={reverbWet}
              onChange={handleReverbChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
