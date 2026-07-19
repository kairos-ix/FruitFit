const STORAGE_KEY = 'fruitfit_sessions';

/**
 * Returns all stored sessions.
 * @returns {Array}
 */
export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Saves a new session to localStorage.
 * @param {Object} session
 */
export function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift({ ...session, id: Date.now(), date: new Date().toISOString() });
  // Keep last 100 sessions
  if (sessions.length > 100) sessions.length = 100;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Returns aggregated lifetime stats.
 */
export function getLifetimeStats() {
  const sessions = getSessions();
  return sessions.reduce(
    (acc, s) => ({
      totalSessions: acc.totalSessions + 1,
      totalSlices: acc.totalSlices + (s.slices || 0),
      totalCalories: acc.totalCalories + (s.calories || 0),
      totalPlayTime: acc.totalPlayTime + (s.duration || 0),
      bestScore: Math.max(acc.bestScore, s.score || 0),
      bestCombo: Math.max(acc.bestCombo, s.bestCombo || 0),
    }),
    { totalSessions: 0, totalSlices: 0, totalCalories: 0, totalPlayTime: 0, bestScore: 0, bestCombo: 0 }
  );
}

/**
 * Clears all sessions.
 */
export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
