import React from 'react';
import { soundEngine } from '../audio/SoundEngine';

export default function ChordPalette({ 
  currentChord, 
  onChordChange, 
  currentKey, 
  scaleType 
}) {
  // Generate the 5 primary accompaniment chords for the scale
  const chordItems = [
    { fingerCount: 1, degree: 1, icon: '☝️', label: '1 Finger (Index)' },
    { fingerCount: 2, degree: 4, icon: '✌️', label: '2 Fingers (Peace)' },
    { fingerCount: 3, degree: 5, icon: '🤟', label: '3 Fingers' },
    { fingerCount: 4, degree: 6, icon: '🖐️', label: '4 Fingers' },
    { fingerCount: 5, degree: 2, icon: '✋', label: '5 Fingers (Open Palm)' },
  ].map(item => {
    const chordData = soundEngine.getChordForDegree(item.degree);
    return {
      ...item,
      chordData
    };
  });

  const handleManualPlay = (chordData) => {
    soundEngine.playChord(chordData, 0.85);
    onChordChange(chordData);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Left Hand Gesture Harmony Map</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
              Key of {currentKey}
            </span>
          </h3>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-medium">
            ✊ Fist = Mute
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {chordItems.map((item) => {
          const isActive = currentChord && currentChord.name === item.chordData.name;

          return (
            <button
              key={item.fingerCount}
              onClick={() => handleManualPlay(item.chordData)}
              className={`relative group p-3 rounded-xl border text-left transition-all duration-200 transform active:scale-95 flex flex-col justify-between h-28 overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-950/90 via-slate-900 to-indigo-950 border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Active Glow Accent */}
              {isActive && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-400/20 blur-xl pointer-events-none rounded-full" />
              )}

              {/* Top row: Finger icon and count */}
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">{item.icon}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.chordData.degree}
                </span>
              </div>

              {/* Middle: Chord Name */}
              <div>
                <div className={`text-2xl font-black font-mono tracking-tight leading-none ${
                  isActive ? 'text-white text-glow-cyan' : 'text-slate-100'
                }`}>
                  {item.chordData.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">
                  {item.label}
                </div>
              </div>

              {/* Bottom: Notes */}
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {item.chordData.trebleNotes.join(' • ')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
