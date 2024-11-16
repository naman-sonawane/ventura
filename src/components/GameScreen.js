import { useState, useEffect, useRef } from 'react';
import TextGenerateEffect from './TextGenerate';  // Import the TextGenerateEffect
import { IoMoon, IoSunny } from 'react-icons/io5';  // Moon and Sun icons

const GameScreen = () => {
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [choiceCount, setChoiceCount] = useState(0);
  const [dark, setDark] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);

  const hasGameStarted = useRef(false);  // Track if the game has started

  // Load saved difficulty from localStorage
  useEffect(() => {
    const storedDifficulty = localStorage.getItem('gameDifficulty') || 'easy';
    setDifficulty(storedDifficulty);
  }, []);

  // Load dark mode preference from localStorage
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

  // Load game history from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];
    setGameHistory(savedHistory);

    if (savedHistory.length === 0 && !hasGameStarted.current) {
      handleChoice('start');  // Start a new game if no history
      hasGameStarted.current = true;
    }
  }, []);

  // Save game history to localStorage
  useEffect(() => {
    if (gameHistory.length > 0) {
      localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    }
  }, [gameHistory]);

  const parseAIResponse = (response) => {
    if (typeof response === 'string') {
      const [description, ...choices] = response.split('||');
      return { description, choices };
    } else {
      console.error('Expected string response, but got:', response);
      return { description: 'Error: Unable to parse response.', choices: [] };
    }
  };
  

  const handleChoice = async (choice) => {
    setLoading(true);
    setChoiceCount((prevCount) => prevCount + 1);

    try {
      const response = await fetch('https://ventura-1.onrender.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentChoice: choice,
          gameHistory,  // Send the full game history to the server
          difficulty,
          choiceCount: choiceCount + 1,
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

  // Split text into chunks to avoid word breaks
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

  if (!currentScene) return <div>Loading...</div>;

  const descriptionChunks = splitTextIntoChunks(currentScene.description);

  return (
    <div className={`w-screen h-screen flex ${dark ? 'bg-zinc-800' : 'bg-white'} flex-col`}>
      <div className={`container mx-auto px-4 py-8 ${dark ? 'bg-zinc-800' : 'bg-white'} flex-1 max-w-2xl relative overflow-auto`}>
        <div className="space-y-6">
          {/* Display game history */}
          <div className="space-y-4">
            {gameHistory.map((item, index) => (
              <div key={index} className={`border-b ${dark ? 'border-white/20' : 'border-zinc-700'} pb-4`}>
                <p className={`${dark ? 'text-white/60' : 'text-zinc-800/60'}`}>{item.choice}</p>
                <p className={`${dark ? 'text-white' : 'text-zinc-800'}`}>{item.response}</p>
              </div>
            ))}
          </div>

          {/* Current Scene */}
          <div className={`${dark ? 'bg-zinc-700' : 'bg-gray-100'} p-6 rounded-lg`}>
            {descriptionChunks.map((chunk, index) => (
              <TextGenerateEffect key={index} text={chunk} duration={0.3} className="text-lg mb-4" />
            ))}

            {/* Only show choices if there are any left */}
            {currentScene.choices.length > 0 && (
              <div className="space-y-2">
                {currentScene.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    disabled={loading || choiceCount >= 12}
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

      {/* Footer */}
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

      {/* Dark Mode Toggle */}
      <button
        onClick={darkModeHandler}
        className={`absolute top-4 right-4 p-2 ${dark ? 'bg-zinc-700 text-white' : 'bg-zinc-300 text-zinc-800'} rounded-full hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-colors`}
      >
        {dark ? <IoSunny size={24} /> : <IoMoon size={24} />}
      </button>
    </div>
  );
};

export default GameScreen;
