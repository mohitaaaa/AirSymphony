import React from 'react';
import { X, Sparkles, Hand, Mic, Music, Check, ShieldCheck } from 'lucide-react';

export default function GestureHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const leftHandGestures = [
    { count: '1 Finger (Index)', degree: 'Chord I (Tonic)', desc: 'The fundamental root chord of the song (e.g. C Major)', icon: '☝️' },
    { count: '2 Fingers (Peace)', degree: 'Chord IV (Subdominant)', desc: 'Uplifting, soaring chord for choruses (e.g. F Major)', icon: '✌️' },
    { count: '3 Fingers', degree: 'Chord V (Dominant)', desc: 'Builds anticipation and resolves to home (e.g. G Major)', icon: '🤟' },
    { count: '4 Fingers', degree: 'Chord vi (Relative Minor)', desc: 'Soulful, emotional ballad chord (e.g. A Minor)', icon: '🖐️' },
    { count: '5 Fingers (Open Palm)', degree: 'Chord ii / iii', desc: 'Smooth transition pre-chorus chord (e.g. D Minor)', icon: '✋' },
    { count: 'Closed Fist', degree: 'Mute / Silence', desc: 'Immediately silences all notes for dramatic vocal pauses', icon: '✊' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Hand className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">How to Sing & Play with Gestures</h2>
              <p className="text-xs text-slate-400">Complete singer's guide to effortless hand accompaniment</p>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Singer Philosophy Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-pink-950/40 border border-cyan-500/30">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Designed For Singers Without Instruments</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              You don't need piano lessons or guitar calluses! Just raise your fingers in front of your camera while singing. 
              The AI tracks your hand in real-time, voicing lush chords and grand piano harmonies beneath your vocals.
            </p>
          </div>

          {/* Chords */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Chords & Harmony (Left OR Right Hand)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {leftHandGestures.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-cyan-300">{item.count}</div>
                    <div className="text-[11px] font-semibold text-white">{item.degree}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strumming & Expression */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>Air Strumming & Tone Expression (Secondary Hand)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-pink-300 mb-1">🌊 Air Strum Wave</div>
                <div className="text-[11px] text-slate-300">
                  Wave your right hand down or up to audibly strum the active chord like acoustic guitar strings, with dynamic speed and velocity.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-pink-300 mb-1">🤏 Pinch Intensity & Strike</div>
                <div className="text-[11px] text-slate-300">
                  Continuous pinch modulates sound intensity from quiet to full volume (shown via on-screen gauge), while a fast snap triggers an accent chord.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-pink-300 mb-1">🔥 Theremin Lead Mode</div>
                <div className="text-[11px] text-slate-300">
                  Switch to Theremin Lead to glide pitch smoothly in mid-air (C3 to C6) with natural vibrato and left-hand elevation volume control.
                </div>
              </div>
            </div>
          </div>

          {/* Tips for Recording Video */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
              <Mic className="w-3.5 h-3.5" />
              <span>Recording Your Singing Performance</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>Position your camera so both your face and your hands are inside the frame.</li>
              <li>Click <strong>Record Performance</strong> — a 3-second countdown will start, and the app will record your camera video, your vocal singing microphone, and the hand-played synthesizer sound mixed together!</li>
              <li>When finished, click <strong>Finish & Preview</strong> to watch your take and download the video to keep or share on social media!</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            Got It, Let's Sing!
          </button>
        </div>

      </div>
    </div>
  );
}
