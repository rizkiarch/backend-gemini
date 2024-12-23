require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { checkDomain } = require('./whoisService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Enable CORS for the frontend origin
app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());


// Route to check domain
app.get('/whois/:domain', async (req, res) => {
    try {
        const result = await checkDomain(req.params.domain);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-pro',
            generationConfig: {
                candidateCount: 1,
                stopSequences: ['x'],
                maxOutputTokens: 100,
                temperature: 0.5,
            }
        });
        console.log('Model:', model);
        const { prompt } = req.body;

        const cvReviewPrompt = `
            Please review this CV/Resume and provide detailed feedback in the following areas:

            1. Overall Impact:
            - First impression
            - Clear communication of value proposition
            - Professional presentation

            2. Content Analysis:
            - Work experience clarity and impact
            - Skills representation
            - Educational background presentation
            - Achievements and measurable results

            3. Structure and Format:
            - Layout and organization
            - Use of space
            - Readability
            - Consistency

            4. Language and Tone:
            - Professional terminology
            - Action verbs usage
            - Grammar and spelling

            5. Specific Improvement Suggestions:
            - Key areas to enhance
            - Missing important elements
            - Formatting recommendations

            CV Content to Review:
            ${prompt}
            `;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({
            text: response.text()
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});