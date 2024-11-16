const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

// Enable CORS for your frontend domain (replace with your actual frontend URL)
app.use(cors({
  origin: 'https://ventura-webapp.vercel.app',  // Frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Initialize Gemini client (Google Generative AI)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Memory to store session-specific context for each game session
const sessions = {};

// POST request to handle story generation
app.post('/', async (req, res) => {
  const { currentChoice, difficulty, choiceCount, sessionId } = req.body;

  try {
    // Initialize a new session if not already created
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        mission: "Find the lost husband of the old lady",  // Starting mission
        choiceCount: 0,
        context: '', // Placeholder for any additional context (story, clues, etc.)
      };
    }

    const session = sessions[sessionId];
    session.choiceCount = choiceCount;

    // Default start scene if no history exists (first time playing)
    const startScene = {
      choice: 'start',
      response: 'You are standing in a dark forest. The only light comes from the moon, which is high in the sky. You can see a path leading north, and a path leading east.',
    };

    // Get the model (Google Generative AI model)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create the context for the AI, including the mission and any progress so far
    const context = `Mission: ${session.mission}. So far, you've made ${choiceCount} choices. Current story context: ${session.context}.`;

    // Adjust the prompt based on difficulty and choice count
    const prompt = `
      You are a text adventure game master. Based on the player's choice: "${currentChoice}", generate the next scene (10-30 words) with 1-3 meaningful options.

      Adjust plot complexity based on difficulty: "${difficulty}". If "Easy", keep the plot simple. If "Hard", make it more complex or dangerous.

      If the player makes a fatal decision (e.g., poking a snake, touching fire, trusting a shady person), end the game immediately with how they lost and no options.
      If the player makes a positive decision or reaches a good outcome (e.g., discovering treasure/artifact/place, winning trust), end the game with a satisfying win message with no options.
      Do not repeat previous scenes or choices. Ensure the story progresses with new challenges, characters, or locations. Do not recycle options.

      Choices made: ${choiceCount}. Current context: ${session.context}.

      Format your response as:  
      "You walk down the path, the trees parting to reveal a small clearing. A large stone is at the center. You hear faint footsteps approaching from behind." || Look around the stone || Wait and see who is approaching || Continue down the path

      Ensure choices the scenes do not repeat and progress story.
    `;

    // Generate content using the Google Generative AI model
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }], 
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const response = result.response;

    // Update the session's context for the next prompt
    session.context = response.text();

    // Send the generated response to the frontend
    res.json({ response: response.text() });

  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

// GET request for testing if the server is running
app.get('/', (req, res) => {
  res.json({ message: 'Server is running! Send a POST request to the root to generate a story.' });
});

// Set the port for the server to listen on
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
