import React, { useEffect } from 'react';
import { 
  Download, 
  RotateCcw, 
  X, 
  Sparkles, 
  CheckCircle, 
  Share2, 
  Music, 
  Mic, 
  Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { videoRecorder } from '../video/VideoRecorder';

export default function RecordingStudioModal({ 
  isOpen, 
  onClose, 
  recordedBlobUrl,
  currentKey,
  instrumentName
}) {
  useEffect(() => {
    if (isOpen && recordedBlobUrl) {
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f3ff', '#b829ff', '#ff2d75', '#ffd200']
      });
    }
  }, [isOpen, recordedBlobUrl]);

  if (!isOpen || !recordedBlobUrl) return null;

  const handleDownload = () => {
    videoRecorder.downloadRecording();
  };

  const handleDiscardAndClose = () => {
    videoRecorder.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Your Singing Performance Take</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-medium">
                  RECORDED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mixed vocal singing audio + gesture-controlled musical accompaniment
              </p>
            </div>
          </div>
          <button
            onClick={handleDiscardAndClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Preview */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
            <video
              src={recordedBlobUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>

          {/* Session Metadata Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Audio Track</div>
                <div className="text-xs font-semibold text-slate-200">Vocals + Synth Mixed</div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <Music className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Key Scale</div>
                <div className="text-xs font-semibold text-slate-200">Key of {currentKey}</div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Instrument</div>
                <div className="text-xs font-semibold text-slate-200 truncate">{instrumentName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleDiscardAndClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Take Another Recording</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD PERFORMANCE VIDEO</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
