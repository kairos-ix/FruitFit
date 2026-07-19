import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore.js';

const MODES = [
  { label: '3 min', value: 3, icon: '⚡', desc: 'Quick burn' },
  { label: '5 min', value: 5, icon: '🔥', desc: 'Full workout' },
  { label: '10 min', value: 10, icon: '💪', desc: 'Challenge mode' },
  { label: 'Endless', value: 'endless', icon: '♾️', desc: 'Beat your best' },
];

export default function ModeSelector({ onSelect }) {
  const { mode, setMode } = useGameStore();

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-xs mx-auto">
      {MODES.map((m, i) => {
        const selected = mode === m.value;
        return (
          <motion.button
            key={m.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setMode(m.value);
              onSelect?.(m.value);
            }}
            className={`
              relative rounded-2xl p-4 text-left transition-all
              ${selected
                ? 'text-black shadow-xl'
                : 'text-white border border-white/20 hover:border-white/40 hover:bg-white/10'
              }
            `}
            style={selected ? {
              background: 'linear-gradient(135deg, #f9a825, #e91e63)',
              boxShadow: '0 8px 32px rgba(233,30,99,0.4)',
            } : {}}
          >
            <div className="text-2xl mb-1">{m.icon}</div>
            <div className="font-black text-base leading-tight">{m.label}</div>
            <div className={`text-xs mt-0.5 ${selected ? 'text-black/70' : 'text-white/50'}`}>
              {m.desc}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
