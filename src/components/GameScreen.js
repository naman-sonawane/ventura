import { useState, useEffect, useRef } from 'react';
import TextGenerateEffect from './TextGenerate';  // Import the TextGenerateEffect
import { IoMoon, IoSunny } from 'react-icons/io5';  // Moon and Sun icons

const GameScreen = () => {
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');  // Difficulty state
  const [choiceCount, setChoiceCount] = useState(0);  // Track the number of choices made
  const [dark, setDark] = useState(false);  // Track dark mode state
  const [gameHistory, setGameHistory] = useState([]);  // Track game history

  const hasGameStarted = useRef(false);  // Track if the game has started

  // Get difficulty from localStorage on game start
  useEffect(() => {
    const storedDifficulty = localStorage.getItem('gameDifficulty') || 'easy';
    setDifficulty(storedDifficulty);
  }, []);

  // Get dark mode preference from localStorage on initial load
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    setDark(storedDarkMode); // Set state based on stored preference

    // Apply dark mode class to the body
    if (storedDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);  // Empty dependency ensures this runs only once when the component mounts

  // Save dark mode setting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('darkMode', dark.toString());  // Store dark mode setting in localStorage
    if (dark) {
      document.body.classList.add('dark');  // Apply dark class if dark mode is enabled
    } else {
      document.body.classList.remove('dark'); // Remove dark class if light mode is enabled
    }
  }, [dark]);  // Dependency array includes `dark` to trigger whenever it changes

  // Function to handle AI response and parse choices
  const parseAIResponse = (response) => {
    const [description, ...choices] = response.split('||');
    return { description, choices };
  };

  // Function to handle player choice
  const handleChoice = async (choice) => {
    setLoading(true);
    setChoiceCount((prevCount) => prevCount + 1);  // Increment choice count

    try {
      const response = await fetch('https://ventura-1.onrender.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentChoice: choice,
          lastScene: gameHistory[gameHistory.length - 1] || null,  // Send the last scene for history
          difficulty: difficulty,  // Pass difficulty to the server
          choiceCount: choiceCount + 1,  // Pass the updated choice count
          sessionId: 'some-unique-session-id',  // Include session ID
        }),
      });

      const data = await response.json();

      // Check if the game is over and handle accordingly
      if (data.response.includes('Game Over')) {
        setGameHistory((prev) => [...prev, { choice, response: data.response }]);
        setCurrentScene({ description: data.response, choices: [] });  // No options for the final scene
        return;  // No further processing
      }

      const parsedResponse = parseAIResponse(data.response);
      setGameHistory((prev) => [...prev, { choice, response: parsedResponse.description }]);  // Add to history
      setCurrentScene(parsedResponse);  // Set new scene

    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  // Function to split text into chunks, avoiding word breaks
  const splitTextIntoChunks = (text, maxLength = 85) => {
    const chunks = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      let endIndex = currentIndex + maxLength;

      // If we are not at the end of the text and the word would be broken:
      if (endIndex < text.length && text[endIndex] !== ' ' && text.lastIndexOf(' ', endIndex) > currentIndex) {
        endIndex = text.lastIndexOf(' ', endIndex);  // Split at the last space
      }

      chunks.push(text.slice(currentIndex, endIndex));
      currentIndex = endIndex + 1;  // Move past the space
    }

    return chunks;
  };

  // Initial game start (only trigger the start once)
  useEffect(() => {
    if (!hasGameStarted.current) {  // Only trigger once
      handleChoice('start');
      hasGameStarted.current = true;  // Mark the game as started to prevent further triggering
    }
  }, []);  // Empty dependency array, ensures this runs only once on mount

  // Toggle dark mode handler
  const darkModeHandler = () => {
    setDark(!dark); // Toggle dark mode
  };

  if (!currentScene) return <div>Loading...</div>;

  const descriptionChunks = splitTextIntoChunks(currentScene.description);  // Split description into chunks

  return (
    <div className={`w-screen h-screen flex ${dark ? 'bg-zinc-800' : 'bg-white'} flex-col`}>
      <div className={`container mx-auto px-4 py-8 ${dark ? 'bg-zinc-800' : 'bg-white'} flex-1 max-w-2xl relative overflow-auto`}>
        <div className="space-y-6">
          {/* Game History */}
          <div className="space-y-4">
            {gameHistory.map((item, index) => (
              <div key={index} className={`border-b ${dark ? 'border-white/20' : 'border-zinc-700'} pb-4`}>
                <p className={`${dark ? 'text-white/60' : 'text-zinc-800/60'}`}>{item.choice}</p>
                <p className={`${dark ? 'text-white' : 'text-zinc-800'}`}>{item.response}</p>
              </div>
            ))}
          </div>

          {/* Current Scene with Text Animation */}
          <div className={`${dark ? 'bg-zinc-700' : 'bg-gray-100'} p-6 rounded-lg`}>
            {descriptionChunks.map((chunk, index) => (
              <TextGenerateEffect
                key={index}
                text={chunk}
                duration={0.3}
                className="text-lg mb-4"
              />
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

      {/* Dark Mode Toggle Button */}
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
