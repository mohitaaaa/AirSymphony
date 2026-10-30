import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  ChevronRight, 
  Sparkles,
  Edit3,
  Sliders
} from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

export const SONG_PRESETS = [
  {
    title: 'Let It Be / Pop 4-Chords',
    artist: 'The Beatles / Pop Anthem',
    key: 'C',
    scale: 'major',
    lines: [
      { chord: 'C', fingers: '☝️ 1 Finger (I)', text: 'When I find myself in times of trouble' },
      { chord: 'G', fingers: '🤟 3 Fingers (V)', text: 'Mother Mary comes to me' },
      { chord: 'Am', fingers: '🖐️ 4 Fingers (vi)', text: 'Speaking words of wisdom' },
      { chord: 'F', fingers: '✌️ 2 Fingers (IV)', text: 'Let it be...' },
      { chord: 'C', fingers: '☝️ 1 Finger (I)', text: 'And in my hour of darkness' },
      { chord: 'G', fingers: '🤟 3 Fingers (V)', text: 'She is standing right in front of me' },
      { chord: 'F', fingers: '✌️ 2 Fingers (IV)', text: 'Speaking words of wisdom' },
      { chord: 'C', fingers: '☝️ 1 Finger (I)', text: 'Let it be, let it be!' }
    ]
  },
  {
    title: 'Someone Like You',
    artist: 'Adele',
    key: 'A',
    scale: 'major',
    lines: [
      { chord: 'A', fingers: '☝️ 1 Finger (I)', text: 'I heard that you\'re settled down' },
      { chord: 'C#m', fingers: '✋ 5 Fingers (iii)', text: 'That you found a girl and you\'re married now' },
      { chord: 'F#m', fingers: '🖐️ 4 Fingers (vi)', text: 'I heard that your dreams came true' },
      { chord: 'D', fingers: '✌️ 2 Fingers (IV)', text: 'Guess she gave you things I didn\'t give to you' },
      { chord: 'A', fingers: '☝️ 1 Finger (I)', text: 'Never mind, I\'ll find someone like you' },
      { chord: 'E', fingers: '🤟 3 Fingers (V)', text: 'I wish nothing but the best for you too' }
    ]
  },
  {
    title: 'Hallelujah',
    artist: 'Leonard Cohen / Jeff Buckley',
    key: 'C',
    scale: 'major',
    lines: [
      { chord: 'C', fingers: '☝️ 1 Finger (I)', text: 'Now I\'ve heard there was a secret chord' },
      { chord: 'Am', fingers: '🖐️ 4 Fingers (vi)', text: 'That David played, and it pleased the Lord' },
      { chord: 'F', fingers: '✌️ 2 Fingers (IV)', text: 'Well it goes like this, the fourth' },
      { chord: 'G', fingers: '🤟 3 Fingers (V)', text: 'The fifth, the minor fall and the major lift' },
      { chord: 'Am', fingers: '🖐️ 4 Fingers (vi)', text: 'The baffled king composing' },
      { chord: 'F', fingers: '✌️ 2 Fingers (IV)', text: 'Hallelujah...' }
    ]
  },
  {
    title: 'Stay With Me',
    artist: 'Sam Smith',
    key: 'C',
    scale: 'major',
    lines: [
      { chord: 'Am', fingers: '🖐️ 4 Fingers (vi)', text: 'Guess it\'s true, I\'m not good at a one-night stand' },
      { chord: 'F', fingers: '✌️ 2 Fingers (IV)', text: 'But I still need love \'cause I\'m just a man' },
      { chord: 'C', fingers: '☝️ 1 Finger (I)', text: 'These nights never seem to go to plan' },
      { chord: 'Am', fingers: '🖐️ 4 Fingers (vi)', text: 'Won\'t you stay with me?' },
      { chord: 'F', fingers: '✌️ 2 Fingers (IV)', text: '\'Cause you\'re all I need' },
      { chord: 'C', fingers: '☝️ 1 Finger (I)', text: 'This ain\'t love, it\'s clear to see...' }
    ]
  }
];

export default function SongGuideDrawer({ 
  isOpen, 
  onClose, 
  onSelectSongKey,
  onPlayChordDirectly
}) {
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [customLyrics, setCustomLyrics] = useState('');
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const currentSong = SONG_PRESETS[selectedSongIndex];

  // Auto-scrolling teleprompter effect
  useEffect(() => {
    let scrollTimer = null;
    const container = document.getElementById('teleprompter-scroll-box');

    if (isAutoScrolling && container) {
      scrollTimer = setInterval(() => {
        container.scrollTop += scrollSpeed;
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
          setIsAutoScrolling(false);
        }
      }, 50);
    }

    return () => {
      if (scrollTimer) clearInterval(scrollTimer);
    };
  }, [isAutoScrolling, scrollSpeed]);

  if (!isOpen) return null;

  const handleApplySong = (song) => {
    onSelectSongKey(song.key, song.scale);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Singer's Song Companion & Teleprompter
            </h2>
            <p className="text-[11px] text-slate-400">Chords & hand gestures synced to famous lyrics</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preset Songs Picker */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex gap-2 overflow-x-auto">
        {SONG_PRESETS.map((song, idx) => (
          <button
            key={song.title}
            onClick={() => {
              setSelectedSongIndex(idx);
              handleApplySong(song);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
              selectedSongIndex === idx
                ? 'bg-purple-950 border-purple-400 text-purple-200 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {song.title}
          </button>
        ))}
      </div>

      {/* Song Details Banner */}
      <div className="px-4 py-2.5 bg-purple-950/20 border-b border-purple-500/20 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">{currentSong.title}</div>
          <div className="text-[11px] text-purple-300">{currentSong.artist} • Key of {currentSong.key}</div>
        </div>
        <button
          onClick={() => handleApplySong(currentSong)}
          className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-[11px] font-semibold text-purple-200 transition-colors"
        >
          Set Key to {currentSong.key}
        </button>
      </div>

      {/* Teleprompter Scroll Box */}
      <div 
        id="teleprompter-scroll-box"
        className="flex-1 overflow-y-auto p-4 space-y-4 font-sans select-none"
      >
        {currentSong.lines.map((line, idx) => (
          <div 
            key={idx} 
            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors group"
          >
            {/* Gesture & Chord Indicator Badge */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                {line.fingers}
              </span>
              <span className="text-sm font-mono font-black text-purple-300 text-glow-purple">
                [ {line.chord} ]
              </span>
            </div>
            {/* Lyric line */}
            <p className="text-base font-medium text-slate-100 tracking-wide leading-relaxed">
              "{line.text}"
            </p>
          </div>
        ))}
      </div>

      {/* Teleprompter Bottom Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isAutoScrolling 
                ? 'bg-amber-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoScrolling ? 'Pause Scroll' : 'Auto Scroll'}</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('teleprompter-scroll-box');
              if (el) el.scrollTop = 0;
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset to Top"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scroll Speed */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Speed:</span>
          {[1, 2, 3].map((spd) => (
            <button
              key={spd}
              onClick={() => setScrollSpeed(spd)}
              className={`w-6 h-6 rounded-md font-mono font-bold text-[11px] transition-colors ${
                scrollSpeed === spd 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
