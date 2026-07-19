import { useRef, useEffect, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera.js';
import { useHandTracker } from '../hooks/useHandTracker.js';
import { useGameLoop } from '../hooks/useGameLoop.js';
import { GameEngine } from '../game/GameEngine.js';
import useGameStore from '../store/gameStore.js';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const handDataRef = useRef(null);

  const { facingMode, phase, addScore, incrementCombo, resetCombo, addSlice, loseLife, clearShake } =
    useGameStore();

  const isPlaying = phase === 'playing';

  // Camera
  const { videoRef, error: camError, ready: camReady } = useCamera(facingMode);

  // Hand tracking
  const handData = useHandTracker(videoRef, isPlaying && camReady);

  // Keep latest hand data in a ref for the game loop
  useEffect(() => {
    handDataRef.current = handData;
  }, [handData]);

  // Instantiate the engine once
  useEffect(() => {
    engineRef.current = new GameEngine({
      onScore: (points, combo) => {
        addScore(points);
        if (combo > 1) incrementCombo();
      },
      onCombo: (combo) => {
        if (combo >= 2) incrementCombo();
      },
      onMiss: () => {
        // Only lose a life for missed fruits if combo was active (optional rule)
        // PRD says bombs and misses cost lives — keep it relaxed
      },
      onBombHit: () => {
        resetCombo();
        loseLife();
        setTimeout(() => clearShake(), 500);
      },
      onSlice: (isBigSwing) => {
        addSlice(isBigSwing);
      },
    });

    // Size canvas to window
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      engineRef.current?.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset engine when game starts
  useEffect(() => {
    if (phase === 'playing') {
      engineRef.current?.reset();
    }
  }, [phase]);

  // Game loop
  const loop = useCallback(
    (delta) => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;

      const ctx = canvas.getContext('2d');
      engine.update(delta, handDataRef.current);
      engine.render(ctx);
    },
    []
  );

  useGameLoop(loop, isPlaying);

  return (
    <>
      {/* Camera video — mirrored, fills background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Dark overlay for readability when no camera */}
      {!camReady && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />
      )}

      {camError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 text-white p-6 rounded-2xl text-center">
            <p className="text-2xl mb-2">📷 Camera Error</p>
            <p className="text-sm opacity-70">{camError}</p>
          </div>
        </div>
      )}

      {/* Game canvas — transparent overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />
    </>
  );
}
