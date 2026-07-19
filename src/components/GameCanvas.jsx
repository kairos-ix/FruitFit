import { useRef, useEffect, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera.js';
import { useHandTracker } from '../hooks/useHandTracker.js';
import { useGameLoop } from '../hooks/useGameLoop.js';
import { useSound } from '../hooks/useSound.js';
import { GameEngine } from '../game/GameEngine.js';
import useGameStore from '../store/gameStore.js';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const engineRef = useRef(null);

  const facingMode = useGameStore((s) => s.facingMode);
  const phase = useGameStore((s) => s.phase);
  const addScore = useGameStore((s) => s.addScore);
  const setCombo = useGameStore((s) => s.setCombo);
  const resetCombo = useGameStore((s) => s.resetCombo);
  const addSlice = useGameStore((s) => s.addSlice);
  const loseLife = useGameStore((s) => s.loseLife);
  const clearShake = useGameStore((s) => s.clearShake);

  const isPlaying = phase === 'playing';

  const { play } = useSound();
  const { videoRef, error: camError, ready: camReady } = useCamera(facingMode);
  const handDataRef = useHandTracker(videoRef, isPlaying && camReady);

  useEffect(() => {
    engineRef.current = new GameEngine({
      onScore: (points) => {
        addScore(points);
        play('slice');
      },
      onCombo: (combo) => {
        // Engine is the source of truth for combo — set directly, don't increment
        setCombo(combo);
        if (combo >= 3) play('combo');
      },
      onMiss: () => {
        // PRD: missed fruits cost a life (3 strikes rule)
        loseLife();
        play('miss');
        setTimeout(() => clearShake(), 400);
      },
      onBombHit: () => {
        resetCombo();
        loseLife();
        play('bomb');
        setTimeout(() => clearShake(), 500);
      },
      onSlice: (isBigSwing) => {
        addSlice(isBigSwing);
      },
    });

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-acquire context after resize (canvas dimensions change invalidates it)
      ctxRef.current = canvas.getContext('2d', { willReadFrequently: false });
      engineRef.current?.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      engineRef.current?.reset();
    }
  }, [phase]);

  const loop = useCallback(
    (delta) => {
      const engine = engineRef.current;
      const ctx = ctxRef.current;
      if (!ctx || !engine) return;

      engine.update(delta, handDataRef.current);
      engine.render(ctx);
    },
    [handDataRef]
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
