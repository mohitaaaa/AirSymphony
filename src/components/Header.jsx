import React from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  HelpCircle, 
  Music, 
  Sliders, 
  BookOpen, 
  Radio,
  Cpu
} from 'lucide-react';

export default function Header({ 
  cameraActive, 
  micActive, 
  handsDetectedCount, 
  activeInstrumentName,
  currentKey,
  scaleName,
  onToggleMic,
  onOpenHelp,
  onOpenTour,
  onOpenScaleModal,
  onToggleSongGuide,
  showSongGuide,
  recordingState,
  onOpenNeuralInspector,
  neuralLatency
}) {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Air<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">Symphony</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-medium">STUDIO</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Vocal Accompaniment & Gesture Instrument for Singers
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 text-xs">
          {/* Hands Status */}
          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium transition-colors ${
            handsDetectedCount > 0 
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' 
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${handsDetectedCount > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Hands: {handsDetectedCount}/2</span>
          </div>

          {/* Key & Scale Badge */}
          <button 
            onClick={onOpenScaleModal}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-slate-200 flex items-center gap-1.5 transition-colors"
            title="Change Key & Scale"
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono font-bold text-purple-300">{currentKey}</span>
            <span className="text-slate-400 text-[11px] truncate max-w-[80px]">{scaleName}</span>
          </button>

          {/* Deep Neural Network Inspector Button */}
          <button
            onClick={onOpenNeuralInspector}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 hover:border-cyan-400 border border-cyan-500/50 text-cyan-200 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 group"
            title="Open Deep Learning / CNN Neural Network Inspector"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-pulse" />
            <span className="font-bold text-[11px]">Deep Neural Net</span>
            <span className="text-[10px] px-1 rounded bg-cyan-900/60 font-mono text-cyan-300">
              {neuralLatency ? `${neuralLatency}ms` : 'GPU'}
            </span>
          </button>

          {/* Recording Badge */}
          {recordingState === 'recording' && (
            <div className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/60 text-red-300 flex items-center gap-1.5 font-mono font-semibold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500" />
              <span>RECORDING</span>
            </div>
          )}
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mic Toggle */}
          <button
            onClick={onToggleMic}
            className={`p-2 rounded-lg border transition-all ${
              micActive 
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={micActive ? 'Vocal Microphone: ON' : 'Vocal Microphone: MUTED'}
          >
            {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
          </button>

          {/* Song Guide / Teleprompter */}
          <button
            onClick={onToggleSongGuide}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              showSongGuide 
                ? 'bg-purple-950/80 border-purple-500 text-purple-200' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Song Presets & Lyrics Teleprompter"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Songs & Lyrics</span>
          </button>

          {/* Beginner Tour Demo */}
          <button
            onClick={onOpenTour}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-purple-600/30 hover:from-cyan-600/50 hover:to-purple-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Start Interactive Beginner Tour Demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Quick Tour</span>
          </button>

          {/* Gesture Guide / Help */}
          <button
            onClick={onOpenHelp}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Gesture Guide</span>
          </button>
        </div>

      </div>
    </header>
  );
}
