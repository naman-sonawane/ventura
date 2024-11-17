const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json()); // Make sure we can parse JSON bodies

// Enable CORS for your frontend domain
app.use(cors({
  origin: 'https://ventura-webapp.vercel.app',  // Frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// This will store the hidden goal for the duration of the game
let hiddenGoal = '';

// Function to generate a goal dynamically
function generateHiddenGoal() {
  return new Promise(async (resolve, reject) => {
    try {
      const prompt = `
        You are the master of a text-based adventure game. Your task is to create a mysterious and exciting goal for the player. 
        The goal should be related to an adventure, mystery, or quest that the player must achieve throughout the game. 
        The goal must be hidden from the player and should be used to guide the challenges and events in the game.
        Provide the goal in a short sentence without revealing it to the player. Example goals might include: 
        "Find the lost treasure of the pirate king, Harold" "Rescue the captured princess, Tina," or "Defeat the evil sorcerer." 
        Generate a goal for the player.

        Respond with only the goal text and nothing else. Do not provide any explanation.
      `;
      
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }], 
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 50,
        },
      });

      const goalText = result.response.text().trim();
      resolve(goalText);  // Return the generated goal
    } catch (error) {
      reject('Error generating goal');
    }
  });
}

// POST Request to handle story generation
app.post('/', async (req, res) => {
  const { currentChoice, difficulty, gameHistory } = req.body;

  try {
    // If this is the first request (no game history), generate a goal
    if (gameHistory.length === 0) {
      hiddenGoal = await generateHiddenGoal();
    }

    // Prepare the context for the AI based on the game history
    let context = '';

    // Append game history to context if any
    if (gameHistory && gameHistory.length > 0) {
      gameHistory.forEach((historyItem, index) => {
        context += `\nChoice ${index + 1}: ${historyItem.choice} -> ${historyItem.response}`;
      });
    }

    // Define the prompt to send to the AI
    let prompt = '';

    if (gameHistory.length === 0) {
      // New game starts here, no history
      prompt = `
        You are a text adventure game master.
        The hidden goal is: "${hiddenGoal}",  and the player must achieve it. Do NOT directly inform the player of the goal immediately. 
        Adjust the plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex and dangerous.

        Format your response exactly as this example scene:
        Insert the description of the first scene in a text adventure game.||Option 1 here||Option 2 here||Option 3 here

        Create the first scene. (10-20 words) with 1, 2, or 3 options (depending on what feels right). Occasionally give the player items they can use later in game.
      `;
    } else {
      // Continue the game based on the context of previous choices
      prompt = `
        You are a text adventure game master. Based on the player's current choice: "${currentChoice}", generate a specific output in plot (10-20 words) with 1, 2, or 3 options (depending on what feels right). Occasionally give the player items they can use later in game.
        Adjust the plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex or dangerous.
        The player's hidden goal is: "${hiddenGoal}"

        Current context (game history): ${context}

        Format your response exactly as this example scene:
        Insert the description of the first scene in a text adventure game.||Option 1 here||Option 2 here||Option 3 here

        Do NOT repeat or rephrase options that have already been used.
        Do NOT give boring options that include any of the following words: sleep, rest, hide, run away, return, remain silent, etc.
        End the game IMMEDIATELY if the player had made a bad decision (like encountering an animal, touching fire, trusting a shady person) with 0 choices and 1 dramatic ending sentence.
      `;
    }

    console.log('Game History Context:', context);

    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate content based on the prompt
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }], 
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const response = result.response;

    // Return the generated response
    res.json({ response: response.text() });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
