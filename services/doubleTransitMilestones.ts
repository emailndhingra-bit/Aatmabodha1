/**
 * Token-optimized Double-Transit (Jupiter + Saturn) milestone builder.
 * Samples sidereal Ju/Sa via calculateAccurateTransits (no raw daily ephemeris rows).
 * Whole-sign houses from natal Lagna; classical full aspects per graha.
 */
import { calculateAccurateTransits, PLANET_LORDS } from "./jsonMapper";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type DoubleTransitTrigger = "Double_Transit_Jup_Sat";

export interface DoubleTransitMilestone {
  house: number;
  trigger: DoubleTransitTrigger;
  start: string;
  end: string;
}

const MS_DAY = 86400000;
const SAMPLE_MS = 45 * MS_DAY;
const MAX_SAMPLES = 420;

function normSignIndex(name: string | null | undefined): number {
  if (!name || typeof name !== "string") return -1;
  const t = name.trim().toLowerCase();
  for (let i = 0; i < SIGNS.length; i++) {
    const s = SIGNS[i].toLowerCase();
    if (t === s || t.startsWith(s.slice(0, 3))) return i;
  }
  return -1;
}

function parseDobFromDb(db: any): Date | null {
  if (!db) return null;
  try {
    const res = db.exec("SELECT key, value FROM basic_details");
    const rows = res?.[0]?.values as [string, string][] | undefined;
    if (!rows?.length) return null;
    let raw = "";
    for (const [k, v] of rows) {
      const lk = (k || "").toLowerCase();
      if (lk.includes("date") && lk.includes("birth")) {
        raw = String(v || "");
        break;
      }
      if (lk === "date_of_birth" || lk === "dob") {
        raw = String(v || "");
        break;
      }
    }
    if (!raw) return null;
    raw = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const d = new Date(raw + "T12:00:00Z");
      return Number.isFinite(d.getTime()) ? d : null;
    }
    const parts = raw.split(/[-/]/).map((x) => parseInt(x.trim(), 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [a, b, c] = parts;
    if (c > 1900 && c < 2100 && a <= 31 && b <= 12) {
      return new Date(Date.UTC(c, b - 1, a, 12, 0, 0));
    }
    if (a > 1900 && a < 2100) {
      return new Date(Date.UTC(a, b - 1, c, 12, 0, 0));
    }
    if (c > 1900 && c < 2100 && a <= 31 && b <= 12) {
      return new Date(Date.UTC(c, b - 1, a, 12, 0, 0));
    }
  } catch {
    return null;
  }
  return null;
}

function lagnaSignIndex0(db: any): number {
  try {
    const r = db.exec(`SELECT D1_Rashi_sign FROM planets WHERE planet_name='Lagna' LIMIT 1`);
    const v = r?.[0]?.values?.[0]?.[0];
    const z = normSignIndex(String(v || ""));
    return z >= 0 ? z : 0;
  } catch {
    return 0;
  }
}

function natalLordSignIndex0(db: any, house1to12: number, lagna0: number): number {
  const h = Math.max(1, Math.min(12, house1to12));
  const signName = SIGNS[(lagna0 + h - 1) % 12];
  const lord = PLANET_LORDS[signName];
  if (!lord) return -1;
  try {
    const safeLord = lord.replace(/'/g, "''");
    const r = db.exec(`SELECT D1_Rashi_sign FROM planets WHERE planet_name='${safeLord}' LIMIT 1`);
    const v = r?.[0]?.values?.[0]?.[0];
    return normSignIndex(String(v || ""));
  } catch {
    return -1;
  }
}

/** Signs receiving conjunction + full classical aspects from transit graha sign (0–11). */
function influenceSetFromTransit(transitSign0: number, graha: "Jupiter" | "Saturn"): Set<number> {
  const s = new Set<number>();
  const b = ((transitSign0 % 12) + 12) % 12;
  s.add(b);
  if (graha === "Jupiter") {
    [4, 6, 8].forEach((d) => s.add((b + d) % 12));
  } else {
    [2, 6, 9].forEach((d) => s.add((b + d) % 12));
  }
  return s;
}

function targetsForHouse(db: any, house1to12: number, lagna0: number): Set<number> {
  const T = new Set<number>();
  const h = Math.max(1, Math.min(12, house1to12));
  T.add((((lagna0 + h - 1) % 12) + 12) % 12));
  const lz = natalLordSignIndex0(db, h, lagna0);
  if (lz >= 0) T.add(lz);
  return T;
}

function monthKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function topicHousesFromQuestion(q: string): number[] {
  const x = q.toLowerCase();
  if (x.match(/marriage|love|relationship|partner|spouse|wife|husband|7th/)) return [7];
  if (x.match(/career|job|business|naukri|success|promotion|work|office|profession|10th/)) return [10];
  if (x.match(/money|wealth|property|finance|car|investment|bank|income|2nd|11th/)) return [2, 11];
  if (x.match(/health|illness|disease|hospital|6th/)) return [6];
  if (x.match(/child|pregnancy|5th/)) return [5];
  if (x.match(/home|mother|vehicle|property|4th/)) return [4];
  if (x.match(/spirit|dharma|9th/)) return [9];
  return [];
}

function doubleHitForHouse(
  juSign: string,
  saSign: string,
  db: any,
  house1to12: number,
  lagna0: number,
): boolean {
  const ju0 = normSignIndex(juSign);
  const sa0 = normSignIndex(saSign);
  if (ju0 < 0 || sa0 < 0) return false;
  const targets = targetsForHouse(db, house1to12, lagna0);
  const juInf = influenceSetFromTransit(ju0, "Jupiter");
  const saInf = influenceSetFromTransit(sa0, "Saturn");
  let juHit = false;
  let saHit = false;
  targets.forEach((t) => {
    const tt = ((t % 12) + 12) % 12;
    if (juInf.has(tt)) juHit = true;
    if (saInf.has(tt)) saHit = true;
  });
  return juHit && saHit;
}

function mergeMonthlyHits(house: number, months: string[]): DoubleTransitMilestone[] {
  if (!months.length) return [];
  const u = [...new Set(months)].sort();
  const windows: DoubleTransitMilestone[] = [];
  let s = u[0];
  let p = u[0];
  for (let i = 1; i < u.length; i++) {
    const cur = u[i];
    const [py, pm] = p.split("-").map(Number);
    const nextExpected = pm === 12 ? `${py + 1}-01` : `${py}-${String(pm + 1).padStart(2, "0")}`;
    if (cur === nextExpected) {
      p = cur;
    } else {
      windows.push({ house, trigger: "Double_Transit_Jup_Sat", start: s, end: p });
      s = cur;
      p = cur;
    }
  }
  windows.push({ house, trigger: "Double_Transit_Jup_Sat", start: s, end: p });
  return windows;
}

/**
 * Pre-computes overlapping Ju+Sa classical activation windows on topic house + lord (whole-sign).
 */
export function computeDoubleTransitMilestones(db: any, question: string): DoubleTransitMilestone[] {
  const houses = topicHousesFromQuestion(question);
  if (!db || !houses.length) return [];
  if (typeof window === "undefined" || !(window as any).Astronomy) return [];

  const dob = parseDobFromDb(db);
  const now = new Date();
  const adultStart = dob
    ? new Date(Math.max(dob.getTime() + 18 * 365.25 * MS_DAY, Date.UTC(1970, 0, 1)))
    : new Date(Date.UTC(1990, 0, 1));
  const horizonEnd = new Date(Math.min(now.getTime() + 24 * MS_DAY * 365, adultStart.getTime() + 85 * 365.25 * MS_DAY));

  const lagna0 = lagnaSignIndex0(db);
  const hitsByHouse: Record<number, string[]> = {};
  houses.forEach((h) => {
    hitsByHouse[h] = [];
  });

  let t = adultStart.getTime();
  let iter = 0;
  while (t <= horizonEnd.getTime() && iter < MAX_SAMPLES) {
    iter++;
    const d = new Date(t);
    const trans = calculateAccurateTransits(d, undefined, undefined);
    const ju = trans.find((x) => x.planet === "Jupiter");
    const sa = trans.find((x) => x.planet === "Saturn");
    if (ju?.sign && sa?.sign) {
      const mk = monthKeyUTC(d);
      houses.forEach((h) => {
        if (doubleHitForHouse(ju.sign, sa.sign, db, h, lagna0)) {
          hitsByHouse[h].push(mk);
        }
      });
    }
    t += SAMPLE_MS;
  }

  const all: DoubleTransitMilestone[] = [];
  houses.forEach((h) => {
    all.push(...mergeMonthlyHits(h, hitsByHouse[h] || []));
  });
  all.sort((a, b) => a.start.localeCompare(b.start));
  return all.slice(0, 24);
}

/** Compact JSON line for CHART_DATA / CONTEXT (no daily degrees). */
export function buildDoubleTransitMilestoneBlock(db: any, question: string): string {
  const m = computeDoubleTransitMilestones(db, question);
  if (!m.length) return "";
  return `\nDT_MILESTONES:${JSON.stringify(m)}`;
}
