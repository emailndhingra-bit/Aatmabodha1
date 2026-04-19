/**
 * Build AnalysisResult from saved profile birth data (same pipeline as App.handleGenerateChart).
 * Used by admin "Load in Oracle" without mounting App.
 */
import type { AnalysisResult, RawInput } from '../types';
import {
  processAstrologyJson,
  identifyMissingData,
  enrichData,
  getSignNum,
} from './jsonMapper';

export type ProfileChartInput = {
  name?: string;
  gender?: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  timezone?: string | number | null;
};

export function convertToISTForAPI(dob: string, tob: string, timezoneOffset: number) {
  const [year, month, day] = dob.split('-').map(Number);
  const [hour, minute] = tob.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMs = timezoneOffset * 60 * 60 * 1000;
  const trueUtcTime = utcDate.getTime() - offsetMs;
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = trueUtcTime + istOffsetMs;
  const istDate = new Date(istTime);
  const istDob = istDate.toISOString().split('T')[0];
  const istTob = istDate.toISOString().split('T')[1].substring(0, 5);
  return { date_of_birth: istDob, time_of_birth: istTob };
}

function enrichRawData(parsed: any, tzOffset: number, longitudeStr: string) {
  const avkahadaChakraObj = parsed.Avakahada_Chakra || parsed.avkahadaChakra || {};
  let d1Raw = Array.isArray(parsed.D1) ? parsed.D1 : [];
  if (d1Raw.length === 0 && Array.isArray(parsed.charts) && parsed.charts.length > 0) {
    const d1 = parsed.charts.find((c: any) => c.name && (c.name.includes('D1') || c.name.includes('Rashi')));
    if (d1 && Array.isArray(d1.planets)) d1Raw = d1.planets;
  }
  const moon = d1Raw.find((p: any) => p.planet === 'Moon' || p.name === 'Moon');
  if (moon) {
    const signNum = moon.rashi ? parseInt(String(moon.rashi), 10) : getSignNum(moon.sign);
    const parseDegreeToFloat = (degStr: string | number): number => {
      if (typeof degStr === 'number') return degStr;
      if (!degStr) return 0;
      const parts = String(degStr).split(/[:°'"\- ]/);
      const d = parseFloat(parts[0]) || 0;
      const m = parseFloat(parts[1]) || 0;
      const s = parseFloat(parts[2]) || 0;
      return d + m / 60 + s / 3600;
    };
    const degVal = parseDegreeToFloat(moon.degree || moon.deg);
    const moonLon = (signNum - 1) * 30 + degVal;
    const nakNum = Math.floor(moonLon / (360 / 27)) + 1;
    const PAYA_MAP: Record<number, string> = {
      // GOLD (3 nakshatras): Ashwini, Bharani, Revati
      1: 'Gold', // Ashwini
      2: 'Gold', // Bharani
      27: 'Gold', // Revati

      // IRON (3 nakshatras): Kritika, Rohini, Mrigashira
      3: 'Iron', // Kritika
      4: 'Iron', // Rohini
      5: 'Iron', // Mrigashira

      // SILVER (12 nakshatras): Ardra → Anuradha
      6: 'Silver', // Ardra
      7: 'Silver', // Punarvasu
      8: 'Silver', // Pushya
      9: 'Silver', // Ashlesha
      10: 'Silver', // Magha
      11: 'Silver', // Purva Phalguni
      12: 'Silver', // Uttara Phalguni
      13: 'Silver', // Hasta
      14: 'Silver', // Chitra
      15: 'Silver', // Swati
      16: 'Silver', // Vishakha
      17: 'Silver', // Anuradha

      // COPPER (9 nakshatras): Jyeshtha → Uttara Bhadrapada
      18: 'Copper', // Jyeshtha
      19: 'Copper', // Moola
      20: 'Copper', // Purva Ashadha
      21: 'Copper', // Uttara Ashadha
      22: 'Copper', // Shravana
      23: 'Copper', // Dhanishta
      24: 'Copper', // Shatabhisha
      25: 'Copper', // Purva Bhadrapada
      26: 'Copper', // Uttara Bhadrapada
    };
    avkahadaChakraObj.Paya = PAYA_MAP[nakNum];
  }
  if ((avkahadaChakraObj.Sunrise || avkahadaChakraObj.Sunset) && longitudeStr && !Number.isNaN(parseFloat(longitudeStr))) {
    const lmtOffset = parseFloat(longitudeStr) / 15;
    const correction = (tzOffset || 5.5) - lmtOffset;
    const correctTime = (apiTimeStr: any, correctionHours: number) => {
      if (!apiTimeStr || typeof apiTimeStr !== 'string') return apiTimeStr;
      const isPM = apiTimeStr.toUpperCase().includes('PM');
      const cleanStr = apiTimeStr.replace(/[^\d:]/g, '');
      const parts = cleanStr.split(':').map(Number);
      if (parts.length < 2) return apiTimeStr;
      let h = parts[0] || 0;
      if (isPM && h < 12) h += 12;
      if (!isPM && h === 12) h = 0;
      const m = parts[1] || 0;
      const s = parts[2] || 0;
      let totalMin = h * 60 + m + s / 60 + correctionHours * 60;
      totalMin = ((totalMin % 1440) + 1440) % 1440;
      const hh = Math.floor(totalMin / 60);
      const mm = Math.floor(totalMin % 60);
      const ss = Math.round((totalMin % 1) * 60);
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };
    if (avkahadaChakraObj.Sunrise) avkahadaChakraObj.Sunrise = correctTime(avkahadaChakraObj.Sunrise, correction);
    if (avkahadaChakraObj.Sunset) avkahadaChakraObj.Sunset = correctTime(avkahadaChakraObj.Sunset, correction);
    const basicDetailsObj = parsed.Basic_Details || parsed.Traditional;
    if (basicDetailsObj) {
      if (avkahadaChakraObj.Sunrise) {
        basicDetailsObj.Sunrise = avkahadaChakraObj.Sunrise;
      }
      if (avkahadaChakraObj.Sunset) {
        basicDetailsObj.Sunset = avkahadaChakraObj.Sunset;
      }
    }
  }
  parsed.Avakahada_Chakra = avkahadaChakraObj;
  parsed.avkahadaChakra = avkahadaChakraObj;
  return parsed;
}

function chartApiBase(): string {
  const viteApi = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string; VITE_BACKEND_URL?: string } }).env
    ?.VITE_API_URL;
  const viteBackend = (import.meta as ImportMeta & { env?: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL;
  return (viteApi || viteBackend || 'https://aatmabodha1-backend.onrender.com').replace(/\/$/, '');
}

export async function fetchAnalysisForProfile(profile: ProfileChartInput): Promise<AnalysisResult> {
  const dobVal = profile.dateOfBirth;
  const tobVal = profile.timeOfBirth;
  const latVal =
    profile.latitude != null && profile.latitude !== ''
      ? String(profile.latitude)
      : '';
  const lonVal =
    profile.longitude != null && profile.longitude !== ''
      ? String(profile.longitude)
      : '';
  const tzRaw =
    profile.timezone != null && profile.timezone !== '' ? parseFloat(String(profile.timezone)) : Number.NaN;
  const tzVal = Number.isFinite(tzRaw) ? tzRaw : 5.5;
  const nameVal = profile.name || 'Profile';
  const pobVal = profile.placeOfBirth || '';
  const genderVal = profile.gender || 'Prefer not to say';

  if (!dobVal || !tobVal || !latVal || !lonVal) {
    throw new Error('Profile is missing date, time, or coordinates needed for chart API.');
  }

  const { date_of_birth, time_of_birth } = convertToISTForAPI(dobVal, tobVal, tzVal);
  const payload = {
    date_of_birth,
    time_of_birth,
    latitude: parseFloat(latVal),
    longitude: parseFloat(lonVal),
    timezone: tzVal,
  };

  const res = await fetch(`${chartApiBase()}/api/chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Chart API returned an error.');
  let parsed: any = await res.json();
  return buildAnalysisResultFromChartJson(parsed, profile);
}

/** Build the same `AnalysisResult` as the chart API + profile metadata (used by admin quick-chart). */
export function buildAnalysisResultFromChartJson(rawChart: any, profile: ProfileChartInput): AnalysisResult {
  const dobVal = profile.dateOfBirth;
  const tobVal = profile.timeOfBirth;
  const latVal =
    profile.latitude != null && profile.latitude !== ''
      ? String(profile.latitude)
      : '';
  const lonVal =
    profile.longitude != null && profile.longitude !== ''
      ? String(profile.longitude)
      : '';
  const tzRaw =
    profile.timezone != null && profile.timezone !== '' ? parseFloat(String(profile.timezone)) : Number.NaN;
  const tzVal = Number.isFinite(tzRaw) ? tzRaw : 5.5;
  const nameVal = profile.name || 'Profile';
  const pobVal = profile.placeOfBirth || '';
  const genderVal = profile.gender || 'Prefer not to say';

  let parsed: any = rawChart && typeof rawChart === 'object' ? rawChart : {};
  parsed = enrichRawData(parsed, tzVal, lonVal);

  const dCharts = Object.keys(parsed).reduce((acc: any, key: string) => {
    if (key.match(/^D\d+$/)) acc[key] = parsed[key];
    return acc;
  }, {});

  const basicDetailsObj = parsed.Basic_Details || parsed.Traditional || {};
  if (nameVal) basicDetailsObj.Name = nameVal;
  if (genderVal && genderVal !== 'Prefer not to say') basicDetailsObj.Gender = genderVal;
  if (dobVal) {
    const [y, m, d] = dobVal.split('-');
    basicDetailsObj.Date_of_Birth = `${d}/${m}/${y}`;
  }
  if (tobVal) basicDetailsObj.Time_of_Birth = tobVal;
  if (pobVal) basicDetailsObj.Place_of_Birth = pobVal;

  const combinedData: Partial<RawInput> = {
    Personal: {
      dob: parsed.Varshphal_Details?.Date_of_Birth || dobVal,
      city: parsed.Varshphal_Details?.Birth_City || pobVal,
      lagna: parsed.Varshphal_Details?.Varshphal_Lagna || 'Aries',
      muntha: parsed.Varshphal_Details?.Muntha_Bhav || '1',
      Will_Power_Score: parsed.ATPT?.['Willpower Score'] || parsed.Derived_Metrics?.Willpower_Score || 0,
    },
    ...dCharts,
    D1: parsed.D1 || [],
    D9: parsed.D9 || [],
    KP_System: parsed.KP || parsed.KP_System || {},
    summary_bav_by_rashi: parsed.ATPT?.summary_bav_by_rashi || parsed.summary_bav_by_rashi || {},
    prasthara_pav: parsed.ATPT?.prasthara_pav || parsed.prasthara_pav || {},
    House_Scores: parsed.ATPT?.House_Scores || parsed.House_Scores || {},
    vimshottari: parsed.VD || parsed.vimshottari || [],
    yogini: parsed.YD || parsed.yogini || [],
    chara: parsed.CD || parsed.chara || [],
    Chalit_System: parsed.Chalit_System || {},
    ashtakvarga: parsed.Ashtakvarga || parsed.ashtakvarga || {},
    avkahadaChakra: parsed.Avakahada_Chakra || parsed.avkahadaChakra || {},
    basicDetails: basicDetailsObj,
    favourablePoints: parsed.Favourable_Points || parsed.favourablePoints || {},
    ghatak: { ...(parsed.Ghatak || parsed.ghatak || {}), Gender: genderVal },
    knowledgeBase: [],
    charts: parsed.charts || [],
    Varshphal_Details: parsed.Varshphal_Details || undefined,
  };

  let result = processAstrologyJson(combinedData);
  const missing = identifyMissingData(result);
  if (missing.length > 0) {
    result = enrichData(result, missing, dobVal);
  }

  result.userContext = {
    gotra: '',
    baselineMood: 'Prefer not to say',
    age: '',
    gender: genderVal,
    hasPhoto: false,
    hasPalm: false,
    palmImageDate: '',
  };

  return result;
}

