// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-800 text-white">
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route path="/game" element={<GameScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
