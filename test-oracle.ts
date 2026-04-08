import { createChatSession } from "./services/geminiService";

async function run() {
  const db = null;
  const chat = await createChatSession(db, "English", "EN");
  try {
    const response = await chat.sendMessage({ message: [{ text: "Hello" }] });
    console.log("Response:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
