import { GoogleGenAI } from "@google/genai";

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: { systemInstruction: "You are a helpful assistant." },
        history: [
            { role: 'user', parts: [{ text: "Hello" }] },
            { role: 'model', parts: [{ text: "Hi there!" }] }
        ]
    });

    try {
        const response = await chat.sendMessage({ 
            message: [
                { text: "What is this?" },
                { inlineData: { mimeType: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" } }
            ] 
        });
        console.log("Response:", response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
