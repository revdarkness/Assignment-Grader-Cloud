
import { GoogleGenAI } from "@google/genai";

// Fix: Per Gemini guidelines, assume API_KEY is set in the environment and do not check for it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash';

export const enhanceFeedbackWithGemini = async (feedback: string, category: string, rubric: string | null, customInstructions: string | null): Promise<string> => {
    // Fix: Per Gemini guidelines, assume API_KEY is set and do not throw an error if it's not found.
    const rubricInstruction = rubric 
        ? `
        You MUST strictly follow the grading rubric provided below to guide your feedback.
        --- GRADING RUBRIC ---
        ${rubric}
        --- END RUBRIC ---
        `
        : '';

    const customInstructionBlock = customInstructions
        ? `
        You MUST also adhere to the following specific instructions from the teacher.
        --- CUSTOM INSTRUCTIONS ---
        ${customInstructions}
        --- END INSTRUCTIONS ---
        `
        : '';

    const prompt = `You are an expert and friendly teaching assistant. Your goal is to provide constructive and encouraging feedback to a student based on an auto-grader's output for a specific category.
    ${rubricInstruction}
    ${customInstructionBlock}
    Rephrase the following feedback for the **${category}** category to be more helpful, clear, and motivational.
    - Explain *why* something is wrong, if possible.
    - Suggest specific improvements or areas to review.
    - Maintain a positive and supportive tone.
    - Format your response using markdown for readability (e.g., use bullet points, bold text, and code blocks).

    Original feedback:
    "${feedback}"`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        const text = response.text;
        return text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to enhance feedback with AI. The API call failed.");
    }
};
