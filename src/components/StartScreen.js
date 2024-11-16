import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IoMoon, IoSunny } from 'react-icons/io5';  // Moon and Sun icons

const StartScreen = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('easy');
  const [dark, setDark] = useState(true); // Default to dark mode

  useEffect(() => {
    // Load dark mode preference from localStorage (if available)
    const storedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = storedDarkMode ? storedDarkMode === 'true' : true; // Default to true (dark mode)
    
    setDark(isDarkMode);
    
    // Apply the dark mode class based on the preference
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Sync localStorage on mount in case it wasn't set before
    if (storedDarkMode === null) {
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }, []);

  const darkModeHandler = () => {
    const newDarkMode = !dark;
    setDark(newDarkMode);
    document.body.classList.toggle('dark', newDarkMode);  // Apply/remove dark mode class
    localStorage.setItem('darkMode', newDarkMode.toString());  // Store updated preference
  };

  const handleStartGame = () => {
    localStorage.clear();  // Clear all stored values in localStorage
    localStorage.setItem('gameDifficulty', difficulty);  // Store selected difficulty
    navigate('/game');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen dark:bg-zinc-800 bg-zinc-100">
      <div className="text-6xl font-bold mb-8 dark:text-white text-zinc-800">
        <h1>VENTURA</h1>
      </div>
  
      <div className="mb-6">
        <label className="mr-4 dark:text-white text-zinc-800 text-xl mb-2">Choose Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-2 dark:bg-zinc-700 bg-zinc-300 dark:text-white text-zinc-800 rounded"
        >
          <option value="easy">easy.</option>
          <option value="hard">hard.</option>
        </select>
      </div>
  
      <button
        onClick={handleStartGame}
        className="px-8 py-3 text-xl dark:bg-white bg-zinc-700 dark:text-zinc-800 text-white rounded dark:hover:bg-gray-200 hover:bg-zinc-600 transition-colors"
      >
        Begin
      </button>
  
      {/* Dark Mode Toggle Button */}
      <button
        onClick={darkModeHandler}
        className="absolute top-4 right-4 p-2 dark:bg-zinc-700 bg-zinc-300 dark:text-white text-zinc-800 rounded-full dark:hover:bg-zinc-600 hover:bg-zinc-500 transition-colors"
      >
        {dark ? <IoSunny size={24} /> : <IoMoon size={24} />}
      </button>
  
      <div className="absolute bottom-0 left-0 p-4 dark:text-white text-zinc-800">
        <p className="font-bold">VENTURA</p>
        <p className="text-sm">
          made by{' '}
          <a
            href="https://www.namansonawane.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="dark:text-white text-zinc-800 hover:text-blue-300 transition-colors"
          >
            naman sonawane
          </a>
        </p>
      </div>
    </div>
  );
};

export default StartScreen;
