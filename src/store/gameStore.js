import { create } from 'zustand';

/**
 * Game phases:
 *  'idle'       - home screen
 *  'permission' - requesting camera
 *  'countdown'  - 3-2-1-GO
 *  'playing'    - game active
 *  'paused'     - game paused
 *  'gameover'   - game ended
 */

const INITIAL_STATE = {
  // Game phase
  phase: 'idle',

  // Selected mode: 3 | 5 | 10 | 'endless'
  mode: 3,

  // Score
  score: 0,
  combo: 0,
  maxCombo: 0,

  // Lives (3 strikes: missed bombs or missed fruits)
  lives: 3,

  // Workout stats
  slices: 0,
  bigSwings: 0,
  duration: 0,      // seconds elapsed

  // Camera
  facingMode: 'user', // 'user' | 'environment'

  // Shake flag (for bomb hits)
  screenShake: false,
};

const useGameStore = create((set, get) => ({
  ...INITIAL_STATE,

  // --- Actions ---

  setPhase: (phase) => set({ phase }),

  setMode: (mode) => set({ mode }),

  setFacingMode: (facingMode) => set({ facingMode }),

  addScore: (points) =>
    set((s) => ({ score: s.score + points })),

  incrementCombo: () =>
    set((s) => {
      const combo = s.combo + 1;
      return { combo, maxCombo: Math.max(s.maxCombo, combo) };
    }),

  resetCombo: () => set({ combo: 0 }),

  addSlice: (isBigSwing = false) =>
    set((s) => ({
      slices: s.slices + 1,
      bigSwings: s.bigSwings + (isBigSwing ? 1 : 0),
    })),

  loseLife: () =>
    set((s) => {
      const lives = s.lives - 1;
      return { lives, screenShake: true, phase: lives <= 0 ? 'gameover' : s.phase };
    }),

  clearShake: () => set({ screenShake: false }),

  setDuration: (duration) => set({ duration }),

  resetGame: () => set({ ...INITIAL_STATE, phase: 'idle' }),

  startGame: () =>
    set({
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: 3,
      slices: 0,
      bigSwings: 0,
      duration: 0,
      screenShake: false,
      phase: 'countdown',
    }),
}));

export default useGameStore;
