const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create a memory object to store session-specific context for each game session
const sessions = {};

app.post('/api/generate-story', async (req, res) => {
  const { currentChoice, difficulty, choiceCount, sessionId } = req.body;

  try {
    // If this is a new session, initialize context for the player
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        mission: "Find the lost husband of the old lady", // Starting mission
        choiceCount: 0,
        context: '', // Placeholder for any additional context (story, clues, etc.)
      };
    }

    const session = sessions[sessionId];
    session.choiceCount = choiceCount;

    // Set a default start scene if no previous history exists (first time starting)
    const startScene = {
      choice: 'start',
      response: 'You are standing in a dark forest. The only light comes from the moon, which is high in the sky. You can see a path leading north, and a path leading east.',
    };

    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create the context for the AI, including the mission and any progress so far
    const context = `Mission: ${session.mission}. So far, you've made ${choiceCount} choices. Current story context: ${session.context}.`;

    // Adjust prompt based on difficulty and choice count
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


    // Generate content
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
