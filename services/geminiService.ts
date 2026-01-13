
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SYSTEM_PROMPT } from "../constants";

export async function analyzeTranscript(transcriptContent: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: `Transcript to analyze:\n\n${transcriptContent}` }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2, // Lower temperature for more consistent analytical output
        topP: 0.8,
        topK: 40,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No analysis generated from the model.");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to analyze transcript.");
  }
}
