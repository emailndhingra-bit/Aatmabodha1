
// Logic to generate personalized, empathetic, non-jargon insights.
// EXPANDED TO INCLUDE DESI TOTAKAS (REMEDIES) & MORE VARIATIONS

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Helper to get Desi Remedy based on Planet/House context
// uses varied prefixes as requested: Hack, Anecdote, Remedy, Wisdom
const getDesiTotaka = (planet: string, house: number, sign: string): string => {
    if (planet === 'Saturn') {
        if ([1, 2, 4, 7, 8, 12].includes(house)) return "🛠️ *Astro Hack:* Offer some mustard oil (Sarso ka tel) to the roots of a Peepal tree on Saturdays.";
        return "🧠 *Desi Wisdom:* Be honest with your employees or helpers; Shani loves justice.";
    }
    if (planet === 'Rahu') {
        return "💡 *Remedy:* Feed birds (pigeons or crows) with mixed grains to calm mental restlessness.";
    }
    if (planet === 'Ketu') {
        return "🔮 *Ancient Tip:* Feed a street dog occasionally. It helps clear confusion in life.";
    }
    if (planet === 'Mars') {
        if ([1, 4, 7, 8, 12].includes(house)) return "🛠️ *Astro Hack:* Offer sweet food (like Boondi) to small children on Tuesdays.";
        return "🧠 *Anecdote:* Avoid sleeping on the floor; keep your energy elevated.";
    }
    if (planet === 'Moon' && [6, 8, 12].includes(house)) {
        return "💡 *Remedy:* Keep a glass of water near your head while sleeping and pour it into a plant in the morning.";
    }
    if (planet === 'Sun' && ['Libra'].includes(sign)) {
        return "🛠️ *Astro Hack:* Offer water to the rising sun in a copper vessel. Add a pinch of sugar/roli.";
    }
    if (planet === 'Venus' && [6, 8].includes(house)) {
        return "🧠 *Desi Wisdom:* Keep yourself and your clothes perfumed/clean. Venus hates untidiness.";
    }
    if (planet === 'Mercury' && [12].includes(house)) {
        return "🔮 *Ancient Tip:* Clean your teeth with Alum (Fitkari) occasionally to improve speech impact.";
    }
    return "";
};

// Helper for Dasha Date Parsing
const parseDashaDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return null;
    if (parts[0].length === 4) return new Date(dateStr); 
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  } catch (e) {
    return null;
  }
};

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ELEMENTS = {
  "Fire": ["Aries", "Leo", "Sagittarius"],
  "Earth": ["Taurus", "Virgo", "Capricorn"],
  "Air": ["Gemini", "Libra", "Aquarius"],
  "Water": ["Cancer", "Scorpio", "Pisces"]
};

const PLANET_LORDS: Record<string, string> = {
  "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
  "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
  "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
};

export const generateAstroTidbits = (db: any): string[] => {
  // If DB is missing, return generic process steps (not chart based)
  if (!db) return ["Connecting with your chart's energy...", "Translating planetary positions...", "Decoding life timeline..."];

  const tidbits: Set<string> = new Set();

  try {
    // --- PRELOAD DATA (UPDATED FOR FLATTENED SCHEMA) ---
    // Columns: 0=Name, 1=Sign, 2=House, 3=Retro, 4=Nakshatra
    const planetsRes = db.exec("SELECT planet_name, D1_Rashi_sign, D1_Rashi_house, D1_Rashi_retro, D1_Rashi_nakshatra FROM planets");
    const planets: any[] = planetsRes.length > 0 ? planetsRes[0].values : [];
    
    const getP = (name: string) => planets.find((p: any) => p[0] === name);
    const ascendant = planets.find((p: any) => p[0] === 'Lagna' || p[0] === 'Ascendant');
    
    // --- 1. ASCENDANT LORD (The Driver) ---
    if (ascendant) {
      const ascSign = ascendant[1];
      const lordName = PLANET_LORDS[ascSign];
      const lordPlanet = getP(lordName);
      
      if (lordPlanet) {
        const h = lordPlanet[2];
        const remedy = getDesiTotaka(lordName, h, lordPlanet[1]);

        if (h === 1) tidbits.add(`🦁 **Self-Made:** Your chart ruler is in the 1st house. You rely on your own strength. ${remedy}`);
        if (h === 2) tidbits.add(`💰 **Voice & Value:** Your life path is tied to family resources and speech. ${remedy}`);
        if (h === 3) tidbits.add(`✍️ **Self-Effort:** You are a warrior. Nothing comes easy, but you snatch victory from defeat. ${remedy}`);
        if (h === 4) tidbits.add(`🏡 **Heart-Centered:** Your peace is linked to your home. You need a sanctuary. ${remedy}`);
        if (h === 5) tidbits.add(`🎨 **Creative Intelligence:** You approach life like a game of chess. Unique intelligence. ${remedy}`);
        if (h === 6) tidbits.add(`🛡️ **Problem Solver:** You find purpose in fixing what is broken or healing others. ${remedy}`);
        if (h === 7) tidbits.add(`🤝 **People Person:** You shine when connecting with others. You aren't meant to be alone. ${remedy}`);
        if (h === 8) tidbits.add(`🕵️ **Researcher:** You see secrets hidden from the naked eye. Deep intuition. ${remedy}`);
        if (h === 9) tidbits.add(`🎓 **Lucky Soul:** Faith and higher learning are your biggest assets. ${remedy}`);
        if (h === 10) tidbits.add(`👑 **Career Focus:** Your work is your identity. You are ambitious. ${remedy}`);
        if (h === 11) tidbits.add(`🌐 **Networker:** Gains come from social circles. You bring people together. ${remedy}`);
        if (h === 12) tidbits.add(`🧘 **Spiritual Seeker:** Solitude is not loneliness for you; it is freedom. ${remedy}`);
      }
    }

    // --- 2. ELEMENTAL BALANCE ---
    let fire = 0, earth = 0, air = 0, water = 0;
    planets.forEach((p: any) => {
      if (['Lagna','Rahu','Ketu','Uranus','Neptune','Pluto'].includes(p[0])) return;
      const s = p[1];
      if (ELEMENTS.Fire.includes(s)) fire++;
      if (ELEMENTS.Earth.includes(s)) earth++;
      if (ELEMENTS.Air.includes(s)) air++;
      if (ELEMENTS.Water.includes(s)) water++;
    });

    if (fire >= 3) tidbits.add("🔥 **Fire Dominance:** You act on impulse. Patience is a skill you need to learn manually.");
    if (earth >= 3) tidbits.add("🌍 **Earth Dominance:** Practical and reliable. You build life brick by brick.");
    if (air >= 3) tidbits.add("💨 **Air Dominance:** You live in ideas. Communication is your oxygen.");
    if (water >= 3) tidbits.add("🌊 **Water Dominance:** You navigate via feelings. Your intuition is your GPS.");
    
    // Missing Element Logic (Unique Insight)
    if (fire === 0) tidbits.add("❄️ **Missing Fire:** You may struggle to start things. Push yourself to take action without overthinking.");
    if (water === 0) tidbits.add("🌵 **Missing Water:** You might ignore emotions. Try to connect with how you 'feel', not just what you 'think'.");

    // --- 3. MOON MINDSET ---
    const moon = getP("Moon");
    if (moon) {
      const s = moon[1];
      const h = moon[2];
      const rem = getDesiTotaka("Moon", h, s);
      
      if (ELEMENTS.Fire.includes(s)) tidbits.add(`🦁 **Emotional Style:** You react passionately but forgive easily. ${rem}`);
      if (ELEMENTS.Earth.includes(s)) tidbits.add(`⛰️ **Emotional Style:** You find safety in stability and dislike drama. ${rem}`);
      if (ELEMENTS.Air.includes(s)) tidbits.add(`🌬️ **Emotional Style:** You intellectualize feelings. You need to understand 'why'. ${rem}`);
      if (ELEMENTS.Water.includes(s)) tidbits.add(`💧 **Emotional Style:** You absorb the room's vibes instantly. Protect your energy. ${rem}`);
      
      if (h === 6 || h === 8 || h === 12) {
          tidbits.add(`🧘 **Private Heart:** You guard your vulnerability like a treasure. ${rem}`);
      }
    }

    // --- 4. SATURN (The Taskmaster) ---
    const saturn = getP("Saturn");
    if (saturn) {
       const h = saturn[2];
       const rem = getDesiTotaka("Saturn", h, saturn[1]);

       if (h === 1) tidbits.add(`⚖️ **Discipline:** You matured earlier than your peers. Responsibility is natural to you. ${rem}`);
       if (h === 2) tidbits.add(`💰 **Savings:** You might have struggled with money early on, but you will build lasting wealth later. ${rem}`);
       if (h === 4) tidbits.add(`🏠 **Roots:** Home environment was strict or heavy, but you are building a solid foundation now. ${rem}`);
       if (h === 6) tidbits.add(`🛠️ **Service:** You can endure long hours and tedious tasks that others quit. ${rem}`);
       if (h === 7) tidbits.add(`💍 **Partnership:** You prefer commitment over casual flings. Relationship success comes with patience. ${rem}`);
       if (h === 8) tidbits.add(`⏳ **Longevity:** You have the endurance to survive major transformations. ${rem}`);
       if (h === 10) tidbits.add(`🏔️ **Career:** Success is a climb, not an elevator. But your position will be permanent. ${rem}`);
       if (h === 12) tidbits.add(`🌌 **Isolation:** You work best in solitude. Your best ideas come when you are alone. ${rem}`);
       if (saturn[3] === 1) tidbits.add(`🔙 **Retrograde Saturn:** You are your own harshest critic. Give yourself some grace. ${rem}`);
    }

    // --- 5. RAHU/KETU (Karmic Axis) ---
    const rahu = getP("Rahu");
    const ketu = getP("Ketu");
    if (rahu && ketu) {
       const axis = Math.min(rahu[2], ketu[2]); 
       const remRahu = getDesiTotaka("Rahu", rahu[2], rahu[1]);
       
       if (axis === 1) tidbits.add(`🎭 **Life Theme:** Independence vs. Relationships. You are learning to stand alone. ${remRahu}`);
       if (axis === 2) tidbits.add(`💰 **Life Theme:** Security vs. Transformation. Money fluctuates, but you survive every crash. ${remRahu}`);
       if (axis === 3) tidbits.add(`📣 **Life Theme:** Courage vs. Wisdom. Trust your own communication skills. ${remRahu}`);
       if (axis === 4) tidbits.add(`🏡 **Life Theme:** Home vs. Career. You struggle to balance private peace and public ambition. ${remRahu}`);
       if (axis === 5) tidbits.add(`🎨 **Life Theme:** Creativity vs. Gains. Create something unique, don't just chase profit. ${remRahu}`);
       if (axis === 6) tidbits.add(`⚔️ **Life Theme:** Routine vs. Escape. Find spirituality in your daily work. ${remRahu}`);
    }

    // --- 6. SUN (Soul) ---
    const sun = getP("Sun");
    if (sun) {
        const rem = getDesiTotaka("Sun", sun[2], sun[1]);
        if (sun[2] === 10) tidbits.add(`🦁 **Digbala:** You are a natural born leader. Authority suits you. ${rem}`);
        if (sun[2] === 1) tidbits.add(`☀️ **Vitality:** People notice when you walk into a room. Strong presence. ${rem}`);
        if (sun[2] === 12) tidbits.add(`🕯️ **Hidden Light:** You do your best work behind the scenes or in foreign lands. ${rem}`);
        if (sun[1] === 'Libra') tidbits.add(`⚖️ **Sun in Libra:** You often compromise too much. Learn to say 'No'. ${rem}`);
    }

    // --- 7. MARS (Action) ---
    const mars = getP("Mars");
    if (mars) {
        const rem = getDesiTotaka("Mars", mars[2], mars[1]);
        if (mars[2] === 10) tidbits.add(`🏗️ **Kuldeepak:** You will bring fame to your lineage through your work. ${rem}`);
        if (mars[2] === 3) tidbits.add(`💪 **Self-Made:** Immense courage. You are not afraid of competition. ${rem}`);
        if (mars[2] === 12) tidbits.add(`🛌 **Restless:** Your energy remains active even at night. Exercise helps you sleep. ${rem}`);
        if (mars[1] === 'Cancer') tidbits.add(`♋ **Mars in Cancer:** You fight with emotion. Don't let feelings cloud your strategy. ${rem}`);
    }

    // --- 8. JUPITER (Wisdom) ---
    const jup = getP("Jupiter");
    if (jup) {
        if (jup[3] === 1) tidbits.add("🔄 **Retrograde Jupiter:** You have your own definition of morality, distinct from society's rules.");
        if (jup[2] === 1) tidbits.add("🐘 **Divine Protection:** Jupiter in 1st is like a shield. Luck often saves you at the last minute.");
    }

    // --- 9. CURRENT DASHA VIBES ---
    const dashaRes = db.exec("SELECT period_name, end_date FROM dashas WHERE system LIKE '%Vimshottari%'");
    if (dashaRes.length > 0 && dashaRes[0].values) {
        const now = new Date();
        const rows = dashaRes[0].values;
        const currentPeriod = rows.find((row: any[]) => {
            const endDate = parseDashaDate(row[1]);
            return endDate && endDate > now;
        });

        if (currentPeriod) {
            const [md, ad] = String(currentPeriod[0] || '').split('-').map((s:string) => s.trim());
            
            if (md === 'Rahu') tidbits.add("🎢 **Current Cycle (Rahu):** Smoke and mirrors. Ambition is high. 💡 *Remedy:* Keep your kitchen clean.");
            if (md === 'Jupiter') tidbits.add("🙌 **Current Cycle (Jupiter):** Expansion phase. If stuck, this cycle usually unsticks things.");
            if (md === 'Saturn') tidbits.add("⏳ **Current Cycle (Saturn):** Reality check. Shortcuts won't work, only hard work will. 🛠️ *Astro Hack:* Donate labour/service.");
            if (md === 'Mercury') tidbits.add("🤝 **Current Cycle (Mercury):** Time to learn, trade, and upgrade skills.");
            if (md === 'Ketu') tidbits.add("✂️ **Current Cycle (Ketu):** Detox phase. You might lose interest in material things. 🧠 *Anecdote:* Meditation is key.");
            if (md === 'Venus') tidbits.add("🌸 **Current Cycle (Venus):** Relationship and comfort focus. Enjoy the beauty.");
            if (md === 'Sun') tidbits.add("🔦 **Current Cycle (Sun):** Time to find your purpose and take charge.");
        }
    }

    // --- 10. RETROGRADE KARMA ---
    planets.forEach((p: any) => {
        if (p[3] === 1 && !['Rahu','Ketu'].includes(p[0])) { // Retrograde
            tidbits.add(`🔄 **Retrograde ${p[0]}:** You interpret ${p[0]}'s energy internally. You might rethink things related to this planet often.`);
        }
    });

  } catch (e) {
    console.error("Personalized Tidbit Error", e);
    tidbits.add("Analyzing planetary degrees...");
  }

  return shuffleArray(Array.from(tidbits));
};
