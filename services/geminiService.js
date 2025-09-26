
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in your .env file.");
    process.exit(1); // Exit if API key is missing
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Sends a prompt to the Gemini AI model and returns the text response.
 * @param {string} prompt The prompt string to send to Gemini.
 * @returns {Promise<string>} The raw text response from Gemini.
 */
async function getGeminiResponse(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from AI. Please try again later.");
    }
}

export default    getGeminiResponse;