import React from 'react';
import { X, Music, Check, Sparkles, Sliders } from 'lucide-react';
import { ROOT_NOTES, SCALES, POPULAR_PROGRESSIONS } from '../audio/SoundEngine';

export default function ScaleKeyModal({
  isOpen,
  onClose,
  currentKey,
  scaleType,
  onKeyChange,
  onScaleChange
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Musical Key & Scale Tuning</h2>
              <p className="text-xs text-slate-400">Match the instrument to your exact vocal range and song mood</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Root Key Selection */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2.5">
              1. Choose Vocal Root Key
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ROOT_NOTES.map((note) => {
                const isSelected = currentKey === note;
                return (
                  <button
                    key={note}
                    onClick={() => onKeyChange(note)}
                    className={`py-2 rounded-xl font-mono font-bold text-sm border transition-all ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-105'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {note}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scale Mode / Mood */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2.5">
              2. Scale Mood / Flavor
            </label>
            <div className="space-y-2">
              {Object.entries(SCALES).map(([key, item]) => {
                const isSelected = scaleType === key;
                return (
                  <button
                    key={key}
                    onClick={() => onScaleChange(key)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-400 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <span>{item.name}</span>
                        {isSelected && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Degrees: {item.degrees.join(' • ')}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Song Progression Presets */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2.5">
              Popular Chord Progression Cheat-Sheet
            </label>
            <div className="space-y-2">
              {POPULAR_PROGRESSIONS.map((prog, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{prog.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Fingers: {prog.fingerMap.map(f => `${f}F`).join(' ➔ ')}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-300 px-2 py-1 rounded bg-cyan-950/80 border border-cyan-500/30">
                    {prog.degrees.map(d => `deg-${d}`).join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
}
