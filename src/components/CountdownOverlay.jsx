import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore.js';

const STEPS = ['3', '2', '1', 'GO!'];

export default function CountdownOverlay() {
  const { phase, setPhase } = useGameStore();
  const [step, setStep] = useState(0);
  const visible = phase === 'countdown';

  useEffect(() => {
    if (!visible) {
      setStep(0);
      return;
    }

    setStep(0);
    const timers = STEPS.map((_, i) =>
      setTimeout(() => {
        setStep(i);
        if (i === STEPS.length - 1) {
          // transition to playing after "GO!" displays
          setTimeout(() => setPhase('playing'), 600);
        }
      }, i * 800)
    );

    return () => timers.forEach(clearTimeout);
  }, [visible, setPhase]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ scale: 2.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className={`text-center select-none drop-shadow-2xl ${
                STEPS[step] === 'GO!' ? 'text-green-400' : 'text-white'
              }`}
            >
              <span className="font-black" style={{ fontSize: 'clamp(80px, 20vw, 160px)' }}>
                {STEPS[step]}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
