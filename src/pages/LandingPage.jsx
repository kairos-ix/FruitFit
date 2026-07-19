import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import ModeSelector from '../components/ModeSelector.jsx';
import useGameStore from '../store/gameStore.js';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { startGame, facingMode, setFacingMode } = useGameStore();
  const [hasCamera, setHasCamera] = useState(null);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasCamera(true);
    } else {
      setHasCamera(false);
    }
  }, []);

  const handleStart = async () => {
    try {
      if (hasCamera) {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      }
    } catch (e) {
      console.warn("Camera request failed:", e);
    }
    startGame();
    navigate('/game');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
         style={{ background: 'radial-gradient(circle at center, #1e1332 0%, #0a0a0a 100%)' }}>
      
      <div className="absolute top-10 left-10 text-6xl opacity-10 rotate-12 blur-sm pointer-events-none">🍉</div>
      <div className="absolute bottom-20 right-10 text-8xl opacity-10 -rotate-12 blur-sm pointer-events-none">🍎</div>
      <div className="absolute top-40 right-32 text-5xl opacity-5 rotate-45 blur-sm pointer-events-none">🍍</div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="text-center z-10 w-full max-w-md"
      >
        <div className="text-7xl mb-4 drop-shadow-2xl">🍉🗡️</div>
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 mb-2 drop-shadow-lg">
          FruitFit
        </h1>
        <p className="text-white/60 text-lg md:text-xl font-medium mb-10">
          Slice fruits. Burn calories. No controllers.
        </p>

        <div className="mb-10">
          <p className="text-white/40 uppercase tracking-widest text-xs font-bold mb-4">Select Workout</p>
          <ModeSelector />
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 rounded-3xl text-2xl font-black text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(90deg, #ff8a00, #e52e71)',
            boxShadow: '0 10px 40px -10px rgba(229,46,113,0.8)'
          }}
        >
          START GAME
        </button>

        <div className="flex items-center justify-between mt-6 px-4">
          <button
            onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm font-semibold"
          >
            <span>🔄</span> {facingMode === 'user' ? 'Front Cam' : 'Back Cam'}
          </button>

          <button
            onClick={() => navigate('/stats')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm font-semibold"
          >
            <span>📊</span> Stats
          </button>
        </div>
      </motion.div>

      {hasCamera === false && (
        <div className="absolute bottom-12 left-0 right-0 text-center text-red-400 text-sm">
          Warning: Camera not detected. Game requires camera.
        </div>
      )}

    </div>
  );
}
