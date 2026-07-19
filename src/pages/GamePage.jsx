import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore.js';
import GameCanvas from '../components/GameCanvas.jsx';
import HUD from '../components/HUD.jsx';
import CountdownOverlay from '../components/CountdownOverlay.jsx';
import GameOverlay from '../components/GameOverlay.jsx';

export default function GamePage() {
  const navigate = useNavigate();
  const { phase, mode, duration, screenShake, setPhase, setDuration, resetGame } = useGameStore();

  // If page reloaded, go back home
  useEffect(() => {
    if (phase === 'idle') {
      navigate('/', { replace: true });
    }
  }, [phase, navigate]);

  // Timer loop for tracking duration and ending game if mode is timed
  useEffect(() => {
    if (phase !== 'playing') return;

    // Capture current duration so the effect doesn't re-fire on every tick
    const initialDuration = useGameStore.getState().duration;
    let startTime = Date.now() - initialDuration * 1000;
    let timerId;

    const tick = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      setDuration(elapsed);

      if (mode !== 'endless' && elapsed >= mode * 60) {
        setPhase('gameover');
        return;
      }
      timerId = requestAnimationFrame(tick);
    };

    timerId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode]);

  // Pause on blur or escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && phase === 'playing') {
        setPhase('paused');
      }
    };
    
    // Auto-pause if tab loses focus
    const handleBlur = () => {
      if (phase === 'playing') {
        setPhase('paused');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [phase, setPhase]);

  // Handle back button specifically to pause/quit instead of navigating unexpectedly
  useEffect(() => {
    const handlePopState = (e) => {
      if (phase === 'playing') {
        e.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
        setPhase('paused');
      } else {
        resetGame();
      }
    };
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [phase, setPhase, resetGame]);

  return (
    <div 
      className={`fixed inset-0 overflow-hidden bg-black transition-transform duration-75 ${screenShake ? 'translate-x-2 translate-y-1' : ''}`}
    >
      <GameCanvas />
      
      {/* Hide HUD if game over or paused so overlay is clean */}
      {phase !== 'gameover' && phase !== 'paused' && <HUD />}
      
      <CountdownOverlay />
      <GameOverlay />

      {/* Pause Button */}
      {phase === 'playing' && (
        <button
          onClick={() => setPhase('paused')}
          className="absolute top-4 right-5 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur shadow-lg transition"
        >
          <span className="text-white font-bold leading-none select-none">||</span>
        </button>
      )}
    </div>
  );
}
