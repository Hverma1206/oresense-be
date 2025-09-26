// src/controllers/lcaController.js

import getGeminiResponse from '../services/geminiService.js';
import Report from '../models/Report.js';

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
 * Generates fallback response when parsing fails
 * @param {string} type - Type of response to generate
 * @param {object} data - Input data for context
 * @returns {object} Fallback response object
 */
function generateFallbackResponse(type, data = {}) {
    if (type === 'recommendations') {
        const metalType = data.metalType || 'metal';
        
        return {
            lca_summary: `This is a fallback analysis for ${metalType} production. Due to technical limitations, a detailed AI analysis couldn't be generated. The assessment shows areas where sustainability improvements could be made.`,
            recommendations: [
                "Review energy sources and consider renewable alternatives",
                "Implement water recycling systems in processing operations",
                "Consider increasing recycled material inputs",
                "Optimize transportation and logistics for efficiency",
                "Implement best practices for waste management and reduction"
            ]
        };
    }
    
    return { 
        message: "Fallback response generated due to processing error",
        timestamp: new Date().toISOString()
    };
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
            
            // Use hardcoded fallback suggestions for the most common parameters
            suggestions = {
                "energyConsumptionMining": 5000,
                "waterConsumptionMining": 2000,
                "oreGrade": 0.5,
                "recycledInputRate": 10,
                "recoveryRate": 85
            };
            
            console.log("Controller: Using fallback suggestions:", suggestions);
        }
        
        res.json({ success: true, suggestions });

    } catch (error) {
        console.error("Controller: Error in suggestParameters:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Could not generate parameter suggestions at this time.",
            error: error.message
        });
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
        if (!fullData || typeof fullData !== 'object') {
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
            
            // Use a fallback response when parsing fails
            finalReport = generateFallbackResponse('recommendations', fullData);
            console.log("Controller: Using fallback recommendations");
        }

        // Save the report to MongoDB
        try {
            const reportName = `LCA for ${fullData.metalType || 'Metal'}`;
            
            const savedReport = await Report.create({
                name: reportName,
                metalType: fullData.metalType || 'Unknown',
                formData: fullData,
                insights: finalReport,
                user: req.user ? req.user._id : null,  // Associate with user if authenticated
                status: 'completed'
            });
            
            console.log(`Report saved to database with ID: ${savedReport._id}`);
            
            // Return the report with the MongoDB ID included
            res.json({ 
                success: true, 
                report: finalReport,
                reportId: savedReport._id,
                reportName: reportName
            });
        } catch (dbError) {
            console.error("Failed to save report to database:", dbError);
            
            // Still return the AI results even if saving failed
            res.json({ 
                success: true, 
                report: finalReport,
                warning: "Report generated but not saved to database" 
            });
        }
    } catch (error) {
        console.error("Controller: Error in generateRecommendations:", error.message);
        
        // Even in case of complete failure, return something useful to the client
        const fallbackReport = generateFallbackResponse('recommendations', req.body.formData || {});
        
        res.json({ 
            success: true,
            report: fallbackReport,
            warning: "Generated using fallback data due to API connectivity issues"
        });
    }
}

/**
 * Retrieves all reports, with optional filtering by user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getReports(req, res) {
    try {
        let query = {};
        
        // If user is authenticated and userId is provided, filter by user
        if (req.query.userId) {
            query.user = req.query.userId;
        }
        
        // Allow filtering by metal type
        if (req.query.metalType) {
            query.metalType = req.query.metalType;
        }
        
        const reports = await Report.find(query)
            .sort({ createdAt: -1 })  // Sort by newest first
            .select('_id name metalType createdAt status formData.globalWarmingPotential');  // Select only necessary fields
            
        res.json({
            success: true,
            reports: reports
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to retrieve reports",
            error: error.message 
        });
    }
}

/**
 * Retrieves a single report by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getReportById(req, res) {
    try {
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: "Report not found" 
            });
        }
        
        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to retrieve report",
            error: error.message 
        });
    }
}

/**
 * Updates an existing report
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateReport(req, res) {
    try {
        const { name, status, formData } = req.body;
        
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: "Report not found" 
            });
        }
        
        // Update fields if provided
        if (name) report.name = name;
        if (status) report.status = status;
        if (formData) report.formData = formData;
        
        report.updatedAt = Date.now();
        
        await report.save();
        
        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update report",
            error: error.message 
        });
    }
}

/**
 * Deletes a report
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteReport(req, res) {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: "Report not found" 
            });
        }
        
        res.json({
            success: true,
            message: "Report deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting report:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete report",
            error: error.message 
        });
    }
}

export default {
    suggestParameters,
    generateRecommendations,
    getReports,
    getReportById,
    updateReport,
    deleteReport
};