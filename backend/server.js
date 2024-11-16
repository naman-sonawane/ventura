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

// POST Request to handle story generation
app.post('/', async (req, res) => {
  const { currentChoice, difficulty, gameHistory } = req.body;

  try {
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
        Adjust the plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex and dangerous.

        The player has not made any choices yet. They are about to start their journey.

        Format your response exactly as this example scene:
        Insert the description of the first scene in a text adventure game.||Option 1 here||Option 2 here||Option 3 here
      `;
    } else {
      // Continue the game based on the context of previous choices
      prompt = `
        You are a text adventure game master. Based on the player's current choice: "${currentChoice}", generate the next scene (10-30 words) with 1, 2, or 3 (depending on what feels right) meaningful options. Occasionally give the player items for inventory.

        Adjust the plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex or dangerous.

        Format your response exactly as this example scene:
        Insert the description of the first scene in a text adventure game.||Option 1 here||Option 2 here||Option 3 here

        Current context (game history): ${context}

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
      contents: [{ role: 'user', parts: [{ text: prompt }] }], // Feed prompt as the user's input
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
