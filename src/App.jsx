import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CameraViewport from './components/CameraViewport';
import ChordPalette from './components/ChordPalette';
import InstrumentSelector, { INSTRUMENTS } from './components/InstrumentSelector';
import SongGuideDrawer from './components/SongGuideDrawer';
import RecordingStudioModal from './components/RecordingStudioModal';
import GestureHelpModal from './components/GestureHelpModal';
import ScaleKeyModal from './components/ScaleKeyModal';
import NeuralNetworkInspector from './components/NeuralNetworkInspector';
import BeginnerTourModal from './components/BeginnerTourModal';
import { soundEngine, SCALES } from './audio/SoundEngine';
import { videoRecorder } from './video/VideoRecorder';

export default function App() {
  // Musical configuration
  const [currentKey, setCurrentKey] = useState('C');
  const [scaleType, setScaleType] = useState('major');
  const [currentInstrument, setCurrentInstrument] = useState('ambientPad');
  const [octave, setOctave] = useState(4);
  const [currentChord, setCurrentChord] = useState(null);

  // Vision & Recording state
  const [handsDetectedCount, setHandsDetectedCount] = useState(0);
  const [playMode, setPlayMode] = useState('chords'); // 'chords' | 'airHarp' | 'theremin'
  const [recordingState, setRecordingState] = useState('idle');
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [micActive, setMicActive] = useState(true);

  // Modals & Drawers
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showSongGuide, setShowSongGuide] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showNeuralInspector, setShowNeuralInspector] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [latestNeuralPrediction, setLatestNeuralPrediction] = useState(null);

  // Show quick tour on initial load (skippable with 1 click)
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('airsymphony_tour_seen');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  const handleCloseTour = () => {
    localStorage.setItem('airsymphony_tour_seen', 'true');
    setShowTour(false);
  };

  // Synchronize key/scale with soundEngine
  useEffect(() => {
    soundEngine.setKeyAndScale(currentKey, scaleType);
  }, [currentKey, scaleType]);

  // Synchronize selected instrument with soundEngine & mode
  useEffect(() => {
    soundEngine.setInstrument(currentInstrument);
    if (currentInstrument === 'theremin') {
      if (playMode !== 'theremin') setPlayMode('theremin');
    } else {
      if (playMode === 'theremin') setPlayMode('chords');
    }
  }, [currentInstrument]);

  // Synchronize playMode changes back to instrument selector
  useEffect(() => {
    if (playMode === 'theremin') {
      if (currentInstrument !== 'theremin') {
        setCurrentInstrument('theremin');
      }
    } else if (currentInstrument === 'theremin') {
      setCurrentInstrument('ambientPad');
    }
  }, [playMode]);

  // Handle Recording State change from recorder
  const handleRecordingStateChange = (state) => {
    setRecordingState(state);
    if (state === 'stopped') {
      setRecordedBlobUrl(videoRecorder.recordedBlobUrl);
      setShowRecordingModal(true);
    }
  };

  const handleToggleMic = () => {
    setMicActive(!micActive);
  };

  const handleSelectSongKey = (key, scale) => {
    setCurrentKey(key);
    setScaleType(scale);
    soundEngine.setKeyAndScale(key, scale);
  };

  const activeInst = INSTRUMENTS.find(i => i.id === currentInstrument);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      
      {/* Top Studio Header */}
      <Header
        cameraActive={true}
        micActive={micActive}
        handsDetectedCount={handsDetectedCount}
        activeInstrumentName={activeInst ? activeInst.name : 'Vocal Pad'}
        currentKey={currentKey}
        scaleName={SCALES[scaleType]?.name.split(' ')[0] || 'Major'}
        onToggleMic={handleToggleMic}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenTour={() => setShowTour(true)}
        onOpenScaleModal={() => setShowScaleModal(true)}
        onToggleSongGuide={() => setShowSongGuide(!showSongGuide)}
        showSongGuide={showSongGuide}
        recordingState={recordingState}
        onOpenNeuralInspector={() => setShowNeuralInspector(true)}
        neuralLatency={latestNeuralPrediction?.inferenceTimeMs}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        
        {/* Camera Viewport & AR HUD */}
        <CameraViewport
          onHandsDetected={setHandsDetectedCount}
          currentChord={currentChord}
          onChordChange={setCurrentChord}
          recordingState={recordingState}
          onRecordingStateChange={handleRecordingStateChange}
          playMode={playMode}
          setPlayMode={setPlayMode}
          currentInstrument={currentInstrument}
          audioStarted={audioStarted}
          setAudioStarted={setAudioStarted}
          onNeuralPrediction={setLatestNeuralPrediction}
        />

        {/* Harmony & Chord Palette (Only in chords mode) */}
        {playMode === 'chords' && (
          <ChordPalette
            currentChord={currentChord}
            onChordChange={setCurrentChord}
            currentKey={currentKey}
            scaleType={scaleType}
          />
        )}

        {/* Instrument & Studio FX Controls */}
        <InstrumentSelector
          currentInstrument={currentInstrument}
          onSelectInstrument={setCurrentInstrument}
          octave={octave}
          setOctave={setOctave}
          audioStarted={audioStarted}
          setAudioStarted={setAudioStarted}
        />

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          AirSymphony Studio • Real-time Python CNN+LSTM Neural Network Vocal Accompaniment & Recorder
        </p>
      </footer>

      {/* Modals & Drawers */}
      <BeginnerTourModal
        isOpen={showTour}
        onClose={handleCloseTour}
      />

      <SongGuideDrawer
        isOpen={showSongGuide}
        onClose={() => setShowSongGuide(false)}
        onSelectSongKey={handleSelectSongKey}
        onPlayChordDirectly={(chord) => soundEngine.playChord(chord)}
      />

      <RecordingStudioModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        recordedBlobUrl={recordedBlobUrl}
        currentKey={currentKey}
        instrumentName={activeInst ? activeInst.name : 'Vocal Pad'}
      />

      <GestureHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <ScaleKeyModal
        isOpen={showScaleModal}
        onClose={() => setShowScaleModal(false)}
        currentKey={currentKey}
        scaleType={scaleType}
        onKeyChange={setCurrentKey}
        onScaleChange={setScaleType}
      />

      <NeuralNetworkInspector
        isOpen={showNeuralInspector}
        onClose={() => setShowNeuralInspector(false)}
        latestPrediction={latestNeuralPrediction}
      />

    </div>
  );
}
