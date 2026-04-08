
import { Gem } from "../types";

export type { Gem };

const REMEDY_TITLES = [
  "🛠️ Desi Jugaad", "🧠 Cosmic Hack", "👵 Nani Ka Nuskha", "🔮 Ancient Upaya", 
  "⚡ Power Switch", "🧘 Vedic Sutra", "💎 Ratna-free Remedy", "🥗 Satvik Tip",
  "💡 Quick Fix", "🚪 Karmic Key", "🔥 Agni Totaka", "🌊 Jal Upaya"
];

const getRandomRemedyTitle = () => REMEDY_TITLES[Math.floor(Math.random() * REMEDY_TITLES.length)];

// --- ASTROLOGICAL CONSTANTS ---

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const PLANET_LORDS: Record<string, string> = {
  "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
  "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
  "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
};

// --- HELPER FUNCTIONS ---

const getSignIndex = (signName: string) => SIGNS.indexOf(signName);

const getHouseLord = (houseNum: number, ascSign: string): string => {
    const ascIndex = getSignIndex(ascSign);
    const houseSignIndex = (ascIndex + (houseNum - 1)) % 12;
    const houseSign = SIGNS[houseSignIndex];
    return PLANET_LORDS[houseSign];
};

interface PlanetData {
    name: string;
    sign: string;
    house: number;
    degree: number;
    retro: boolean;
    nakshatra: string;
}

// --- GENERATION LOGIC ---
// Kept as fallback, but UI now prefers AI generation
export const generateHiddenGems = (db: any): { strengths: Gem[], weaknesses: Gem[] } => {
    const strengths: Gem[] = [];
    const weaknesses: Gem[] = [];

    if (!db) return { strengths, weaknesses };

    try {
        // UPDATED QUERY for flattened schema
        const pRes = db.exec("SELECT planet_name, D1_Rashi_sign, D1_Rashi_house, D1_Rashi_degree, D1_Rashi_retro, D1_Rashi_nakshatra FROM planets");
        if (pRes.length === 0) return { strengths, weaknesses };

        const rawRows = pRes[0].values;
        const planets: PlanetData[] = rawRows.map((r: any) => ({
            name: r[0],
            sign: r[1],
            house: r[2],
            degree: parseFloat(r[3]) || 0,
            retro: r[4] === 1,
            nakshatra: r[5]
        }));

        const lagna = planets.find(p => p.name === 'Lagna' || p.name === 'Ascendant');
        const ascSign = lagna ? lagna.sign : "Aries"; 
        const ascLordName = PLANET_LORDS[ascSign];
        const ascLord = planets.find(p => p.name === ascLordName);
        
        // Basic Logic Fallbacks if AI fails or for initial state
        if (ascLord) {
            const h = ascLord.house;
             if ([1, 4, 5, 7, 9, 10].includes(h)) {
                strengths.push({
                    id: 'lagna-strong', type: 'strength', title: 'Fortified Foundation', tag: 'Identity',
                    description: `Your Lagna Lord (${ascLordName}) is powerfully placed in the ${h}th house.`,
                    remedyTitle: getRandomRemedyTitle(), remedy: `Strengthen ${ascLordName} further.`
                });
            }
        }
    } catch (e) {
        console.error("Gem Logic Error", e);
    }

    return { strengths, weaknesses };
};
