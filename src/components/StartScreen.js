import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IoMoon, IoSunny } from 'react-icons/io5';  // Moon and Sun icons

const StartScreen = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('easy');
  const [dark, setDark] = useState(true); // Change this to true for dark mode by default

  useEffect(() => {
    // Load dark mode preference from localStorage
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDark(storedDarkMode);
    if (storedDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark'); // Ensure light mode is applied if not dark
    }
  }, []);

  const darkModeHandler = () => {
    setDark(!dark);
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', !dark);  // Store dark mode preference
  };

  const handleStartGame = () => {
    localStorage.clear();  // Clear all stored values in localStorage
    localStorage.setItem('gameDifficulty', difficulty);  // Store selected difficulty
    navigate('/game');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-800 dark:bg-zinc-100">
      <div className="text-6xl font-bold mb-8 text-white dark:text-zinc-800">
        <h1>VENTURA</h1>
      </div>
  
      <div className="mb-6">
        <label className="mr-4 text-white dark:text-zinc-800 text-xl mb-2">Choose Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-2 bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-800 rounded"
        >
          <option value="easy">easy.</option>
          <option value="hard">hard.</option>
        </select>
      </div>
  
      <button
        onClick={handleStartGame}
        className="px-8 py-3 text-xl bg-white dark:bg-zinc-700 text-zinc-800 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
      >
        Begin
      </button>
  
      {/* Dark Mode Toggle Button */}
      <button
        onClick={darkModeHandler}
        className="absolute top-4 right-4 p-2 bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-800 rounded-full hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-colors"
      >
        {dark ? <IoSunny size={24} /> : <IoMoon size={24} />}
      </button>
  
      <div className="absolute bottom-0 left-0 p-4 text-white dark:text-zinc-800">
        <p className="font-bold">VENTURA</p>
        <p className="text-sm">
          made by{' '}
          <a
            href="https://www.namansonawane.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white dark:text-zinc-800 hover:text-blue-300 transition-colors"
          >
            naman sonawane
          </a>
        </p>
      </div>
    </div>
  );
};

export default StartScreen;
