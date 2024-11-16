const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

// Enable CORS for your frontend domain
app.use(cors({
  origin: 'https://ventura-webapp.vercel.app',  // Frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST request to handle story generation
app.post('/', async (req, res) => {
  const { currentChoice, gameHistory, difficulty, choiceCount } = req.body;

  try {
    // Create the context for the AI, including previous history and mission info
    const prompt = `
    You are a text adventure game master. Choices so far made: ${choiceCount}. Previous scenes: ${gameHistory.map(item => item.response).join(' ')}, generate the next scene (10-30 words) with 1-3 meaningful options.

    Adjust plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex or dangerous.

    If the player makes a fatal decision (e.g., poking a snake, touching fire, trusting a shady person), end the game immediately with how they lost and no options.
    If the player makes a positive decision or reaches a good outcome (e.g., discovering treasure/artifact/place, winning trust), end the game with a satisfying win message with no options.
    Do not repeat previous scenes or choices. Ensure the story progresses with new challenges, characters, or locations. Do not recycle options.

    Choices made: ${choiceCount}.

    Format your response as:  
    "You walk down the path, the trees parting to reveal a small clearing. A large stone is at the center. You hear faint footsteps approaching from behind." || Look around the stone || Wait and see who is approaching || Continue down the path
    Ensure choices the scenes do not repeat and progress story.
  `;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate content using AI model
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const response = result.response;

    res.json({ response });

  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

// Set the port for the server to listen on
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
