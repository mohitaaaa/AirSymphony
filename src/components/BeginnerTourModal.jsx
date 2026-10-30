import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Hand, 
  Waves, 
  Sparkles, 
  Piano, 
  Guitar, 
  Flame, 
  Volume2, 
  Cpu, 
  CheckCircle2,
  Play
} from 'lucide-react';

const TOUR_STEPS = [
  {
    title: 'Welcome to AirSymphony Studio',
    subtitle: 'Sing without instruments — your hands become the orchestra',
    icon: Sparkles,
    gradient: 'from-cyan-500 to-purple-600',
    content: (
      <div className="space-y-3 text-slate-300 text-xs sm:text-sm">
        <p>
          AirSymphony is designed for vocalists and music lovers. Standard webcams track your hand kinematics in real-time, 
          letting you trigger chords, strum strings, and glide lead melodies completely hands-free while singing!
        </p>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30 flex items-center gap-3">
          <Cpu className="w-8 h-8 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">Powered by Python CNN + LSTM</span>
            Dual-stage neural network extracts spatial landmarks and models temporal sequences with sub-2ms response.
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Dual-Hand Harmony: Left OR Right Hand Chords',
    subtitle: 'Raise fingers (1-5) on either hand to trigger rich backing harmony',
    icon: Hand,
    gradient: 'from-cyan-500 to-blue-600',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-bold text-cyan-300">☝️ 1 Finger</div>
            <div className="text-white font-semibold">Chord I (Tonic)</div>
            <div className="text-[10px] text-slate-400">Home chord (e.g. C Maj)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-bold text-cyan-300">✌️ 2 Fingers</div>
            <div className="text-white font-semibold">Chord IV (Subdominant)</div>
            <div className="text-[10px] text-slate-400">Uplifting chorus (e.g. F Maj)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-bold text-cyan-300">🤟 3 Fingers</div>
            <div className="text-white font-semibold">Chord V (Dominant)</div>
            <div className="text-[10px] text-slate-400">Climax & resolve (e.g. G Maj)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-bold text-cyan-300">🖐️ 4-5 Fingers</div>
            <div className="text-white font-semibold">Chords vi & ii</div>
            <div className="text-[10px] text-slate-400">Ballad minor / pre-chorus</div>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-pink-950/30 border border-pink-500/30 text-[11px] text-pink-300 flex items-center gap-2">
          <span className="font-bold">✊ Closed Fist:</span> Silences all notes for dramatic vocal pauses!
        </div>
      </div>
    )
  },
  {
    title: 'Right Hand: Air Strumming & Pinch Intensity',
    subtitle: 'Expressive rhythm and continuous dynamic volume control',
    icon: Waves,
    gradient: 'from-pink-500 to-amber-500',
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
          <span className="text-2xl">🌊</span>
          <div>
            <div className="font-bold text-white text-xs">Air Strum Wave</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Wave your right hand <strong>downward or upward</strong> across the screen to audibly strum the active chord across strings with acoustic guitar velocity! Watch the glowing guitar strings oscillate in real-time.
            </p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
          <span className="text-2xl">🤏</span>
          <div>
            <div className="font-bold text-white text-xs">Pinch Intensity Control</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Squeeze or widen your thumb and index finger to smoothly increase or decrease intensity (0% to 100%), shaping volume and harmonic filter brightness without cutting notes off!
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Instruments & Theremin Lead Mode',
    subtitle: 'Authentic Grand Piano, Acoustic Guitar, Strings, or continuous Theremin',
    icon: Piano,
    gradient: 'from-amber-500 to-rose-600',
    content: (
      <div className="space-y-3 text-xs sm:text-sm text-slate-300">
        <p>
          Each instrument uses specialized acoustic sound models:
        </p>
        <ul className="grid grid-cols-2 gap-2 text-[11px]">
          <li className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span><strong>Acoustic Piano:</strong> Percussive hammer strike & natural acoustic decay.</span>
          </li>
          <li className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span><strong>Acoustic Guitar:</strong> Real plucked nylon/steel string timbre.</span>
          </li>
          <li className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span><strong>80s Dream Synth:</strong> Analog resonant filter sweep & chorus.</span>
          </li>
          <li className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span><strong>Theremin Lead:</strong> Continuous mid-air pitch gliding & vibrato!</span>
          </li>
        </ul>
        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300">
          💡 Click <strong>Record Performance</strong> to capture your camera video + vocal microphone + synthesizer into a downloadable video take!
        </div>
      </div>
    )
  }
];

export default function BeginnerTourModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${step.gradient} flex items-center justify-center shadow-lg shadow-cyan-500/20`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Beginner Guide • Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">{step.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-slate-400 font-medium">{step.subtitle}</p>
          {step.content}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors font-semibold"
          >
            Skip Tour
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  idx === currentStep ? 'w-5 bg-cyan-400 shadow shadow-cyan-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              <span>{isLast ? "Let's Play!" : 'Next'}</span>
              {isLast ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
