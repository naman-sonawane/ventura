import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import TextGenerateEffect from './TextGenerate';  // Import the TextGenerateEffect
import { IoMoon, IoSunny } from 'react-icons/io5';  // Moon and Sun icons

const GameScreen = () => {
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [dark, setDark] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [isGameRestarted, setIsGameRestarted] = useState(false); // Track game restart

  const hasGameStarted = useRef(false);  // Track if the game has started

  useEffect(() => {
    const storedDifficulty = localStorage.getItem('gameDifficulty') || 'easy';
    setDifficulty(storedDifficulty);
  }, []);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = storedDarkMode ? storedDarkMode === 'true' : true;
    setDark(isDarkMode);

    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    if (storedDarkMode === null) {
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }, []);

  const darkModeHandler = () => {
    const newDarkMode = !dark;
    setDark(newDarkMode);
    document.body.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  useEffect(() => {
    if (!isGameRestarted) {
      const savedHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];
      setGameHistory(savedHistory);

      if (savedHistory.length === 0 && !hasGameStarted.current) {
        handleChoice('start');
        hasGameStarted.current = true;
      }
    }

    // Reset the isGameRestarted state after loading the history
    return () => {
      setIsGameRestarted(false);
    };
  }, [isGameRestarted]);

  useEffect(() => {
    if (gameHistory.length > 0) {
      localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    }
  }, [gameHistory]);

  const parseAIResponse = (response) => {
    if (typeof response === 'string') {
      const [description, ...choices] = response.trim().split('||');
      return { description, choices };
    } else {
      console.error('Expected string response, but got:', response);
      return { description: 'Error: Unable to parse response.', choices: [] };
    }
  };

  const handleChoice = async (choice) => {
    setLoading(true);

    try {
      const response = await fetch('https://ventura-1.onrender.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentChoice: choice,
          gameHistory: choice == 'start' ? [] : gameHistory, // Fix the key-value pair here
          difficulty,
        }),
      });
      

      const data = await response.json();
      const parsedResponse = parseAIResponse(data.response);
      setGameHistory((prev) => [...prev, { choice, response: parsedResponse.description }]);
      setCurrentScene(parsedResponse);

    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const splitTextIntoChunks = (text, maxLength = 85) => {
    const chunks = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      let endIndex = currentIndex + maxLength;
      if (endIndex < text.length && text[endIndex] !== ' ' && text.lastIndexOf(' ', endIndex) > currentIndex) {
        endIndex = text.lastIndexOf(' ', endIndex);
      }

      chunks.push(text.slice(currentIndex, endIndex));
      currentIndex = endIndex + 1;
    }

    return chunks;
  };

  const handleRestart = () => {
    localStorage.clear();  // Clear all stored values in localStorage
    localStorage.setItem('gameDifficulty', difficulty);  // Store selected difficulty
    navigate('/game');
    window.location.reload();  // Reload the page
    handleChoice('start')
  };

  if (!currentScene) return <div>Loading...</div>;

  const descriptionChunks = splitTextIntoChunks(currentScene.description);

  return (
    <div className={`w-screen h-screen flex ${dark ? 'bg-zinc-800' : 'bg-white'} flex-col`}>
      <div className={`container mx-auto px-4 py-8 ${dark ? 'bg-zinc-800' : 'bg-white'} flex-1 max-w-2xl relative overflow-auto`}>
        <div className="space-y-6">
          <div className="space-y-4">
            {gameHistory.map((item, index) => (
              <div key={index} className={`border-b ${dark ? 'border-white/20' : 'border-zinc-700'} pb-4`}>
                <p className={`${dark ? 'text-white/60' : 'text-zinc-800/60'}`}>{item.choice}</p>
                <p className={`${dark ? 'text-white' : 'text-zinc-800'}`}>{item.response}</p>
              </div>
            ))}
          </div>

          <div className={`${dark ? 'bg-zinc-700' : 'bg-gray-100'} p-6 rounded-lg`}>
            {descriptionChunks.map((chunk, index) => (
              <TextGenerateEffect key={index} text={chunk} duration={0.3} className="text-lg mb-4" />
            ))}

            {currentScene.choices.length > 0 && (
              <div className="space-y-2">
                {currentScene.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    disabled={loading}
                    className={`w-full p-3 ${dark ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300' : 'bg-zinc-600 text-white hover:bg-zinc-500'} rounded transition-colors disabled:opacity-50`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${dark ? 'text-white' : 'text-zinc-800'} p-4 mt-auto`}>
        <p className="font-bold">VENTURA</p>
        <p className="text-sm">
          made by{' '}
          <a
            href="https://www.namansonawane.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className={`${dark ? 'text-white' : 'text-zinc-800'} hover:text-blue-300 transition-colors`}
          >
            naman sonawane
          </a>
        </p>
      </div>

      <button
        onClick={darkModeHandler}
        className={`absolute top-4 right-4 p-2 ${dark ? 'bg-zinc-700 text-white' : 'bg-zinc-300 text-zinc-800'} rounded-full hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-colors`}
      >
        {dark ? <IoSunny size={24} /> : <IoMoon size={24} />}
      </button>

      <button
        onClick={handleRestart}
        className={`absolute bottom-4 right-4 p-3 ${dark ? 'bg-red-900 text-white' : 'bg-red-500 text-white'} rounded-lg shadow-lg hover:bg-red-700 transition-colors`}
      >
        Restart Game
      </button>
    </div>
  );
};

export default GameScreen;
