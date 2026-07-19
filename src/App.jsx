import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import GamePage from './pages/GamePage.jsx';
import StatsPage from './pages/StatsPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="relative w-full h-full min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>

        {/* Global Watermark */}
        <div className="fixed bottom-3 left-0 w-full text-center pointer-events-none z-50">
          <span className="bg-black/30 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full shadow-sm tracking-wide">
            Made with ❤️ by sahil maurya
          </span>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
