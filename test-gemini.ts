import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: "Hello",
    });
    console.log("2.5-flash success:", response.text);
  } catch (e) {
    console.error("2.5-flash error:", e.message);
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log("3-flash success:", response.text);
  } catch (e) {
    console.error("3-flash error:", e.message);
  }
}
run();
