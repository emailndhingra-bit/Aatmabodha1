import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
    });
    const messagePayload = [
      { text: "What is this?" },
      { inlineData: { data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", mimeType: "image/png" } }
    ];
    const response = await chat.sendMessage({ message: messagePayload });
    console.log("Chat success:", response.text);
  } catch (e) {
    console.error("Chat error:", e.message);
  }
}
run();
