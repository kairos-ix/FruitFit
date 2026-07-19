import { useNavigate } from 'react-router-dom';
import StatsDashboard from '../components/StatsDashboard.jsx';

export default function StatsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative p-4"
         style={{ background: 'radial-gradient(circle at top, #1e1332 0%, #0a0a0a 100%)' }}>
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full transition z-10"
      >
        <span className="text-white text-xl">←</span>
      </button>
      
      <div className="pt-16">
        <StatsDashboard />
      </div>
    </div>
  );
}
