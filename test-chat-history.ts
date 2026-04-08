import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: { systemInstruction: "Be brief." },
        history: [
            { role: 'user', parts: [{ text: "SYSTEM_CONTEXT_INJECTION:\nHello" }] },
            { role: 'model', parts: [{ text: "Hi there!" }] }
        ]
    });
    const messagePayload = [{ text: "How are you?" }];
    const response = await chat.sendMessage({ message: messagePayload });
    console.log("Chat success:", response.text);
  } catch (e) {
    console.error("Chat error:", e.message);
  }
}
run();
