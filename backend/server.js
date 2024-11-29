const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json()); // Make sure we can parse JSON bodies

// Enable CORS for your frontend domain
app.use(cors({
  origin: 'http://localhost:3000',  // Frontend URL after custom domain
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
        You are the master of a text-based adventure game. Your task is to create a **very specific** goal for the player that is tied to an adventure, mystery, or quest. The goal must be concrete and measurable, not something vague like "uncover the secret" or "explore the temple." The goal should require multiple steps to achieve and be achievable only by completing a series of meaningful challenges.

        Do not create goals that can be achieved too easily at the beginning of the game. The goal should be something the player must work towards, and it should not be easily completed after only a few actions.

        Example goals might include:
        - "Find the hidden gemstone in the temple to break the curse."
        - "Stop the evil sorcerer from completing the ritual before midnight."
        - "Retrieve the enchanted map from the temple's inner sanctum."

        **Your response should only be the goal itself. Do not explain it, and do not include any additional text.**
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
      console.error(error);
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

    if (gameHistory && gameHistory.length > 0) {
      gameHistory.forEach((historyItem, index) => {
        context += `\nChoice ${index + 1}: ${historyItem.choice} -> ${historyItem.response}`;
      });
    }

    let prompt = '';
    if (gameHistory.length === 0) {
      prompt = `
        You are the master of a text-based adventure game. The hidden goal is: "${hiddenGoal}", and the player must achieve it. Do NOT directly inform the player of the goal immediately. Adjust the plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex and dangerous.

        Format your response exactly as this example scene:
        Insert the description of the first scene in a text adventure game.||Option 1 here||Option 2 here||Option 3 here
      `;
    } else {
      prompt = `
        You are the master of a text-based adventure game. Based on the player's current choice: "${currentChoice}", generate a specific output in plot (10-20 words) with 1, 2, or 3 options (depending on what feels right). Occasionally give the player items they can use later in game. Adjust the plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex or dangerous.
        The player's hidden goal is: "${hiddenGoal}"

        Current context (game history): ${context}

        Format your response exactly as this example scene:
        Insert the description of the first scene in a text adventure game.||Option 1 here||Option 2 here||Option 3 here

        Do NOT repeat or rephrase options that have already been used.
        Do NOT give boring options that include any of the following words: sleep, rest, hide, run away, return, remain silent, etc.
        End the game IMMEDIATELY if the player had made a bad decision (like encountering an animal, touching fire, trusting a shady person) with 0 choices and 1 dramatic ending sentence.
        End the game IMMEDIATELY if the player accomplishes their goal and provide no options.
      `;
    }

    //console.log('Game History Context:', context);
    //console.log('Hidden Goal:', hiddenGoal);

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }], 
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const response = result.response.text().trim();

    if (!response) {
      throw new Error('Empty response from AI model');
    }

    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
