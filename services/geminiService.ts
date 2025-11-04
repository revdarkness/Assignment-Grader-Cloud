
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

    const prompt = `You are an AI teaching assistant for a secondary school teacher. Your purpose is to help the teacher provide high-quality, pedagogically-sound feedback on written assignments.
Your tone should be encouraging, specific, and student-focused. Avoid generic praise. The goal is to empower students to improve their writing.
${rubricInstruction}
${customInstructionBlock}
Based on the initial auto-grader feedback for the **'${category}'** category, please generate enhanced feedback for the student.

**Feedback Framework (Follow this structure):**
1.  **Glow (Praise):** Start by identifying a specific strength in the student's work related to this category. Be precise. (e.g., "Your topic sentence in the third paragraph is particularly effective because it clearly introduces the main idea.")
2.  **Grow (Constructive Suggestion):** Gently guide the student toward an area for improvement. Frame it as a question or a "next step" to encourage critical thinking, rather than a direct command. (e.g., "How might you connect this evidence back to your main thesis more explicitly?" or "For your next draft, consider how you might combine these two shorter sentences for a more powerful impact.")
3.  **Actionable Tip (Optional but Recommended):** Provide a concrete, actionable piece of advice or a resource. (e.g., "Try reading this section aloud to catch awkward phrasing." or "Here's a great resource on writing compelling thesis statements.")

**Formatting:**
- Use markdown for clarity (bolding, bullet points).
- Keep paragraphs short and easy to read.
- Address the student directly in a supportive manner.

**Original Auto-Grader Feedback:**
"${feedback}"

Now, generate the enhanced, student-facing feedback based on all the instructions above.`;

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