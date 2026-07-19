import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore.js';

function Heart({ filled }) {
  return (
    <span className={`text-2xl transition-all duration-300 ${filled ? 'opacity-100' : 'opacity-25 grayscale'}`}>
      ❤️
    </span>
  );
}

function ComboTag({ combo }) {
  return (
    <AnimatePresence mode="wait">
      {combo >= 2 && (
        <motion.div
          key={combo}
          initial={{ scale: 0.4, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.3, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="text-center"
        >
          <span
            className={`
              inline-block font-black tracking-wide rounded-full px-4 py-1 text-sm
              ${combo >= 10 ? 'bg-purple-500 text-white' :
                combo >= 5 ? 'bg-orange-500 text-white' :
                'bg-yellow-400 text-black'}
            `}
          >
            {combo}x COMBO
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function HUD() {
  const { score, combo, lives, mode, duration } = useGameStore();

  const maxLives = 3;
  const isEndless = mode === 'endless';

  // Format timer
  const modeSecs = isEndless ? null : mode * 60;
  const remaining = modeSecs !== null ? Math.max(0, modeSecs - Math.floor(duration)) : null;
  const displaySecs = remaining !== null ? remaining : Math.floor(duration);
  const mins = Math.floor(displaySecs / 60);
  const secs = displaySecs % 60;
  const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-5 pt-4">
        {/* Score */}
        <div className="flex flex-col items-start">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Score</span>
          <motion.span
            key={score}
            initial={{ scale: 1.3, color: '#ffe57f' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.25 }}
            className="text-4xl font-black text-white leading-none drop-shadow-lg"
          >
            {score.toLocaleString()}
          </motion.span>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
            {isEndless ? 'Time' : 'Left'}
          </span>
          <span
            className={`text-3xl font-black leading-none drop-shadow-lg tabular-nums
              ${remaining !== null && remaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}
          >
            {timerStr}
          </span>
        </div>

        {/* Lives */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Lives</span>
          <div className="flex gap-1">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart key={i} filled={i < lives} />
            ))}
          </div>
        </div>
      </div>

      {/* Combo badge — centred below score */}
      <div className="absolute top-20 left-0 right-0 flex justify-center">
        <ComboTag combo={combo} />
      </div>
    </div>
  );
}
