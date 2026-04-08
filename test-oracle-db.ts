import { createChatSession } from "./services/geminiService";
import { initDatabase } from "./services/db";

// Mock window for Node.js environment
(global as any).window = {
  initSqlJs: async () => ({
    Database: class {
      run() {}
      exec() { return []; }
      prepare() { return { get: () => [], free: () => {}, run: () => {} }; }
    }
  })
};

async function run() {
  const dummyData = {
    summary: "Test",
    charts: [],
    dashas: [],
    shadbala: [],
    kpSystem: { cusps: [], planets: [] },
    ashtakvarga: {},
    bhinnaAshtakvarga: {},
    chalit: [],
    planetShifts: [],
    elementalBalance: {},
    ishtaDevata: "Test",
    bhriguBindu: "Test",
    willpowerScore: "Test",
    planetaryDetails: []
  };
  const db = await initDatabase(dummyData as any);
  const chat = await createChatSession(db, "English", "EN");
  try {
    const response = await chat.sendMessage({ message: [{ text: "Hello" }] });
    console.log("Response:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
