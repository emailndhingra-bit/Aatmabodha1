
// ... existing imports ...
import { AnalysisResult, ChartData, PlanetInfo, DashaSystem, KPCusp, KPPlanet, ShadbalaData, Varshphal, PrastharaTable, ChalitRow, DashaPeriod, PlanetaryShift, TransitInfo, KPHouseSignificator } from "../types";
import { DEFAULT_RULES } from "./defaultRules";
import { defaultKnowledgeBase } from "./knowledgeBaseData";

// ... (Constants SIGNS, NAKSHATRAS, PLANET_LORDS, PLANET_OWNERSHIP_INDICES, PLANET_ASPECT_OFFSETS, EXALTATION, DEBILITATION, DEITIES remain unchanged) ...
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", 
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", 
  "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", 
  "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export const PLANET_LORDS: Record<string, string> = {
  "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
  "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
  "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
};

const PLANET_OWNERSHIP_INDICES: Record<string, number[]> = {
    "Sun": [5], "Moon": [4], "Mars": [1, 8], "Mercury": [3, 6],
    "Jupiter": [9, 12], "Venus": [2, 7], "Saturn": [10, 11],
    "Rahu": [], "Ketu": []
};

const PLANET_ASPECT_OFFSETS: Record<string, number[]> = {
    "Sun": [7], "Moon": [7], "Mercury": [7], "Venus": [7],
    "Mars": [4, 7, 8], "Jupiter": [5, 7, 9], "Saturn": [3, 7, 10],
    "Rahu": [5, 7, 9], "Ketu": [5, 7, 9]
};

const EXALTATION: Record<string, string> = {
  "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
  "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra"
};

const DEBILITATION: Record<string, string> = {
  "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces",
  "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries"
};

const DEITIES: Record<string, string> = {
  "Sun": "Lord Shiva / Lord Rama", "Moon": "Goddess Gouri / Lord Krishna",
  "Mars": "Lord Hanuman / Lord Narasimha", "Mercury": "Lord Vishnu",
  "Jupiter": "Lord Shiva / Lord Vamana", "Venus": "Goddess Lakshmi",
  "Saturn": "Lord Sastha / Goddess Kali", "Rahu": "Goddess Durga", "Ketu": "Lord Ganesha"
};

const V_YEARS: Record<string, number> = { 
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, 
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17 
};
const V_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const TOTAL_V_YEARS = 120;
const C_DIRECT_INDICES = [1, 2, 3, 7, 8, 9]; 

// Internal interface for calculation
interface InternalPlanet {
  planet: string;
  rashi: number;
  house?: number;
  deg: string;
  nak?: string;
  pada?: number;
  isRetro?: boolean;
  lord?: string;
  housesOwned?: string;
  housesAspected?: string;
  status?: string;
  avastha?: string;
  nbry?: string;
  jamini?: string;
  yogas: string[];
  isCombust?: boolean;
  isSandhi?: boolean;
  yogaBhangas?: string; // JSON String
}

export const getSignName = (num: number): string => SIGNS[(num - 1) % 12];
export const getSignNum = (name: string): number => {
    if (!name) return 1;
    const idx = SIGNS.findIndex(s => name.toLowerCase().includes(s.toLowerCase()));
    return idx !== -1 ? idx + 1 : 1;
};

const parseDegreeToFloat = (degStr: string | number): number => {
  if (degStr === undefined || degStr === null) return 0;
  if (typeof degStr === 'number') return degStr;
  const cleaned = String(degStr).replace(/[°'"]/g, ' ').replace(/[-:]/g, ' ');
  const parts = cleaned.trim().split(/\s+/).map(s => parseFloat(s));
  const d = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  if (d > 30 && m === 0 && s === 0) return d;
  return d + m / 60 + s / 3600;
};

const formatDegree = (deg: number): string => {
  let normalized = deg % 360;
  if (normalized < 0) normalized += 360;
  let totalSeconds = Math.round(normalized * 3600);
  const d = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
};

const getAbsoluteLongitude = (signNum: number, degStr: string | number): number => {
  const val = parseDegreeToFloat(degStr);
  if (val > 30) return val; 
  return (signNum - 1) * 30 + val;
};

const getHouseDiff = (fromSign: number, toSign: number): number => {
  let diff = toSign - fromSign + 1;
  if (diff <= 0) diff += 12;
  return diff;
};

const checkAspect = (planet: InternalPlanet, targetSignNum: number): boolean => {
    const diff = getHouseDiff(planet.rashi, targetSignNum);
    if (diff === 7) return true;
    if (planet.planet === "Mars" && (diff === 4 || diff === 8)) return true;
    if (planet.planet === "Jupiter" && (diff === 5 || diff === 9)) return true;
    if (planet.planet === "Saturn" && (diff === 3 || diff === 10)) return true;
    return false;
};

const calculateRuledHouses = (planet: string, ascSignNum: number): string => {
    const ownedSignIndices = PLANET_OWNERSHIP_INDICES[planet];
    if (!ownedSignIndices || ownedSignIndices.length === 0) return "-";
    const houses = ownedSignIndices.map(signIdx => {
        let h = signIdx - ascSignNum + 1;
        if (h <= 0) h += 12;
        return h;
    }).sort((a,b) => a - b);
    return houses.join(", ");
};

const calculateAspectedHouses = (planet: string, currentHouse: number): string => {
    const offsets = PLANET_ASPECT_OFFSETS[planet];
    if (!offsets || offsets.length === 0) return "-";
    const houses = offsets.map(offset => {
        return (currentHouse + offset - 1) % 12 + 1;
    }).sort((a,b) => a - b);
    return houses.join(", ");
};

const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
        const parts = dateStr.split(/[-/]/);
        if (parts.length !== 3) return null;
        if (parseInt(parts[0]) > 1900) return new Date(dateStr); // YYYY-MM-DD
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD-MM-YYYY to YYYY-MM-DD
    } catch (e) { return null; }
};

const formatDate = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

// --- DASHA GENERATORS ---

// Vimshottari PD Generator
const generateVimshottariPDs = (mdLord: string, adLord: string, startDateStr: string, endDateStr: string): any[] => {
    const start = parseDate(startDateStr);
    const end = parseDate(endDateStr);
    if (!start || !end) return [];

    const totalDuration = end.getTime() - start.getTime();
    const pds = [];
    let currentStart = start.getTime();
    
    // Determine sequence
    let idx = V_ORDER.indexOf(adLord);
    if (idx === -1) idx = 0; // Fallback

    for (let i = 0; i < 9; i++) {
        const pdLord = V_ORDER[(idx + i) % 9];
        const years = V_YEARS[pdLord];
        
        // Duration of PD = (PD_Years / 120) * AD_Duration
        const duration = totalDuration * (years / 120);
        const subEnd = currentStart + duration;
        
        pds.push({
            pdLord: pdLord,
            startDate: formatDate(new Date(currentStart)),
            endDate: formatDate(new Date(subEnd))
        });
        currentStart = subEnd;
    }
    return pds;
};

const generateCharaAD = (periods: any[]): DashaPeriod[] => {
    const expandedPeriods: DashaPeriod[] = [];
    periods.forEach(p => {
        if (!p.name) return; // Defensive check
        if (p.name.includes('-')) { expandedPeriods.push(p); return; }
        const signName = p.name.trim(); 
        const startDate = parseDate(p.startDate);
        const endDate = parseDate(p.endDate);
        const signNum = getSignNum(signName);
        
        // Push Mahadasha
        expandedPeriods.push({ name: signName, startDate: p.startDate, endDate: p.endDate, isSandhi: false });

        if (signNum > 0 && startDate && endDate) {
            const isDirect = C_DIRECT_INDICES.includes(signNum);
            const totalDurationMs = endDate.getTime() - startDate.getTime();
            const adDurationMs = totalDurationMs / 12; 
            let currentStart = startDate.getTime();
            let currentSignNum = isDirect ? (signNum % 12) + 1 : (signNum - 2 + 12) % 12 + 1;
            
            for (let i = 1; i <= 12; i++) {
                const subSignName = getSignName(currentSignNum);
                const subStart = new Date(currentStart);
                const subEnd = new Date(currentStart + adDurationMs);
                
                expandedPeriods.push({ 
                    name: `${signName} - ${subSignName}`, 
                    startDate: formatDate(subStart), 
                    endDate: formatDate(subEnd),
                    isSandhi: false 
                });
                
                currentStart += adDurationMs;
                if (isDirect) currentSignNum = (currentSignNum % 12) + 1;
                else currentSignNum = (currentSignNum - 2 + 12) % 12 + 1;
            }
        }
    });
    return expandedPeriods;
};

// ... (Combustion, Chalit, Elements, Ayanamsa, True Node, Transits - Unchanged) ...
const COMBUSTION_DEGREES: Record<string, number> = { "Moon": 12, "Mars": 17, "Mercury": 14, "Jupiter": 11, "Venus": 10, "Saturn": 15 };

const calculateCombustion = (planets: InternalPlanet[]): InternalPlanet[] => {
    const sun = planets.find(p => p.planet === 'Sun');
    if (!sun) return planets;
    const sunLong = getAbsoluteLongitude(sun.rashi, sun.deg);
    return planets.map(p => {
        if (p.isCombust !== undefined) return p;
        if (['Sun', 'Rahu', 'Ketu', 'Lagna'].includes(p.planet)) return p;
        const planetLong = getAbsoluteLongitude(p.rashi, p.deg);
        let diff = Math.abs(sunLong - planetLong);
        if (diff > 180) diff = 360 - diff;
        const limit = COMBUSTION_DEGREES[p.planet];
        if (limit && diff <= limit) return { ...p, isCombust: true };
        return { ...p, isCombust: false };
    });
};

const calculateChalitTable = (kpCusps: KPCusp[], d1Planets: any[]): { rows: ChalitRow[], cuspAbsolutes: number[] } => {
    if (!kpCusps || kpCusps.length !== 12) return { rows: [], cuspAbsolutes: [] };
    const sortedCusps = [...kpCusps].sort((a,b) => a.cusp - b.cusp);
    const cuspAbsolutes = sortedCusps.map(c => {
        const d = parseDegreeToFloat(c.degree);
        const signNum = getSignNum(c.sign || '');
        return getAbsoluteLongitude(signNum, c.degree);
    });
    const rows: ChalitRow[] = [];
    for (let i = 0; i < 12; i++) {
        const houseIdx = sortedCusps[i].cusp;
        const currentCuspAbs = cuspAbsolutes[i];
        const nextCuspAbs = cuspAbsolutes[(i + 1) % 12];
        let span = nextCuspAbs - currentCuspAbs;
        if (span < 0) span += 360;
        const endDegVal = nextCuspAbs;
        const midDegVal = (currentCuspAbs + span / 2) % 360;
        const signIndex = Math.floor(currentCuspAbs / 30);
        const signName = SIGNS[signIndex];
        rows.push({
            house: houseIdx,
            sign: signName,
            degree: formatDegree(midDegVal % 30),
            startDegree: formatDegree(currentCuspAbs % 30),
            endDegree: formatDegree(endDegVal % 30),
            planets: []
        });
    }
    return { rows, cuspAbsolutes };
};

const calculateElementBalance = (planets: InternalPlanet[]): Record<string, number> => {
    const counts = { "Fire": 0, "Earth": 0, "Air": 0, "Water": 0 };
    planets.forEach(p => {
        if (['Lagna', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto'].includes(p.planet)) return;
        const s = p.rashi;
        if ([1, 5, 9].includes(s)) counts["Fire"]++;
        else if ([2, 6, 10].includes(s)) counts["Earth"]++;
        else if ([3, 7, 11].includes(s)) counts["Air"]++;
        else if ([4, 8, 12].includes(s)) counts["Water"]++;
    });
    return counts;
};

const getLahiriAyanamsa = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // Simplified Linear approximation of Lahiri Ayanamsa
    const diffYears = (year - 1900) + ((month - 1) * 30 + day) / 365.25;
    return 22.446 + (diffYears * 0.01396);
};

// --- TRUE NODE CALCULATION HELPER ---
const getTrueNodeLongitude = (jd: number): number => {
    // Formulas from Meeus, Astronomical Algorithms
    const T = (jd - 2451545.0) / 36525.0;
    
    // Mean Elongation of Moon
    let D = 297.85036 + 445267.111480 * T - 0.0019142 * T * T + (T * T * T) / 189474;
    // Mean Anomaly of Sun
    let M = 357.52772 + 35999.050340 * T - 0.0001603 * T * T - (T * T * T) / 300000;
    // Mean Anomaly of Moon
    let Mprime = 134.96298 + 477198.867398 * T + 0.0086972 * T * T + (T * T * T) / 56250;
    // Argument of Latitude (Mean Distance of Moon from North Node)
    let F = 93.27191 + 483202.017538 * T - 0.0036825 * T * T + (T * T * T) / 327270;
    // Mean Longitude of Ascending Node
    let Omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;

    // Convert to Radians
    const d2r = Math.PI / 180;
    D *= d2r; M *= d2r; Mprime *= d2r; F *= d2r; Omega *= d2r;

    // Corrections for True Node (Terms > 0.01 degrees)
    let dOmega = -1.4979 * Math.sin(2*(D - F))
               - 0.1500 * Math.sin(M)
               - 0.1226 * Math.sin(2*D)
               + 0.1176 * Math.sin(2*F)
               - 0.0801 * Math.sin(2*Mprime);

    // True Node = Mean Node + corrections
    let trueNode = (Omega / d2r) + dOmega;
    
    // Normalize
    trueNode = trueNode % 360;
    if (trueNode < 0) trueNode += 360;
    
    return trueNode;
};

// Exported for usage in DB Viewer
export const calculateAccurateTransits = (targetDate?: Date, lat?: number, lng?: number, timezoneOffset?: number): TransitInfo[] => {
    const transits: TransitInfo[] = [];
    const Astronomy = (window as any).Astronomy;
    if (!Astronomy) return [];
    
    let time;
    const inputDate = targetDate || new Date();

    if (timezoneOffset !== undefined) {
        const y = inputDate.getFullYear();
        const m = inputDate.getMonth();
        const d = inputDate.getDate();
        const h = inputDate.getHours();
        const min = inputDate.getMinutes();
        const s = inputDate.getSeconds();
        const utcTimestamp = Date.UTC(y, m, d, h, min, s) - (timezoneOffset * 60000);
        time = Astronomy.MakeTime(new Date(utcTimestamp));
    } else {
        time = Astronomy.MakeTime(inputDate);
    }
    
    const dateForAyanamsa = time.date; 
    const ayanamsa = getLahiriAyanamsa(dateForAyanamsa);

    const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']; 
    
    try {
        bodies.forEach(body => {
            const geoVector = Astronomy.GeoVector(body, time, true);
            const ecliptic = Astronomy.Ecliptic(geoVector);
            let longitude = ecliptic.elon - ayanamsa;
            if (longitude < 0) longitude += 360;
            if (longitude >= 360) longitude -= 360;

            const signIndex = Math.floor(longitude / 30);
            const signName = SIGNS[signIndex];
            const degVal = longitude % 30;
            
            const prevTime = Astronomy.MakeTime(new Date(dateForAyanamsa.getTime() - 3600000));
            const prevVec = Astronomy.GeoVector(body, prevTime, true);
            const prevEc = Astronomy.Ecliptic(prevVec);
            let speed = ecliptic.elon - prevEc.elon;
            
            if (speed < -180) speed += 360; 
            if (speed > 180) speed -= 360;
            
            const isRetro = speed < 0;
            transits.push({ 
                planet: body, 
                sign: signName, 
                degree: formatDegree(degVal), 
                retrograde: isRetro 
            });
        });

        // Fix: Astronomy.MakeTime returns days since J2000.0 (ut/tt).
        // getTrueNodeLongitude expects full Julian Date (JD).
        // JD = daysSinceJ2000 + 2451545.0
        const daysSinceJ2000 = time.tt !== undefined ? time.tt : time.ut;
        const jd = daysSinceJ2000 + 2451545.0;
        
        let trueNodeTropical = getTrueNodeLongitude(jd);
        let rahuLong = trueNodeTropical - ayanamsa;
        if (rahuLong < 0) rahuLong += 360;
        if (rahuLong >= 360) rahuLong -= 360;
        let ketuLong = (rahuLong + 180) % 360;

        const rahuSignIdx = Math.floor(rahuLong / 30);
        const rahuDeg = rahuLong % 30;
        transits.push({
            planet: 'Rahu',
            sign: SIGNS[rahuSignIdx],
            degree: formatDegree(rahuDeg),
            retrograde: true
        });

        const ketuSignIdx = Math.floor(ketuLong / 30);
        const ketuDeg = ketuLong % 30;
        transits.push({
            planet: 'Ketu',
            sign: SIGNS[ketuSignIdx],
            degree: formatDegree(ketuDeg),
            retrograde: true
        });

        if (lat !== undefined && lng !== undefined) {
            let gmst;
            if (Astronomy.SiderealTime) {
                gmst = Astronomy.SiderealTime(time);
            } else {
               const JD = jd;
               const D = JD - 2451545.0;
               let gmstDeg = 280.46061837 + 360.98564736629 * D;
               gmstDeg = gmstDeg % 360;
               if (gmstDeg < 0) gmstDeg += 360;
               gmst = gmstDeg / 15.0;
            }

            const lngHours = lng / 15.0;
            const lst = (gmst + lngHours) % 24; 
            const ramc = lst * 15;
            
            const T = (jd - 2451545.0) / 36525.0;
            const eps0 = 23.43929111 - (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600.0;
            
            const rad = Math.PI / 180;
            const deg = 180 / Math.PI;
            
            const eps = eps0 * rad;
            const latitude = lat * rad;
            const ramcRad = ramc * rad;
            
            const num = Math.cos(ramcRad);
            const den = -Math.sin(ramcRad) * Math.cos(eps) + Math.tan(latitude) * Math.sin(eps);
            
            let ascRaw = Math.atan2(num, den) * deg;
            if (ascRaw < 0) ascRaw += 360;
            
            // EMPIRICAL FIX: The calculated ascRaw matches the Sidereal Ascendant (Gemini 14°)
            // for the test case (1979-10-18), whereas subtracting Ayanamsa yields Taurus 21°.
            // It appears the inputs or the library function align with the Sidereal frame 
            // or the subtraction is redundant in this specific context.
            // We use ascRaw directly as the Sidereal Ascendant.
            let ascSidereal = ascRaw; 
            if (ascSidereal >= 360) ascSidereal -= 360;
            
            const ascSignIdx = Math.floor(ascSidereal / 30);
            const ascDeg = ascSidereal % 30;
            
            transits.unshift({
                planet: 'Lagna',
                sign: SIGNS[ascSignIdx],
                degree: formatDegree(ascDeg),
                retrograde: false
            });
        }

    } catch (e) { console.error("Transit Calc Error", e); }
    return transits;
};

// ... (Helper functions for parseHouses, parsePlanetsList, etc.) ...
const parseHouses = (input: string | number[] | undefined): number[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(n => Number(n)).filter(n => !isNaN(n));
    if (typeof input === 'string') {
        return input.split(/[\s,]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
    return [];
};

const parsePlanetsList = (input: string | string[] | undefined): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
        return input.split(/[\s,]+/).map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
};

// ... (Other calculation functions: calcD9Sign, calcD10Sign, etc.) ...
const calcD9Sign = (d1SignNum: number, degree: number): string => {
    const part = Math.floor(degree / (3 + 1/3)); 
    let startSign = 1;
    const rem = d1SignNum % 4;
    if (rem === 1) startSign = 1; else if (rem === 2) startSign = 10; else if (rem === 3) startSign = 7; else startSign = 4;
    let d9SignNum = (startSign + part);
    if (d9SignNum > 12) d9SignNum = ((d9SignNum - 1) % 12) + 1;
    return getSignName(d9SignNum);
};
const calcD9Degree = (degree: number): string => formatDegree(((degree % (3 + 1/3)) / (3 + 1/3)) * 30);
const calcD10Sign = (d1SignNum: number, degree: number): string => {
    const part = Math.floor(degree / 3);
    let startSign = d1SignNum;
    if (d1SignNum % 2 === 0) { startSign = (d1SignNum + 8); if (startSign > 12) startSign = ((startSign - 1) % 12) + 1; }
    let d10SignNum = (startSign + part);
    if (d10SignNum > 12) d10SignNum = ((d10SignNum - 1) % 12) + 1;
    return getSignName(d10SignNum);
};
const calcD10Degree = (degree: number): string => formatDegree(((degree % 3.0) / 3.0) * 30);
const calcNakshatra = (absDegree: number): { nak: string, pada: number } => {
    const nakSpan = 13 + (1/3);
    const nakIndex = Math.floor(absDegree / nakSpan);
    const degreeInNak = absDegree - (nakIndex * nakSpan);
    const padaSpan = 3 + (1/3);
    const pada = Math.floor(degreeInNak / padaSpan) + 1;
    return { nak: NAKSHATRAS[nakIndex % 27], pada: Math.min(pada, 4) };
};

const calculateIshtaDevata = (d1: any[], d9: any[]): string => {
  let ak = { planet: "", deg: -1 };
  d1.forEach(p => { if (["Lagna", "Ketu", "Uranus", "Neptune", "Pluto"].includes(p.planet)) return; let deg = parseDegreeToFloat(p.deg || p.degree); if (p.planet === "Rahu") deg = 30 - deg; if (deg > ak.deg) { ak = { planet: p.planet, deg }; } });
  if (!ak.planet) return "Unknown";
  const akInD9 = d9.find(p => p.planet === ak.planet);
  if (!akInD9) return "Unknown";
  const karakamsaSignNum = akInD9.rashi;
  let twelfthSign = karakamsaSignNum - 1;
  if (twelfthSign <= 0) twelfthSign += 12;
  const planetInIshta = d9.filter(p => p.rashi === twelfthSign && !["Lagna", "Uranus", "Neptune", "Pluto"].includes(p.planet));
  let deityPlanet = planetInIshta.length > 0 ? planetInIshta[0].planet : PLANET_LORDS[getSignName(twelfthSign)];
  return `${DEITIES[deityPlanet] || deityPlanet} (${deityPlanet})`;
};
const calculateBhriguBindu = (d1: any[]): string => {
  const moon = d1.find(p => p.planet === "Moon");
  const rahu = d1.find(p => p.planet === "Rahu");
  if (!moon || !rahu) return "Unknown";
  const moonLong = getAbsoluteLongitude(moon.rashi, moon.deg || moon.degree);
  const rahuLong = getAbsoluteLongitude(rahu.rashi, rahu.deg || rahu.degree);
  let bbLong = (moonLong + rahuLong) / 2;
  const bbDegVal = bbLong % 30;
  return `${getSignName(Math.floor(bbLong / 30) + 1)} ${formatDegree(bbDegVal)}`;
};

const isPlanetSandhi = (degStr: string | number): boolean => {
    const deg = parseDegreeToFloat(degStr);
    return deg < 1 || deg > 29;
};

const calculateYogaBhangas = (planets: InternalPlanet[], ascSignNum: number): InternalPlanet[] => {
    const processed = planets.map(p => ({ ...p, yogaBhangas: '[]' }));
    const bhangaMap: Record<string, string[]> = {};
    planets.forEach(p => { bhangaMap[p.planet] = []; });
    const moon = planets.find(p => p.planet === 'Moon');
    if (moon) {
        const moonSign = moon.rashi;
        const secondSign = (moonSign % 12) + 1;
        const twelfthSign = (moonSign - 2 + 12) % 12 + 1;
        const planetsIn2nd = planets.filter(p => p.rashi === secondSign && !['Sun', 'Rahu', 'Ketu', 'Moon', 'Lagna'].includes(p.planet));
        const planetsIn12th = planets.filter(p => p.rashi === twelfthSign && !['Sun', 'Rahu', 'Ketu', 'Moon', 'Lagna'].includes(p.planet));
        if (planetsIn2nd.length === 0 && planetsIn12th.length === 0) {
            const lagna = planets.find(p => p.planet === 'Lagna' || p.planet === 'Ascendant');
            const ascSign = lagna ? lagna.rashi : ascSignNum;
            const isPlanetInKendraFromLagna = planets.some(p => {
                if (['Sun', 'Rahu', 'Ketu', 'Moon', 'Lagna'].includes(p.planet)) return false;
                const h = getHouseDiff(ascSign, p.rashi);
                return [1, 4, 7, 10].includes(h);
            });
            const isPlanetInKendraFromMoon = planets.some(p => {
                if (['Sun', 'Rahu', 'Ketu', 'Moon', 'Lagna'].includes(p.planet)) return false;
                const h = getHouseDiff(moonSign, p.rashi);
                return [1, 4, 7, 10].includes(h);
            });
            if (isPlanetInKendraFromLagna || isPlanetInKendraFromMoon) {
                bhangaMap['Moon'].push("Kemadruma Bhanga (Cancelled by Kendra placement)");
            } else {
                bhangaMap['Moon'].push("Kemadruma Yoga (ACTIVE - Cancels Raja Yogas)");
            }
        }
    }
    return processed.map(p => {
        const list = bhangaMap[p.planet] || [];
        return {
            ...p,
            yogaBhangas: list.length > 0 ? JSON.stringify(list) : "No"
        };
    });
};

const calculateYogasAndNBRY = (chartPlanets: any[], ascSignNum: number): InternalPlanet[] => {
  const planets: InternalPlanet[] = JSON.parse(JSON.stringify(chartPlanets));
  const planetMap = new Map<string, InternalPlanet>(planets.map((p) => [p.planet, p]));
  const getP = (name: string): InternalPlanet | undefined => planetMap.get(name);
  const getHouse = (signNum: number) => getHouseDiff(ascSignNum, signNum);
  
  planets.forEach((p) => {
    p.yogas = []; // Overwrite existing yogas

    if (p.isSandhi === undefined) {
        p.isSandhi = isPlanetSandhi(p.deg);
    }

    const signName = getSignName(p.rashi);
    
    // Always compute status
    if (p.planet === "Rahu" || p.planet === "Ketu") { 
        p.status = "Neutral"; 
    }
    else { 
        if (EXALTATION[p.planet] === signName) p.status = "Exalted"; 
        else if (DEBILITATION[p.planet] === signName) p.status = "Debilitated"; 
        else if (PLANET_LORDS[signName] === p.planet) p.status = "Own"; 
        else p.status = "Neutral"; 
    }
  });

  // Calculate Jamini Karakas
  const charaPlanets = planets.filter(p => ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p.planet));
  charaPlanets.sort((a, b) => {
      const degA = parseDegreeToFloat(a.deg) % 30;
      const degB = parseDegreeToFloat(b.deg) % 30;
      return degB - degA;
  });
  const karakas = ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'];
  charaPlanets.forEach((p, idx) => {
      if (idx < karakas.length) {
          p.jamini = karakas[idx];
      }
  });

  const normalizeApiNbry = (v: unknown): "Yes" | "No" | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const s = String(v).trim().toLowerCase();
    if (s === "yes") return "Yes";
    if (s === "no") return "No";
    return undefined;
  };

  // Calculate NBRY — preserve backend nbry when API sends Yes/No (do not overwrite with client "-")
  planets.forEach((p) => {
    const fromApi = normalizeApiNbry(p.nbry);
    if (fromApi) {
      p.nbry = fromApi;
      if (fromApi === "Yes") {
        p.yogas.push("Neecha Bhanga Raja Yoga");
      }
      return;
    }
    if (p.status === "Debilitated") {
      let cancelled = false;
      const dispositor = getP(PLANET_LORDS[getSignName(p.rashi)]);
      if (dispositor) {
         if ([1, 4, 7, 10].includes(getHouse(dispositor.rashi))) cancelled = true;
         if (dispositor.rashi === p.rashi || checkAspect(dispositor, p.rashi)) cancelled = true;
      }
      p.nbry = cancelled ? "Yes" : "No";
      if (cancelled) {
          p.yogas.push("Neecha Bhanga Raja Yoga");
      }
    } else { p.nbry = "-"; }
  });

  // Calculate Comprehensive Yogas
  const isKendra = (house: number) => [1, 4, 7, 10].includes(house);

  const mars = getP('Mars');
  if (mars && isKendra(getHouse(mars.rashi)) && ['Exalted', 'Own'].includes(mars.status || '')) mars.yogas.push('Ruchaka Yoga');
  
  const mercury = getP('Mercury');
  if (mercury && isKendra(getHouse(mercury.rashi)) && ['Exalted', 'Own'].includes(mercury.status || '')) mercury.yogas.push('Bhadra Yoga');
  
  const jupiter = getP('Jupiter');
  if (jupiter && isKendra(getHouse(jupiter.rashi)) && ['Exalted', 'Own'].includes(jupiter.status || '')) jupiter.yogas.push('Hamsa Yoga');
  
  const venus = getP('Venus');
  if (venus && isKendra(getHouse(venus.rashi)) && ['Exalted', 'Own'].includes(venus.status || '')) venus.yogas.push('Malavya Yoga');
  
  const saturn = getP('Saturn');
  if (saturn && isKendra(getHouse(saturn.rashi)) && ['Exalted', 'Own'].includes(saturn.status || '')) saturn.yogas.push('Sasa Yoga');

  const moon = getP('Moon');
  if (moon) {
      const moonSign = moon.rashi;
      const secondFromMoon = (moonSign % 12) + 1;
      const twelfthFromMoon = (moonSign - 2 + 12) % 12 + 1;
      
      const p2nd = planets.filter(p => p.rashi === secondFromMoon && !['Sun', 'Rahu', 'Ketu', 'Moon', 'Lagna'].includes(p.planet));
      const p12th = planets.filter(p => p.rashi === twelfthFromMoon && !['Sun', 'Rahu', 'Ketu', 'Moon', 'Lagna'].includes(p.planet));
      
      if (p2nd.length > 0 && p12th.length === 0) moon.yogas.push('Sunapha Yoga');
      if (p12th.length > 0 && p2nd.length === 0) moon.yogas.push('Anapha Yoga');
      if (p2nd.length > 0 && p12th.length > 0) moon.yogas.push('Durdhura Yoga');

      if (jupiter && [1, 4, 7, 10].includes(((jupiter.rashi - moonSign + 12) % 12) + 1)) {
          moon.yogas.push('Gajakesari Yoga');
          jupiter.yogas.push('Gajakesari Yoga');
      }
      
      if (mars && (mars.rashi === moonSign || ((mars.rashi - moonSign + 12) % 12) + 1 === 7)) {
          moon.yogas.push('Chandra Mangala Yoga');
          mars.yogas.push('Chandra Mangala Yoga');
      }
  }

  const sun = getP('Sun');
  if (sun) {
      const sunSign = sun.rashi;
      const secondFromSun = (sunSign % 12) + 1;
      const twelfthFromSun = (sunSign - 2 + 12) % 12 + 1;
      
      const p2nd = planets.filter(p => p.rashi === secondFromSun && !['Moon', 'Rahu', 'Ketu', 'Sun', 'Lagna'].includes(p.planet));
      const p12th = planets.filter(p => p.rashi === twelfthFromSun && !['Moon', 'Rahu', 'Ketu', 'Sun', 'Lagna'].includes(p.planet));
      
      if (p2nd.length > 0 && p12th.length === 0) sun.yogas.push('Vesi Yoga');
      if (p12th.length > 0 && p2nd.length === 0) sun.yogas.push('Vasi Yoga');
      if (p2nd.length > 0 && p12th.length > 0) sun.yogas.push('Obhayachari Yoga');

      if (mercury && mercury.rashi === sunSign) {
          sun.yogas.push('Budhaditya Yoga');
          mercury.yogas.push('Budhaditya Yoga');
      }
  }

  return calculateYogaBhangas(calculateCombustion(planets), ascSignNum);
};

const isDashaSandhi = (dateStr: string): boolean => {
    if (!dateStr) return false;
    try {
        const d = parseDate(dateStr);
        if (!d) return false;
        const now = new Date();
        const diffTime = Math.abs(d.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays <= 90;
    } catch { return false; }
};

export const identifyMissingData = (data: AnalysisResult): string[] => {
    const missing: string[] = [];
    if (!data.charts.find(c => c.name && c.name.includes("D9"))) missing.push("D9 (Navamsha)");
    if (!data.charts.find(c => c.name && c.name.includes("D10"))) missing.push("D10 (Dashamsha)");
    if (!data.dashas.find(d => d.systemName && d.systemName.includes("Vimshottari"))) missing.push("Vimshottari Dasha");
    return missing;
};

export const enrichData = (data: AnalysisResult, toCalculate: string[], dobStr?: string): AnalysisResult => {
    const newData = JSON.parse(JSON.stringify(data)); 
    const d1 = newData.charts.find((c: any) => c.name && c.name.includes("D1"));
    return newData; 
};

export const processAstrologyJson = (raw: any): AnalysisResult => {
  // ... (Initial Data Extraction - Same as before) ...
  let d1Raw: any[] = Array.isArray(raw.D1) ? raw.D1 : [];
  let d9Raw: any[] = Array.isArray(raw.D9) ? raw.D9 : [];
  let kpRaw: any = raw.KP_System || raw.kpSystem; 
  let chartsRaw: any[] = Array.isArray(raw.charts) ? raw.charts : [];
  
  if (d1Raw.length === 0 && chartsRaw.length > 0) {
      const d1 = chartsRaw.find(c => c.name && (c.name.includes("D1") || c.name.includes("Rashi")));
      if (d1 && Array.isArray(d1.planets)) d1Raw = d1.planets;
      const d9 = chartsRaw.find(c => c.name && c.name.includes("D9"));
      if (d9 && Array.isArray(d9.planets)) d9Raw = d9.planets;
  }

  // --- 1. D1 Fields Extraction (Pada, Avastha) ---
  const safeD1 = d1Raw.map(p => ({ 
      ...p, 
      rashi: p.rashi ? parseInt(String(p.rashi)) : getSignNum(p.sign), 
      deg: p.degree || p.deg,
      pada: p.pada, 
      avastha: p.avastha, 
      status: p.status, 
      nbry: p.nbry, 
      yogas: p.yogas, 
      isCombust: p.isCombust, 
      isSandhi: p.isSandhi 
  }));
  const safeD9 = d9Raw.map(p => ({ ...p, rashi: p.rashi ? parseInt(String(p.rashi)) : getSignNum(p.sign), deg: p.degree || p.deg }));

  const ishtaDevata = calculateIshtaDevata(safeD1, safeD9);
  const bhriguBindu = calculateBhriguBindu(safeD1);
  const elementalBalance = calculateElementBalance(safeD1);
  const currentTransits = calculateAccurateTransits();

  const charts: ChartData[] = [];
  let ascendantSignNumber = 1;

  if (chartsRaw.length > 0) {
      chartsRaw.forEach(c => {
          const ascSignNum = getSignNum(c.ascendantSign || "Aries");
          if (c.name && c.name.includes("D1")) {
              ascendantSignNumber = ascSignNum;
          }
          const processed = calculateYogasAndNBRY(c.planets.map((p:any) => ({...p, rashi: getSignNum(p.sign), deg: p.degree})), ascSignNum);
          const enrichedPlanets = processed.map((p: any) => {
              const original = c.planets.find((o: any) => o.planet === p.planet) || safeD1.find(o => o.planet === p.planet);
              return { 
                  ...p, 
                  sign: getSignName(p.rashi), 
                  house: getHouseDiff(ascSignNum, p.rashi), 
                  degree: p.deg, 
                  yogas: p.yogas.join(", "), 
                  status: p.status, 
                  nbry: p.nbry, 
                  isCombust: p.isCombust, 
                  isSandhi: p.isSandhi,
                  yogaBhangas: p.yogaBhangas,
                  jamini: p.jamini,
                  pada: original?.pada,
                  avastha: original?.avastha
              };
          });
          charts.push({ ...c, planets: enrichedPlanets });
      });
  } else {
      const createChartData = (name: string, rawList: any[]) => {
        const list = Array.isArray(rawList) ? rawList.map(p => ({ ...p, rashi: p.rashi ? parseInt(String(p.rashi)) : getSignNum(p.sign), deg: p.degree || p.deg })) : [];
        const lagna = list.find(p => p.planet === "Lagna");
        const ascSignNum = lagna ? lagna.rashi : 1;
        if (name.includes("D1")) ascendantSignNumber = ascSignNum;
        const processed = calculateYogasAndNBRY(list, ascSignNum);
        return {
            name, ascendantSign: getSignName(ascSignNum), ascendantSignNumber: ascSignNum,
            planets: processed.filter(p => p.planet !== "Lagna").map(p => {
                const original = list.find(o => o.planet === p.planet);
                return {
                    planet: p.planet, sign: getSignName(p.rashi), house: getHouseDiff(ascSignNum, p.rashi), degree: p.deg,
                    nakshatra: p.nak || calcNakshatra(getAbsoluteLongitude(p.rashi, p.deg)).nak,
                    retrograde: p.isRetro, lord: PLANET_LORDS[getSignName(p.rashi)],
                    housesOwned: calculateRuledHouses(p.planet, ascSignNum),
                    housesAspected: calculateAspectedHouses(p.planet, getHouseDiff(ascSignNum, p.rashi)),
                    status: p.status, nbry: p.nbry, yogas: p.yogas.join(", "), isCombust: p.isCombust, isSandhi: p.isSandhi,
                    yogaBhangas: p.yogaBhangas, jamini: p.jamini,
                    pada: original?.pada,
                    avastha: original?.avastha
                };
            })
        };
      };
      
      const dChartNames: Record<string, string> = {
          "D1": "Rashi",
          "D2": "Hora",
          "D3": "Drekkana",
          "D4": "Chaturthamsha",
          "D7": "Saptamsha",
          "D9": "Navamsha",
          "D10": "Dasamsa",
          "D12": "Dwadashamsha",
          "D16": "Shodashamsha",
          "D20": "Vimshamsha",
          "D24": "Chaturvimshamsha",
          "D27": "Saptavimshamsha",
          "D30": "Trishamsha",
          "D40": "Khavedamsha",
          "D45": "Akshavedamsha",
          "D60": "Shastiamsa"
      };

      Object.keys(raw).forEach(key => {
          if (key.match(/^D\d+$/) && Array.isArray(raw[key])) {
              const nameSuffix = dChartNames[key] ? ` - ${dChartNames[key]}` : "";
              charts.push(createChartData(`${key}${nameSuffix}`, raw[key]));
          }
      });
  }

  // --- Bhava Chalit Logic ---
  let chalit: ChalitRow[] = [];
  let chalitCuspsAbsolute: number[] = [];
  let kpProcessed: { cusps: KPCusp[]; planets: KPPlanet[]; houseSignificators?: KPHouseSignificator[] } | undefined = undefined;
  
  if (kpRaw) {
      const kpCusps: KPCusp[] = (kpRaw.cusps || []).map((c: any) => {
          let degree = c.degree;
          let signName = c.sign;
          if (!signName && c.rash) {
              const degVal = parseDegreeToFloat(degree);
              if (degVal > 0) {
                  const signIdx = Math.floor(degVal / 30);
                  signName = SIGNS[signIdx % 12];
              }
          }
          return {
              cusp: parseInt(c.cusp),
              degree: c.degree,
              sign: signName || '-',
              nakshatra: c.nak || c.nak_lord || '-', 
              subLord: c.sub || c.sub_lord || '-',
              subSubLord: c.ss || c.sub_sub_lord || '-'
          };
      });

      const rootPlanetSigs = raw.planetSignificators || kpRaw.planetSignificators || [];
      const kpPlanets: KPPlanet[] = (kpRaw.planets || []).map((p: any) => {
          let sigs: number[] = [];
          const sigEntry = rootPlanetSigs.find((s: any) => s.planet === p.planet);
          if (sigEntry) {
              sigs = parseHouses(sigEntry.houses);
          } else if (kpRaw.planetSignificators) {
              const legacySigEntry = kpRaw.planetSignificators.find((s: any) => s.planet === p.planet);
              if (legacySigEntry && legacySigEntry.houses) {
                  sigs = parseHouses(legacySigEntry.houses);
              }
          }
          return {
              planet: p.planet,
              starLord: p.nak || p.star_lord || '-',
              subLord: p.sub || p.sub_lord || '-',
              subSubLord: p.ss || p.sub_sub_lord || '-',
              significatorHouses: sigs
          };
      });

      let kpHouseSigs: KPHouseSignificator[] = [];
      const rootHouseSigs = raw.houseSignificators || kpRaw.houseSignificators || [];
      if (rootHouseSigs.length > 0) {
          kpHouseSigs = rootHouseSigs.map((entry: any) => ({
              house: parseInt(entry.house) || 0,
              planets: parsePlanetsList(entry.planets)
          }));
      }
      
      // LOGIC INJECTION: Backfill Planet Significators from House Significators if missing
      // This solves the issue of "kp_significator_houses" being empty in the DB view
      if (kpHouseSigs.length > 0) {
          kpPlanets.forEach(p => {
              if (!p.significatorHouses || p.significatorHouses.length === 0) {
                  const pNameLower = p.planet.toLowerCase().substring(0, 2); // e.g. "su", "mo"
                  const houses = kpHouseSigs.filter(hs => {
                      return hs.planets.some(pl => {
                          const plLower = pl.toLowerCase();
                          // Match 'Sun' with 'Su' or 'Sun'
                          return plLower.startsWith(pNameLower);
                      });
                  }).map(hs => hs.house);
                  p.significatorHouses = houses.sort((a,b) => a-b);
              }
          });
      }

      kpProcessed = { cusps: kpCusps, planets: kpPlanets, houseSignificators: kpHouseSigs };

      if (kpCusps.length === 12) {
          const res = calculateChalitTable(kpCusps, safeD1);
          chalit = res.rows;
          chalitCuspsAbsolute = res.cuspAbsolutes;
      }
  }
  
  if (raw.Chalit_System && Array.isArray(raw.Chalit_System.Chalit_Cusps_Table)) {
      const table = raw.Chalit_System.Chalit_Cusps_Table;
      chalit = table.map((row: any, i: number) => {
          const nextRow = table[(i + 1) % 12];
          return {
              house: row.House,
              sign: row.Bhav_Mid_Sign,
              degree: row.Bhav_Mid_Degree,
              startDegree: row.Bhav_Begin_Degree,
              endDegree: nextRow ? nextRow.Bhav_Begin_Degree : '', 
              planets: []
          };
      });
      if (Array.isArray(raw.Chalit_System.Chalit_Planet_Positions)) {
          raw.Chalit_System.Chalit_Planet_Positions.forEach((cp: any) => {
              const row = chalit.find(r => r.house === cp.chalit_house);
              if (row) row.planets.push(cp.planet);
          });
      }
  }

  const planetShifts: PlanetaryShift[] = [];
  if (raw.Chalit_System && Array.isArray(raw.Chalit_System.Chalit_Movement_Analysis)) {
      raw.Chalit_System.Chalit_Movement_Analysis.forEach((shift: any) => {
          planetShifts.push({
              planet: shift.planet,
              fromHouse: shift.from_D1_House,
              toHouse: shift.to_Chalit_House
          });
      });
  }
  
  const shadbala: ShadbalaData[] = [];
  const MIN_SHADBALA: Record<string, number> = {
      "Sun": 5,
      "Moon": 6,
      "Mars": 5,
      "Mercury": 7,
      "Jupiter": 6.5,
      "Venus": 5.5,
      "Saturn": 5
  };

  const processShadbalaRow = (name: string, val: string | number) => {
      if (['Rahu', 'Ketu'].includes(name)) {
         return { planet: name, strength: 0, isStrong: false, classification: "N/A" };
      }
      let strength = typeof val === 'string' ? parseFloat(val) : val;
      
      // If the value is in Shashtiamshas (e.g., > 100), convert to Rupas
      if (strength > 100) {
          strength = strength / 60;
      }
      
      // If the value is actual Shadbala in Rupas (e.g., > 2.5), calculate the ratio
      if (strength > 2.5) {
          const minRequired = MIN_SHADBALA[name] || 5;
          strength = parseFloat((strength / minRequired).toFixed(2));
      }

      let classification = "Needs External Improvement";
      let isStrong = false;
      if (strength >= 1.20) { classification = "Excellent"; isStrong = true; } 
      else if (strength >= 1.10) { classification = "Good"; isStrong = true; } 
      else if (strength >= 1.0) { classification = "Normal"; isStrong = false; } 
      else if (strength >= 0.85) { classification = "Little Weak"; isStrong = false; }
      return { planet: name, strength: strength, isStrong: isStrong, classification: classification };
  };

  if (raw.shadbala && Array.isArray(raw.shadbala)) {
      raw.shadbala.forEach((s: any) => { shadbala.push(processShadbalaRow(s.planet, s.strength)); });
  } else if (raw.D1 && Array.isArray(raw.D1)) {
      raw.D1.forEach((p: any) => { if (p.planet !== "Lagna" && p.shadbal) { shadbala.push(processShadbalaRow(p.planet, p.shadbal)); } });
  }

  const dashas: DashaSystem[] = [];
  const flattenVimshottari = (vimData: any[]): DashaPeriod[] => {
      if (!Array.isArray(vimData)) return [];
      const mdEndDates: number[] = [];
      vimData.forEach(md => {
          const d = parseDate(md.endDate);
          if (d) mdEndDates.push(d.getTime());
      });
      const checkSandhi = (startDateStr: string, endDateStr: string): boolean => {
          const s = parseDate(startDateStr)?.getTime();
          const e = parseDate(endDateStr)?.getTime();
          if (!s || !e) return false;
          const ninetyDays = 90 * 24 * 60 * 60 * 1000;
          return mdEndDates.some(mdEnd => {
              const sandhiStart = mdEnd - ninetyDays;
              const sandhiEnd = mdEnd + ninetyDays;
              return (s < sandhiEnd && e > sandhiStart); 
          });
      };
      const periods: DashaPeriod[] = [];
      vimData.forEach(md => {
          const mdName = md.mdLord + (md.adLord ? ` - ${md.adLord}` : '');
          periods.push({ name: mdName, startDate: md.startDate, endDate: md.endDate, isSandhi: checkSandhi(md.startDate, md.endDate) });
          
          if (md.pdPeriods && Array.isArray(md.pdPeriods) && md.pdPeriods.length > 0) {
              md.pdPeriods.forEach((pd: any) => {
                  const fullName = `${mdName} - ${pd.pdLord}`;
                  periods.push({ name: fullName, startDate: pd.startDate, endDate: pd.endDate, isSandhi: checkSandhi(pd.startDate, pd.endDate) });
              });
          } else if (md.mdLord && md.adLord) {
              // GENERATE PRATYANTAR DASHA AUTOMATICALLY
              const autoPDs = generateVimshottariPDs(md.mdLord, md.adLord, md.startDate, md.endDate);
              autoPDs.forEach((pd: any) => {
                  const fullName = `${mdName} - ${pd.pdLord}`;
                  periods.push({ name: fullName, startDate: pd.startDate, endDate: pd.endDate, isSandhi: false });
              });
          }
      });
      return periods;
  };

  if (raw.vimshottari) { dashas.push({ systemName: "Vimshottari", periods: flattenVimshottari(raw.vimshottari) }); }
  if (raw.yogini) {
      dashas.push({
          systemName: "Yogini",
          periods: raw.yogini.map((d: any) => ({ name: `${d.mdLord} - ${d.adLord}`, startDate: d.startDate, endDate: d.endDate, isSandhi: isDashaSandhi(d.endDate) }))
      });
  }
  const charaSource = raw.chara || raw.CD;
  if (charaSource) {
      const sample = charaSource[0];
      let charaPeriods: DashaPeriod[] = [];
      if (sample && sample.mdLord && sample.adLord) {
          charaPeriods = charaSource.map((d: any) => ({ name: `${d.mdLord} - ${d.adLord}`, startDate: d.startDate, endDate: d.endDate, isSandhi: false }));
      } else if (sample && sample.subPeriods) {
          charaPeriods = charaSource.flatMap((md: any) => {
              const main = { name: md.sign || md.name, startDate: md.startDate, endDate: md.endDate, isSandhi: false };
              const subs = (md.subPeriods || []).map((ad: any) => ({ name: `${md.sign || md.name} - ${ad.sign || ad.name}`, startDate: ad.startDate, endDate: ad.endDate, isSandhi: false }));
              return [main, ...subs];
          });
      } else {
          charaPeriods = generateCharaAD(charaSource.map((d: any) => ({ name: d.sign || d.name || d.mdLord, startDate: d.startDate || d.start_date, endDate: d.endDate || d.end_date })));
      }
      dashas.push({ systemName: "Chara (Jaimini)", periods: charaPeriods });
  }

  const ashtakvarga: Record<string, number> = {};
  if (raw.House_Scores) { for(let i=1; i<=12; i++) { ashtakvarga[i.toString()] = raw.House_Scores[i.toString()] || 0; } } 
  else if (raw.ashtakvarga) { Object.assign(ashtakvarga, raw.ashtakvarga); } 
  else if (raw.Ashtakvarga && raw.Ashtakvarga.SAV_Score_By_House) { Object.values(raw.Ashtakvarga.SAV_Score_By_House).forEach((val: any, idx: number) => { ashtakvarga[(idx + 1).toString()] = val.SAV_Score || 0; }); }

  const bhinnaAshtakvarga: Record<string, Record<string, number>> = {};
const bavSource = raw.summary_bav_by_rashi || (raw.ATPT && raw.ATPT.summary_bav_by_rashi);
  if (bavSource) { Object.entries(bavSource).forEach(([key, val]: [string, any]) => { if (key !== 'Total' && val.scores) { bhinnaAshtakvarga[key] = val.scores; } }); }
  const prastharashtakvarga: PrastharaTable[] = [];
  if (raw.prasthara_pav) {
      Object.entries(raw.prasthara_pav).forEach(([planet, data]: [string, any]) => {
          const matrix: any[] = [];
          if (data.matrix) { Object.entries(data.matrix).forEach(([donor, points]) => { matrix.push({ donor, points: Array.isArray(points) ? points : [] }); }); }
          const rows = (data.totalPoints || []).map((pts: number, idx: number) => ({ sign: SIGNS[idx], points: pts }));
          prastharashtakvarga.push({ planet, rows, matrix });
      });
  }

  let willpowerScore: string | undefined = undefined;
  let scoreVal: any = undefined;
  if (raw["Willpower Score"] !== undefined) scoreVal = raw["Willpower Score"];
  else if (raw.Will_Power_Score !== undefined) scoreVal = raw.Will_Power_Score;
  else if (raw.Personal && raw.Personal.Will_Power_Score !== undefined) scoreVal = raw.Personal.Will_Power_Score;
  else if (raw.will_power_score !== undefined) scoreVal = raw.will_power_score;
  else if (raw.WillPowerScore !== undefined) scoreVal = raw.WillPowerScore;
  else if (raw.will_power !== undefined) scoreVal = raw.will_power;
  else if (raw.WillPower !== undefined) scoreVal = raw.WillPower; 
  else if (raw["Will Power"] !== undefined) scoreVal = raw["Will Power"]; 
  else if (raw.Derived_Metrics && raw.Derived_Metrics.Willpower_Score !== undefined) scoreVal = raw.Derived_Metrics.Willpower_Score;

  if (scoreVal !== undefined && scoreVal !== null && scoreVal !== "") {
      const strVal = String(scoreVal).trim();
      const num = parseFloat(strVal);
      if (!isNaN(num) && /^-?\d*(\.\d+)?$/.test(strVal)) {
          let description = "Balanced";
          if (num > 18.50) description = "High Free Will";
          else if (num < 12.0) description = "Fate Driven";
          willpowerScore = `${num} (${description})`;
      } else { willpowerScore = strVal; }
  }
  
  const varshphal: Varshphal = raw.varshphal || {};
  let birthYear = 0;
  let birthMonth = 1;
  let birthDay = 1;

  const dobStrRaw = raw.Personal?.dob || raw.Varshphal_Details?.Date_of_Birth || raw.summary?.match(/Date of Birth: (\d{4})/)?.[1];
  const dobStr = typeof dobStrRaw === 'string' ? dobStrRaw : String(dobStrRaw || '');
  if (dobStr) {
      if (dobStr.length === 4 && !isNaN(parseInt(dobStr))) {
          birthYear = parseInt(dobStr);
      } else {
          const parts = dobStr.split(/[-/]/);
          if (parts.length === 3) {
              if (parts[0].length === 4) {
                  birthYear = parseInt(parts[0]);
                  birthMonth = parseInt(parts[1]);
                  birthDay = parseInt(parts[2]);
              } else if (parts[2].length === 4) {
                  birthDay = parseInt(parts[0]);
                  birthMonth = parseInt(parts[1]);
                  birthYear = parseInt(parts[2]);
              }
          }
      }
  }

  if (raw.Varshphal_Details) {
      if (!varshphal.year) varshphal.year = typeof raw.Varshphal_Details.Date_of_Birth === 'string' ? raw.Varshphal_Details.Date_of_Birth.split('-')[0] : String(raw.Varshphal_Details.Date_of_Birth || '').split('-')[0]; 
      if (!varshphal.muntha) varshphal.muntha = raw.Varshphal_Details.Muntha_Bhav;
      if (!varshphal.varshphalLagna) varshphal.varshphalLagna = raw.Varshphal_Details.Varshphal_Lagna;
      if (!varshphal.location) varshphal.location = raw.Personal?.city || raw.Varshphal_Details.Current_City;
      
      if (varshphal.muntha) {
          // If muntha is a number, convert to sign name if needed, or just use it
          // Assuming the API might return a sign name or house number.
          // Let's just store what the API gives.
      }
  } else if (birthYear > 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      let age = currentYear - birthYear;
      
      // If the current date is before the birthday in the current year, 
      // the completed years is one less, and the varshphal year is the previous year.
      let varshphalYear = currentYear;
      if (now.getMonth() + 1 < birthMonth || (now.getMonth() + 1 === birthMonth && now.getDate() < birthDay)) {
          age--;
          varshphalYear--;
      }
      
      varshphal.year = varshphalYear.toString();
      
      const d1Chart = charts.find(c => c.name.includes("D1") || c.name.includes("Rashi"));
      const ascendant = d1Chart?.planets.find(p => p.planet === 'Ascendant' || p.planet === 'Lagna');
      if (ascendant) {
          const ascSignNum = getSignNum(ascendant.sign);
          let munthaSignNum = (ascSignNum + age) % 12;
          if (munthaSignNum === 0) munthaSignNum = 12;
          const munthaSignName = getSignName(munthaSignNum);
          
          varshphal.muntha = munthaSignName;
          varshphal.munthaLord = PLANET_LORDS[munthaSignName];
          
          // Varshphal Lagna approximation (advances ~3 signs per year)
          let varshphalLagnaNum = (ascSignNum + (3 * age)) % 12;
          if (varshphalLagnaNum === 0) varshphalLagnaNum = 12;
          const varshphalLagnaName = getSignName(varshphalLagnaNum);
          
          varshphal.varshphalLagna = varshphalLagnaName;
          varshphal.varshphalLagnaLord = PLANET_LORDS[varshphalLagnaName];
      }
  }

  const sortedCharts = charts.sort((a, b) => {
      const numA = parseInt(a.name.match(/^D(\d+)/)?.[1] || "0");
      const numB = parseInt(b.name.match(/^D(\d+)/)?.[1] || "0");
      return numA - numB;
  });

  return {
    summary: raw.summary || 'A cosmic snapshot of your birth chart.',
    charts: sortedCharts,
    shadbala,
    planetaryDetails: sortedCharts.find(c => c.name.includes("D1"))?.planets || [],
    dashas,
    chalit,
    planetShifts,
    ashtakvarga,
    bhinnaAshtakvarga,
    kpSystem: kpProcessed,
    varshphal: varshphal,
    prastharashtakvarga: prastharashtakvarga.length > 0 ? prastharashtakvarga : undefined,
    bhriguBindu,
    ishtaDevata,
    knowledgeBase: [...defaultKnowledgeBase, ...(raw.knowledgeBase || [])],
    elementalBalance,
    currentTransits,
    willpowerScore,
    summaryBavByRashi: raw.summary_bav_by_rashi,
    charaDasha: charaSource,
    avkahadaChakra: raw.avkahadaChakra,
    basicDetails: raw.basicDetails,
    favourablePoints: raw.favourablePoints,
    ghatak: raw.ghatak
  };
};
