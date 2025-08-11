// backend/server.js

// Make sure dotenv is configured correctly at the top
require('dotenv').config({
    path: require('path').resolve(__dirname, '.env'),
    override: true    // <— this makes dotenv overwrite any existing vars
  });
  


const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Using node-fetch v2

const app = express();
const port = process.env.PORT || 3000; // Use port from .env or default to 3000

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Fact-Checking Backend is Running!');
});

app.post('/api/fact-check', async (req, res) => {
    const { transcript, roomName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('Gemini API key is not configured on the server. Check .env and restart.');
        return res.status(500).json({ error: 'Fact-checking service error (config).' });
    }
    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
        return res.status(400).json({ error: 'Invalid transcript provided.' });
    }
    const currentRoomName = roomName || "General Discussion";

    // --- Prepare Gemini Request ---
    // --- Updated Model Name ---
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`; // <-- CHANGED MODEL
    // ---

    const prompt = `
        You are a precise fact-checking assistant for a live debate.
        Debate Topic: "${currentRoomName}"
        Statement: "${transcript}"

        Analyze if the core assertion in the statement is presented as a verifiable fact and assess its likely accuracy based on general knowledge, or state if it's clearly an opinion/speculation.

        Respond ONLY with a JSON object with two keys:
        1. "is_fact": boolean (true ONLY if it's a verifiable factual claim likely to be accurate; false if it's opinion, speculation, subjective, inaccurate, or unverifiable).
        2. "reason": string (brief justification, e.g., "Verifiable statistic.", "Common knowledge.", "Opinion statement.", "Claim is inaccurate [brief reason].", "Requires specific context to verify.", "Subjective claim.").

        JSON:`;

     const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 100,
          responseMimeType: "application/json",
        },
         safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    // --- Call Gemini API ---
    try {
        console.log(`Backend: Fact-checking for room "${currentRoomName}" using model gemini-1.5-flash-latest: "${transcript.substring(0,50)}..."`); // Log model name
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const responseData = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error(`Gemini API Error (${geminiResponse.status}):`, JSON.stringify(responseData));
            const errorDetail = responseData?.error?.message || `HTTP ${geminiResponse.status} ${geminiResponse.statusText}`;
            // Check if it's a model availability error again
            if (errorDetail.includes("not found for API version") || errorDetail.includes("not supported for generateContent")) {
                 throw new Error(`Gemini API request failed: Model specified in the backend (e.g., gemini-1.5-flash-latest) might be unavailable or incorrect. Check Google AI documentation for current models. Error: ${errorDetail}`);
            }
            // Check for API key errors specifically
            if (errorDetail.includes("API key") && (errorDetail.includes("expired") || errorDetail.includes("invalid") || errorDetail.includes("not valid"))) {
                 throw new Error(`Gemini API request failed: Invalid or expired API key used by backend. Please check the key in the .env file and restart the server.`);
            }
            throw new Error(`Gemini API request failed: ${errorDetail}`);
        }

        // Check response structure (same as before)
        if (!responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
             console.warn("Backend: Unexpected Gemini response structure:", JSON.stringify(responseData));
             if (responseData.candidates?.[0]?.finishReason === 'SAFETY') {
                 console.log("Backend: Content blocked by safety filter.");
                 return res.json({ isFact: null, reason: "Content deemed unsafe by AI." });
             }
             throw new Error("Invalid Gemini response structure received.");
         }

        // Parse JSON from text (same as before)
        const jsonResponseText = responseData.candidates[0].content.parts[0].text;
        try {
            const result = JSON.parse(jsonResponseText);
             if (typeof result.is_fact !== 'boolean' || typeof result.reason !== 'string') {
                console.warn("Backend: Parsed Gemini JSON from text has unexpected format:", result);
                return res.json({ isFact: null, reason: "Fact-check response format error." });
             }
             console.log("Backend: Fact-check successful:", result);
             return res.json({ isFact: result.is_fact, reason: result.reason.trim() || "No reason provided." });
        } catch (parseError) {
            console.error("Backend: Failed to parse Gemini JSON from text:", parseError, "Raw Text:", jsonResponseText);
             throw new Error("Could not parse fact-check result JSON from Gemini.");
        }

    } catch (error) {
        console.error('Backend: Error during fact-checking process:', error);
        res.status(500).json({ error: `Fact-checking failed: ${error.message}` });
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Fact-checking backend server listening on http://localhost:${port}`);
});