import { motion } from 'framer-motion';
import { getSessions, getLifetimeStats, clearSessions } from '../utils/storage.js';
import { getIntensityLabel } from '../utils/calories.js';
import { useState } from 'react';

export default function StatsDashboard() {
  const [sessions, setSessions] = useState(getSessions());
  const lifetime = getLifetimeStats();

  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete all workout history?')) {
      clearSessions();
      setSessions([]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-white">Workout History</h1>
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 text-sm font-semibold transition"
        >
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Workouts" value={lifetime.totalSessions} emoji="🗓️" />
        <StatCard label="Fruits Sliced" value={lifetime.totalSlices.toLocaleString()} emoji="🍉" />
        <StatCard label="Calories Burned" value={`~${lifetime.totalCalories}`} emoji="🔥" />
        <StatCard label="Best Score" value={lifetime.bestScore.toLocaleString()} emoji="🏆" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Recent Sessions</h2>
      
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
          <p className="text-white/40 mb-2">No workouts yet.</p>
          <p className="text-white/40">Time to start slicing!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={session.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <div className="flex-1 mb-3 md:mb-0">
                <div className="text-white font-bold text-lg mb-1">
                  {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex gap-3 text-xs font-semibold uppercase tracking-wider">
                  <span className="text-blue-300">
                    {session.mode === 'endless' ? 'Endless' : `${session.mode} min`}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className={session.slices / session.duration > 0.5 ? 'text-orange-400' : 'text-green-400'}>
                    {getIntensityLabel(session.slices, session.duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 md:gap-8">
                <div className="text-center">
                  <div className="text-white/50 text-xs uppercase font-bold mb-1">Score</div>
                  <div className="text-white font-black text-xl">{session.score?.toLocaleString() || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-white/50 text-xs uppercase font-bold mb-1">Combo</div>
                  <div className="text-white font-black text-xl">{session.maxCombo || 0}x</div>
                </div>
                <div className="text-center">
                  <div className="text-white/50 text-xs uppercase font-bold mb-1">Kcal</div>
                  <div className="text-orange-400 font-black text-xl">{session.calories || 0}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, emoji }) {
  return (
    <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-white/50 text-xs uppercase font-bold tracking-wider">{label}</div>
    </div>
  );
}
