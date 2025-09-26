// src/controllers/lcaController.js

import getGeminiResponse from '../services/geminiService.js';

/**
 * Helper function to clean Gemini response by removing markdown code block syntax
 * @param {string} response - Raw response from Gemini
 * @returns {string} Cleaned response
 */
function cleanGeminiResponse(response) {
    // Remove markdown code block syntax if present
    return response.replace(/```(json|javascript)?\n?/g, '').trim();
}

/**
 * Handles the request to get AI suggestions for missing LCA parameters.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function suggestParameters(req, res) {
    try {
        const partialData = req.body.formData;
        if (!partialData || typeof partialData !== 'object') {
            return res.status(400).json({ success: false, message: "Invalid formData provided." });
        }
        
        console.log("Controller: Received partial data for suggestions:", partialData);

        const prompt = `
            You are an expert Life Cycle Assessment (LCA) analyst for the mining and metallurgy industry.
            A user is providing partial data for a metallurgical process. Your task is to suggest realistic values for common MISSING parameters.
            The partial data provided is:
            ${JSON.stringify(partialData, null, 2)}

            Possible missing parameters to suggest for include: 'energy_consumption_kwh', 'water_usage_liters', 'transport_distance_km', 'waste_generated_kg', 'recycled_content_percentage', 'ore_grade_percentage', 'processing_yield_percentage'.

            Return your suggestions ONLY as a valid JSON object. The keys must be the parameter names and the values must be the suggested inputs. Do not add any text, explanation, or markdown formatting outside the JSON object.
            If all relevant parameters are already present, return an empty JSON object: {}.

            Example Response: {"water_usage_liters": 50000, "transport_distance_km": 150}
        `;

        const geminiResponseText = await getGeminiResponse(prompt);
        console.log("Controller: Gemini raw suggestion response:", geminiResponseText);

        let suggestions;
        try {
            // Clean the response before parsing
            const cleanedResponse = cleanGeminiResponse(geminiResponseText);
            suggestions = JSON.parse(cleanedResponse);
            if (typeof suggestions !== 'object' || Array.isArray(suggestions)) {
                throw new Error("Gemini did not return a valid JSON object for suggestions.");
            }
        } catch (parseError) {
            console.error("Controller: Failed to parse Gemini's suggestions JSON:", parseError.message);
            console.error("Controller: Gemini's unparseable response was:", geminiResponseText);
            return res.status(500).json({ success: false, message: "AI response format error for suggestions." });
        }
        
        res.json({ success: true, suggestions });

    } catch (error) {
        console.error("Controller: Error in suggestParameters:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Handles the request to generate final AI recommendations for a completed LCA.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function generateRecommendations(req, res) {
    try {
        const fullData = req.body.formData;
        if (!fullData || typeof fullData !== 'object' || Object.keys(fullData).length === 0) {
            return res.status(400).json({ success: false, message: "Complete formData is required for recommendations." });
        }

        console.log("Controller: Received full data for recommendations:", fullData);

        const prompt = `
            You are an expert Life Cycle Assessment (LCA) analyst specializing in the mining and metallurgy industry.
            Analyze the following complete dataset for a specific metallurgical process:
            ${JSON.stringify(fullData, null, 2)}

            Provide a concise summary of the process's current environmental impact and a list of specific, actionable recommendations to significantly improve its sustainability and reduce its environmental footprint. Focus on practical improvements related to energy efficiency, material sourcing (especially recycled content), waste reduction, and logistics.

            Return your response as a single, valid JSON object with the following keys:
            1. "lca_summary": A brief, one-paragraph summary of the process's environmental impact.
            2. "recommendations": An array of strings, where each string is a clear, actionable recommendation.
            
            Do not add any introductory text, concluding remarks, or any other text outside of this JSON structure.
            Example of desired output:
            {
              "lca_summary": "The current copper smelting process shows high energy consumption leading to significant CO2 emissions. Water usage is also a concern, though waste generation is moderate.",
              "recommendations": [
                "Integrate renewable energy sources for smelting, targeting a 30% reduction in electricity grid dependence.",
                "Increase the recycled copper scrap input from 20% to 45% to lower virgin material extraction impacts.",
                "Optimize haulage routes from mine to plant to reduce fuel consumption by 15% through route planning software."
              ]
            }
        `;

        const geminiResponseText = await getGeminiResponse(prompt);
        console.log("Controller: Gemini raw recommendation response:", geminiResponseText);
        
        let finalReport;
        try {
            // Clean the response before parsing
            const cleanedResponse = cleanGeminiResponse(geminiResponseText);
            finalReport = JSON.parse(cleanedResponse);
            if (typeof finalReport !== 'object' || !finalReport.lca_summary || !Array.isArray(finalReport.recommendations)) {
                throw new Error("Gemini did not return a valid JSON object with 'lca_summary' and 'recommendations' for the final report.");
            }
        } catch (parseError) {
            console.error("Controller: Failed to parse Gemini's recommendations JSON:", parseError.message);
            console.error("Controller: Gemini's unparseable response was:", geminiResponseText);
            return res.status(500).json({ success: false, message: "AI response format error for recommendations." });
        }
        
        res.json({ success: true, report: finalReport });

    } catch (error) {
        console.error("Controller: Error in generateRecommendations:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

export default {
    suggestParameters,
    generateRecommendations
};