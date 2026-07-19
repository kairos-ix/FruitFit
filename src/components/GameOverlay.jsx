import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore.js';
import { saveSession } from '../utils/storage.js';
import { estimateCalories } from '../utils/calories.js';
import { useEffect, useRef } from 'react';

export default function GameOverlay() {
  const navigate = useNavigate();
  const saved = useRef(false);
  const {
    phase, score, maxCombo, slices, bigSwings, duration, mode,
    setPhase, startGame, resetGame,
  } = useGameStore();

  const isGameOver = phase === 'gameover';
  const isPaused = phase === 'paused';

  // Save session when game over
  useEffect(() => {
    if (isGameOver && !saved.current) {
      saved.current = true;
      saveSession({
        score,
        maxCombo,
        slices,
        bigSwings,
        duration,
        mode,
        calories: estimateCalories(duration, bigSwings),
      });
    }
    if (!isGameOver) saved.current = false;
  }, [isGameOver, score, maxCombo, slices, bigSwings, duration, mode]);

  const calories = estimateCalories(duration, bigSwings);
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60);

  return (
    <AnimatePresence>
      {(isGameOver || isPaused) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15,12,41,0.95) 0%, rgba(48,43,99,0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            {isGameOver ? (
              <GameOverCard
                score={score}
                maxCombo={maxCombo}
                slices={slices}
                bigSwings={bigSwings}
                calories={calories}
                mins={mins}
                secs={secs}
                onPlayAgain={() => { saved.current = false; startGame(); }}
                onHome={() => { resetGame(); navigate('/'); }}
                onStats={() => navigate('/stats')}
              />
            ) : (
              <PauseCard
                onResume={() => setPhase('playing')}
                onRestart={() => { saved.current = false; startGame(); }}
                onHome={() => { resetGame(); navigate('/'); }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatRow({ label, value, emoji }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <span className="text-white/60 text-sm">{emoji} {label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}

function GameOverCard({ score, maxCombo, slices, bigSwings, calories, mins, secs, onPlayAgain, onHome, onStats }) {
  return (
    <div className="p-7">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🍉</div>
        <h2 className="text-3xl font-black text-white">Game Over!</h2>
        <p className="text-white/50 text-sm mt-1">Great workout, champ!</p>
        <div className="mt-4 text-5xl font-black"
          style={{ background: 'linear-gradient(90deg, #f9a825, #e91e63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {score.toLocaleString()}
        </div>
        <p className="text-white/40 text-xs mt-1">points</p>
      </div>

      <div className="mb-6 space-y-0">
        <StatRow emoji="🔥" label="Best Combo" value={`${maxCombo}x`} />
        <StatRow emoji="🍓" label="Fruits Sliced" value={slices} />
        <StatRow emoji="💪" label="Big Swings" value={bigSwings} />
        <StatRow emoji="⚡" label="Calories" value={`~${calories} kcal`} />
        <StatRow emoji="⏱️" label="Time" value={`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`} />
      </div>

      <div className="space-y-3">
        <button onClick={onPlayAgain}
          className="w-full py-3.5 rounded-2xl font-black text-lg text-black"
          style={{ background: 'linear-gradient(90deg, #f9a825, #e91e63)' }}>
          Play Again
        </button>
        <div className="flex gap-3">
          <button onClick={onStats}
            className="flex-1 py-3 rounded-2xl font-semibold text-white border border-white/20 hover:bg-white/10 transition">
            Stats
          </button>
          <button onClick={onHome}
            className="flex-1 py-3 rounded-2xl font-semibold text-white border border-white/20 hover:bg-white/10 transition">
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

function PauseCard({ onResume, onRestart, onHome }) {
  return (
    <div className="p-7 text-center">
      <div className="text-5xl mb-4">⏸️</div>
      <h2 className="text-3xl font-black text-white mb-2">Paused</h2>
      <p className="text-white/50 text-sm mb-8">Take a breather — you've earned it!</p>
      <div className="space-y-3">
        <button onClick={onResume}
          className="w-full py-3.5 rounded-2xl font-black text-lg text-black"
          style={{ background: 'linear-gradient(90deg, #00e5ff, #7c4dff)' }}>
          Resume
        </button>
        <button onClick={onRestart}
          className="w-full py-3 rounded-2xl font-semibold text-white border border-white/20 hover:bg-white/10 transition">
          Restart
        </button>
        <button onClick={onHome}
          className="w-full py-3 rounded-2xl font-semibold text-white/60 hover:text-white transition">
          Quit to Home
        </button>
      </div>
    </div>
  );
}
