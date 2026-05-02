import { Gem, VisualAnalysis, PalmAnalysis, BookChapter, RectificationResult, AnalysisResult } from "../types";
import { DEFAULT_RULES } from "./defaultRules";
import { ORACLE_RULES } from "./oracleRules";
import { computeQuotaRemainingFromUser } from "./userQuota";

// ─────────────────────────────────────────────────────────────
// BACKEND PROXY — All Gemini calls go through Flask on AWS.
// Never call Gemini directly from the browser.
// Set NEXT_PUBLIC_BACKEND_URL in your .env.local and on Vercel.
// ─────────────────────────────────────────────────────────────
const BACKEND_URL =
    (typeof import.meta !== "undefined" && (import.meta as ImportMeta & { env?: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL) ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BACKEND_URL : undefined) ||
    "https://aatmabodha1-backend.onrender.com";
const GEMINI_MODEL = "gemini-3.1-pro-preview";

// Session memory keys — scoped per chart fingerprint so a new nativity never reads the last chart's memory
export const MEMORY_KEY_PREFIX = "aatmabodha_memory_";
const VEDIC_ORACLE_FP_KEY = "vedicOracleNatalFingerprint";

let activeGeminiChatSession: { _history?: { role: string; text: string }[] } | null = null;

export function setActiveOracleNatalFingerprint(fp: string): void {
    try {
        if (typeof localStorage === "undefined") return;
        const norm = (fp || "").replace(/\s+/g, "").slice(0, 32);
        localStorage.setItem(VEDIC_ORACLE_FP_KEY, norm || "default");
    } catch {
        /* ignore */
    }
}

export function getActiveOracleNatalFingerprint(): string {
    try {
        if (typeof localStorage === "undefined") return "";
        return (localStorage.getItem(VEDIC_ORACLE_FP_KEY) || "").replace(/\s+/g, "");
    } catch {
        return "";
    }
}

export function clearActiveOracleNatalFingerprint(): void {
    try {
        if (typeof localStorage === "undefined") return;
        localStorage.removeItem(VEDIC_ORACLE_FP_KEY);
    } catch {
        /* ignore */
    }
}

/** localStorage key for USER_MEMORY merge (userId + first 16 hex of natal fingerprint). */
export function getMemoryStorageKey(userId: string): string {
    const fp = getActiveOracleNatalFingerprint().slice(0, 16) || "default";
    return `${MEMORY_KEY_PREFIX}${userId}_${fp}`;
}

/** Persisted chat transcript key per chart (parallel to Gemini _history). */
export function getVedicChatHistoryStorageKey(): string {
    const fp = getActiveOracleNatalFingerprint().slice(0, 16) || "default";
    return `vedicChatHistory_${fp}`;
}

function clearOracleChatRamAndDisk(): void {
    const fp = getActiveOracleNatalFingerprint().slice(0, 16) || "default";
    try {
        localStorage.removeItem(`vedicChatHistory_${fp}`);
        localStorage.removeItem("vedicChatHistory");
    } catch {
        /* ignore */
    }
    if (activeGeminiChatSession && Array.isArray(activeGeminiChatSession._history)) {
        activeGeminiChatSession._history = [];
    }
    console.log("[GeminiService] History cleared for new chart");
}

function attachGeminiWindowApi(): void {
    if (typeof window === "undefined") return;
    (window as unknown as { __geminiService?: { clearHistory: () => void } }).__geminiService = {
        clearHistory: (): void => {
            clearOracleChatRamAndDisk();
        },
    };
}

if (typeof window !== "undefined") {
    attachGeminiWindowApi();
}

/** Display name for oracle greetings / system prompt (auth_user → userContext → "Ji"). */
const DEFAULT_ORACLE_USER_NAME = "Ji";

export function resolveOracleUserDisplayName(): string {
    try {
        if (typeof localStorage === "undefined") return DEFAULT_ORACLE_USER_NAME;
        const pick = (v: unknown): string | null => {
            if (typeof v !== "string") return null;
            const t = v.trim().replace(/\s+/g, " ");
            return t.length > 0 && t.length <= 80 ? t : null;
        };
        const authRaw = localStorage.getItem("auth_user");
        if (authRaw) {
            const auth = JSON.parse(authRaw) as Record<string, unknown>;
            for (const key of ["name", "displayName", "firstName", "username"] as const) {
                const s = pick(auth[key]);
                if (s) return s;
            }
        }
        const ctxRaw = localStorage.getItem("userContext");
        if (ctxRaw) {
            const ctx = JSON.parse(ctxRaw) as Record<string, unknown>;
            for (const key of ["profileName", "displayName", "name", "preferredName"] as const) {
                const s = pick(ctx[key]);
                if (s) return s;
            }
        }
    } catch {
        /* ignore */
    }
    return DEFAULT_ORACLE_USER_NAME;
}

function resolveMemoryUserIdFromStorage(): string {
    try {
        if (typeof localStorage === "undefined") return "guest";
        const authRaw = localStorage.getItem("auth_user");
        if (!authRaw) return "guest";
        const auth = JSON.parse(authRaw) as { id?: string };
        if (typeof auth?.id === "string" && auth.id.trim()) return auth.id.trim();
        return "guest";
    } catch {
        return "guest";
    }
}

/**
 * V5.9: remaining question count for [QUOTA_REMAINING].
 * Uses `questionsUsed` / `customQuota` on the User row in `auth_user` (kept in sync with /api/auth/me).
 * `custom_quota === 0` means unlimited → large integer sentinel for the model slot.
 */
function getUserQuotaRemainingFromAuth(): number {
    try {
        if (typeof localStorage === "undefined") return 0;
        const authRaw = localStorage.getItem("auth_user");
        if (!authRaw) return 0;
        const u = JSON.parse(authRaw) as Record<string, unknown>;
        const rem = computeQuotaRemainingFromUser(u);
        if (rem === "Unlimited") return 999999;
        return rem;
    } catch {
        return 0;
    }
}

// Load memory from localStorage
export function loadSessionMemory(userId?: string): string {
    try {
        if (typeof localStorage === "undefined") return "";
        const uid = userId || resolveMemoryUserIdFromStorage();
        const key = getMemoryStorageKey(uid);
        let raw = localStorage.getItem(key);
        if (!raw) {
            const legacyKey = `${MEMORY_KEY_PREFIX}${uid}`;
            raw = localStorage.getItem(legacyKey);
        }
        if (!raw) return "";
        const memory = JSON.parse(raw);
        // Only use memory from last 30 days
        const lastSession = new Date(memory.lastSession);
        const daysSince = (Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 30) {
            try {
                localStorage.removeItem(key);
                localStorage.removeItem(`${MEMORY_KEY_PREFIX}${uid}`);
            } catch {
                /* ignore */
            }
            return "";
        }
        return `USER_MEMORY: ${JSON.stringify(memory)}`;
    } catch {
        return "";
    }
}

// Save memory to localStorage after session
export function saveSessionMemory(
    userIdOrUpdates:
        | string
        | {
              topicsDiscussed?: string[];
              remediesGiven?: string[];
              pastValidated?: string;
              keyInsightsGiven?: string[];
              nextRemedyInRotation?: string;
          },
    updatesArg?: {
        topicsDiscussed?: string[];
        remediesGiven?: string[];
        pastValidated?: string;
        keyInsightsGiven?: string[];
        nextRemedyInRotation?: string;
    },
): void {
    const userId = typeof userIdOrUpdates === "string" ? userIdOrUpdates : undefined;
    const updates = typeof userIdOrUpdates === "string" ? updatesArg || {} : userIdOrUpdates;
    const uid = userId || resolveMemoryUserIdFromStorage();
    const key = getMemoryStorageKey(uid);
    try {
        if (typeof localStorage === "undefined") return;
        const existing = localStorage.getItem(key);
        const current = existing
            ? JSON.parse(existing)
            : {
                  lastSession: "",
                  topicsDiscussed: [],
                  remediesGiven: [],
                  pastValidated: "",
                  keyInsightsGiven: [],
                  nextRemedyInRotation: "temple",
              };

        // Merge updates
        const merged = {
            lastSession: new Date().toISOString(),
            topicsDiscussed: [
                ...new Set([...(current.topicsDiscussed || []), ...(updates.topicsDiscussed || [])]),
            ].slice(-10), // keep last 10 topics
            remediesGiven: [
                ...new Set([...(current.remediesGiven || []), ...(updates.remediesGiven || [])]),
            ].slice(-6), // keep last 6 remedies
            pastValidated: updates.pastValidated || current.pastValidated || "",
            keyInsightsGiven: [
                ...new Set([...(current.keyInsightsGiven || []), ...(updates.keyInsightsGiven || [])]),
            ].slice(-10), // keep last 10 insights
            nextRemedyInRotation: updates.nextRemedyInRotation || current.nextRemedyInRotation || "temple",
        };

        localStorage.setItem(key, JSON.stringify(merged));
    } catch {
        // localStorage not available — silent fail
    }
}

/** JSON POSTs to Nest proxy — Bearer token so OptionalJwtGuard can set req.user */
const jsonAuthHeaders = (): Record<string, string> => {
    const token =
        typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const REPORT_LOG_TITLES: Record<string, string> = {
    life_book: "Life Book",
    hidden_gems: "Hidden Gems",
    daily_forecast: "Daily Forecast",
    btr: "Birth Time Rectification",
};

const titleFromReportType = (reportType: string): string =>
    REPORT_LOG_TITLES[reportType] ||
    reportType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** POST /api/reports/log — fire-and-forget; skips if no auth_token */
const postReportLog = (opts: {
    profileName: string;
    reportType: string;
    contentValue: unknown;
    language: string;
}): void => {
    if (typeof localStorage === "undefined") return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const content = JSON.stringify(opts.contentValue ?? "").substring(0, 500);
    const body = {
        profileName: opts.profileName || "Profile",
        reportType: opts.reportType,
        title: titleFromReportType(opts.reportType),
        content,
        language: opts.language || "EN",
    };
    void fetch(`${BACKEND_URL}/api/reports/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────
// Core helper — sends prompt to Flask /api/gemini
// ─────────────────────────────────────────────────────────────
const callGemini = async (
    prompt: string,
    responseFormat: "text" | "json" = "text",
    imageParts?: { mimeType: string; data: string }[]
): Promise<string> => {
    const res = await fetch(`${BACKEND_URL}/api/gemini`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
            model: GEMINI_MODEL,
            prompt,
            responseFormat,
            imageParts: imageParts || [],
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Backend error: ${res.status}`);
    }
    const data = await res.json();
    return data.text || "";
};

// ─────────────────────────────────────────────────────────────
// Chat helper — sends full conversation history to Flask /api/gemini-chat
// ─────────────────────────────────────────────────────────────
type GeminiChatResult = { text: string; error?: string };

const callGeminiChat = async (
    systemInstruction: string,
    history: { role: "user" | "model"; text: string }[],
    newMessage: string,
    userQuestion?: string,
    natalFingerprint?: string,
): Promise<GeminiChatResult> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);
    try {
        const res = await fetch(`${BACKEND_URL}/api/gemini-chat`, {
            method: "POST",
            headers: jsonAuthHeaders(),
            signal: controller.signal,
            body: JSON.stringify({
                model: GEMINI_MODEL,
                systemInstruction,
                history,
                message: newMessage,
                ...(natalFingerprint ? { natalFingerprint } : {}),
                ...(userQuestion != null && userQuestion !== ""
                    ? { userQuestion }
                    : {}),
                ...(typeof window !== "undefined" &&
                    (() => {
                      try {
                        const authRaw2 = localStorage.getItem('auth_user');
                        const authId2 = authRaw2
                          ? (JSON.parse(authRaw2) as {id?:string})?.id || 'guest'
                          : 'guest';
                        const ctx = localStorage.getItem(
                          `aatmabodha_chart_context_${authId2}`,
                        );
                        return ctx ? { chartContext: JSON.parse(ctx) } : {};
                      } catch {
                        return {};
                      }
                    })()),
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Backend chat error: ${res.status}`);
        }
        const data = await res.json();
        if (data?.error) {
            return { text: "", error: String(data.error) };
        }
        return { text: data.text || "" };
    } catch (e: unknown) {
        const aborted =
            (e instanceof Error && e.name === "AbortError") ||
            (typeof DOMException !== "undefined" &&
                e instanceof DOMException &&
                e.name === "AbortError");
        if (aborted) {
            throw new Error(
                "Request timed out while waiting for Guruji (over ~3 min). Your chart is safe — please try again.",
            );
        }
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
};

// ─────────────────────────────────────────────────────────────
// Helper to extract mime type and base64 data safely
// (unchanged — no API calls here)
// ─────────────────────────────────────────────────────────────
const processBase64Image = (base64String: string) => {
    if (!base64String) return { mimeType: 'image/jpeg', data: '' };
    const str = String(base64String).trim();
    const matches = str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        let mimeType = matches[1];
        const data = matches[2];
        if (mimeType === 'application/octet-stream' || mimeType === 'binary/octet-stream' || mimeType === 'application/pdf') {
            if (data.startsWith('AAAAJGZ0eXBoZWlj')) mimeType = 'image/heic';
            else if (data.startsWith('/9j/')) mimeType = 'image/jpeg';
            else if (data.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
        }
        return { mimeType, data };
    }
    let cleanData = str;
    let mime = 'image/jpeg';
    if (str.includes('base64,')) {
        const parts = str.split('base64,');
        cleanData = parts[1];
        const mimePart = parts[0].match(/data:(.*?);/);
        if (mimePart) mime = mimePart[1];
    }
    return { mimeType: mime, data: cleanData };
};

// ─────────────────────────────────────────────────────────────
// Transformation layer: rashi_id → canonical Western sign names
// (prevents the model from conflating house numbers with sign indices)
// ─────────────────────────────────────────────────────────────
const RASHI_NAMES = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
] as const;

/** Sidereal sign index 1–12 → explicit sign name (canonical for prompts). */
export const mapRashi = (id: number): string => {
    if (typeof id !== "number" || id < 1 || id > 12) return "";
    return RASHI_NAMES[id - 1];
};

function signToRashiId(sign: string | null | undefined): number | null {
    if (sign == null || String(sign).trim() === "") return null;
    const n = String(sign).trim().toLowerCase();
    const i = RASHI_NAMES.findIndex((s) => s.toLowerCase() === n);
    return i >= 0 ? i + 1 : null;
}

/** One row per planet × divisional chart — all 16 Shodashvarga (D1–D60 set) for SQL→prompt mapping. */
export type DivisionalSqlInputRow = {
    planet_name: string;
    chart_type: string;
    house_id: number | null;
    rashi_id?: number | null;
    sign?: string | null;
    avastha?: string | null;
};

/** Structured placement after transformation (house = arena, sign = environment). */
export type PromptChartPlacement = {
    planet: string;
    chart: string;
    house_id: number | null;
    sign_name: string;
    avastha: string;
};

/**
 * Maps raw SQL-style rows to prompt objects. Uses `mapRashi(rashi_id)` when valid;
 * otherwise derives rashi from `sign` / `sign_name` text.
 */
export const buildPromptContext = (sqlRows: DivisionalSqlInputRow[]): PromptChartPlacement[] => {
    return sqlRows.map((row) => {
        let rid: number | null =
            typeof row.rashi_id === "number" && row.rashi_id >= 1 && row.rashi_id <= 12 ? row.rashi_id : null;
        if (rid == null) {
            const fromSign = signToRashiId(row.sign ?? (row as { sign_name?: string }).sign_name);
            rid = fromSign;
        }
        const sign_name =
            rid != null && rid >= 1 && rid <= 12
                ? mapRashi(rid)
                : String(row.sign ?? (row as { sign_name?: string }).sign_name ?? "").trim() || "Unknown";
        return {
            planet: row.planet_name,
            chart: row.chart_type,
            house_id: row.house_id ?? null,
            sign_name,
            avastha: row.avastha != null && row.avastha !== "" ? String(row.avastha) : "",
        };
    });
};

export function buildDivisionalSqlRowsFromPlanetsTable(db: any): DivisionalSqlInputRow[] {
    if (!db) return [];
    const out: DivisionalSqlInputRow[] = [];
    try {
        const res = db.exec(`
            SELECT planet_name,
                   D1_Rashi_house, D1_Rashi_sign, D1_Rashi_avastha,
                   D2_Hora_house, D2_Hora_sign,
                   D3_Drekkana_house, D3_Drekkana_sign,
                   D4_Chaturthamsha_house, D4_Chaturthamsha_sign,
                   D7_Saptamamsha_house, D7_Saptamamsha_sign,
                   D9_Navamsha_house, D9_Navamsha_sign,
                   D10_Dasamsa_house, D10_Dasamsa_sign,
                   D12_Dwadamsha_house, D12_Dwadamsha_sign,
                   D16_Shodasamsha_house, D16_Shodasamsha_sign,
                   D20_Vimshamsha_house, D20_Vimshamsha_sign,
                   D24_Chaturvimshamsha_house, D24_Chaturvimshamsha_sign,
                   D27_Saptavimshamsha_house, D27_Saptavimshamsha_sign,
                   D30_Trimshamsha_house, D30_Trimshamsha_sign,
                   D40_Khavedamsha_house, D40_Khavedamsha_sign,
                   D45_Akshavedamsha_house, D45_Akshavedamsha_sign,
                   D60_Shastiamsa_house, D60_Shastiamsa_sign
            FROM planets
            WHERE planet_name != 'Lagna'
            ORDER BY planet_name
        `);
        const values = res[0]?.values as any[][] | undefined;
        if (!values?.length) return out;

        // Static Mapping for all 16 Shodashvarga Charts
        // Index 0: planet_name, Index 3: avastha
        const charts: { chart: string; houseIdx: number; signIdx: number }[] = [
            { chart: "D1", houseIdx: 1, signIdx: 2 },
            { chart: "D2", houseIdx: 4, signIdx: 5 },
            { chart: "D3", houseIdx: 6, signIdx: 7 },
            { chart: "D4", houseIdx: 8, signIdx: 9 },
            { chart: "D7", houseIdx: 10, signIdx: 11 },
            { chart: "D9", houseIdx: 12, signIdx: 13 },
            { chart: "D10", houseIdx: 14, signIdx: 15 },
            { chart: "D12", houseIdx: 16, signIdx: 17 },
            { chart: "D16", houseIdx: 18, signIdx: 19 },
            { chart: "D20", houseIdx: 20, signIdx: 21 },
            { chart: "D24", houseIdx: 22, signIdx: 23 },
            { chart: "D27", houseIdx: 24, signIdx: 25 },
            { chart: "D30", houseIdx: 26, signIdx: 27 },
            { chart: "D40", houseIdx: 28, signIdx: 29 },
            { chart: "D45", houseIdx: 30, signIdx: 31 },
            { chart: "D60", houseIdx: 32, signIdx: 33 }
        ];

        for (const row of values) {
            const planet_name = String(row[0] ?? "");
            const avastha = row[3] != null ? String(row[3]) : "";
            for (const { chart, houseIdx, signIdx } of charts) {
                const houseRaw = row[houseIdx];
                const signRaw = row[signIdx];
                const house_id =
                    houseRaw === null || houseRaw === undefined || houseRaw === "" || houseRaw === "-"
                        ? null
                        : Number(houseRaw);
                const sign = signRaw != null && signRaw !== "" && signRaw !== "-" ? String(signRaw) : "";
                const rashi_id = signToRashiId(sign);
                out.push({
                    planet_name,
                    chart_type: chart,
                    house_id: Number.isFinite(house_id as number) ? (house_id as number) : null,
                    rashi_id,
                    sign: sign || undefined,
                    avastha,
                });
            }
        }
    } catch (e) {
        console.warn("[buildDivisionalSqlRowsFromPlanetsTable]", e);
    }
    return out;
}

export function getDivisionalPromptPlacements(db: any): PromptChartPlacement[] {
    return buildPromptContext(buildDivisionalSqlRowsFromPlanetsTable(db));
}

// ─────────────────────────────────────────────────────────────
// Generate context from SQLite DB for the AI
// (unchanged — no API calls here)
// ─────────────────────────────────────────────────────────────
export const generateVirtualFileContext = (db: any, includeKB: boolean = false): string => {
    if (!db) return "";
    let context = `[SYSTEM_TIME_ANCHOR]\nCURRENT_DATE: ${new Date().toISOString()}\nTIMEZONE: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n--------------------------------------------------\n`;
    context += "SYSTEM_CONTEXT: User's Vedic Astrology Chart Details.\n";
    try {
        const personalRes = db.exec("SELECT property, value FROM personal");
        if (personalRes.length > 0 && personalRes[0].values) {
            context += "\n[PERSONAL DETAILS & VISUAL TRAITS]\n";
            personalRes[0].values.forEach((row: any[]) => {
                if (row[0] === 'face_reading_implication' || row[0] === 'Body Analysis JSON') {
                    try {
                        const json = JSON.parse(row[1]);
                        context += `\n[BODY FEATURE ANALYSIS (SAMUDRIKA)]\n${JSON.stringify(json.face_reading_implication.features_analysis, null, 2)}\n`;
                    } catch (e) { context += `${row[0]}: ${row[1]}\n`; }
                } else { context += `${row[0]}: ${row[1]}\n`; }
            });
        }
        const basicRes = db.exec("SELECT key, value FROM basic_details");
        if (basicRes.length > 0 && basicRes[0].values) {
            context += "\n[BASIC DETAILS]\n";
            basicRes[0].values.forEach((row: any[]) => { context += `${row[0]}: ${row[1]}\n`; });
        }
        const avkahadaRes = db.exec("SELECT key, value FROM avkahada_chakra");
        if (avkahadaRes.length > 0 && avkahadaRes[0].values) {
            context += "\n[AVKAHADA CHAKRA]\n";
            avkahadaRes[0].values.forEach((row: any[]) => { context += `${row[0]}: ${row[1]}\n`; });
        }
        const specialRes = db.exec("SELECT point_name, value FROM special_points");
        if (specialRes.length > 0 && specialRes[0].values) {
            context += "\n[SPECIAL POINTS]\n";
            specialRes[0].values.forEach((row: any[]) => { context += `${row[0]}: ${row[1]}\n`; });
        }
        const elemRes = db.exec("SELECT element, count FROM elemental_balance");
        if (elemRes.length > 0 && elemRes[0].values) {
            context += "\n[ELEMENTAL BALANCE]\n";
            elemRes[0].values.forEach((row: any[]) => { context += `${row[0]}: ${row[1]} Planets\n`; });
        }
        const planetRes = db.exec("SELECT * FROM planets");
        if (planetRes.length > 0 && planetRes[0].values) {
            const columns = planetRes[0].columns;
            const rows = planetRes[0].values;
            context += "\n[PLANETARY TOTALITY MATRIX (D1, D9, D10, D60, KP, STATUS, TRANSITS, FACE/PALM)]\n";
            context += "Format: Row per Planet. Columns contain aggregated data.\n";
            rows.forEach((row: any[]) => {
                context += `\n--- PLANET: ${row[0]} ---\n`;
                for (let i = 1; i < columns.length; i++) {
                    const val = row[i];
                    if (val !== null && val !== '-' && val !== 0 && val !== '0') context += `${columns[i]}: ${val} | `;
                }
                context += "\n";
            });
        }
        const divTransform = getDivisionalPromptPlacements(db);
        if (divTransform.length > 0) {
            context +=
                "\n[DIVISIONAL_TRANSFORMATION_LAYER — SHODASHVARGA_ALL_16_JSON]\n";
            context +=
                "Charts included: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60. " +
                "Structured rows: { planet, chart, house_id, sign_name, avastha }. " +
                "sign_name is sidereal rashi (mapRashi); house_id is bhava arena — not the same index.\n";
            context += `${JSON.stringify(divTransform, null, 2)}\n`;
        }
        const divChartRes = db.exec("SELECT chart_name, planet, sign, house, degree, status FROM divisional_charts ORDER BY chart_name, planet");
        if (divChartRes.length > 0 && divChartRes[0].values) {
            context += "\n[ALL DIVISIONAL CHARTS (D1 to D60)]\n";
            let currentChart = "";
            divChartRes[0].values.forEach((row: any[]) => {
                if (currentChart !== row[0]) { currentChart = row[0]; context += `\n--- CHART: ${currentChart} ---\n`; }
                context += `${row[1]}: Sign=${row[2]}, House=${row[3]}, Degree=${row[4]}, Status=${row[5]}\n`;
            });
        }
        const palmRes = db.exec("SELECT feature_category, feature_name, condition_desc, indication FROM palm_analysis");
        if (palmRes.length > 0 && palmRes[0].values) {
            context += "\n[HASTASAMMUDRIKA (PALM ANALYSIS) DATA - MICRO SCAN]\n";
            context += "Use this to validate or challenge Astrological Findings.\n";
            context += "**NOTE: Cross-reference these biological markers with the D1/D9 Chart promises.**\n";
            palmRes[0].values.forEach((row: any[]) => { context += `${row[0]} - ${row[1]}: ${row[2]} (Indication: ${row[3]})\n`; });
        }
        const chalitRes = db.exec("SELECT house, sign, planets_in_bhava, start_degree FROM chalit_bhava");
        if (chalitRes.length > 0 && chalitRes[0].values) {
            context += "\n[BHAVA CHALIT CHART (Real Placement & Cusps)]\n";
            context += "Note: Verify if a planet has shifted houses here compared to D1. 'Start Degree' is Bhava Sandhi.\n";
            chalitRes[0].values.forEach((row: any[]) => { context += `House ${row[0]} (${row[1]}): ${row[2]} [Start/Sandhi: ${row[3]}]\n`; });
        }
        const kpCuspRes = db.exec("SELECT cusp, degree, sign, nak_lord, sub_lord, sub_sub_lord FROM kp_cusps");
        if (kpCuspRes.length > 0 && kpCuspRes[0].values) {
            context += "\n[KP_SYSTEM_DATA (CUSPS)]\n";
            context += "Use the SUB LORD to determine the promise of the event.\n";
            kpCuspRes[0].values.forEach((row: any[]) => { context += `Cusp ${row[0]} (${row[2]}): ${row[1]}, Sub Lord: ${row[3]}\n`; });
        }
        const kpSigRes = db.exec("SELECT planet, star_lord, sub_lord, significator_houses FROM kp_significators");
        if (kpSigRes.length > 0 && kpSigRes[0].values) {
            context += "\n[KP_SYSTEM_DATA (PLANET SIGNIFIERS)]\n";
            context += "Planet Source -> Star Lord Result -> Sub Lord Quality. 'Sig Houses' is the result of A-D Level signification.\n";
            kpSigRes[0].values.forEach((row: any[]) => { context += `Planet: ${row[0]} | Star: ${row[1]} | Sub: ${row[2]} | Sig Houses: ${row[3]}\n`; });
        }
        const dashaRes = db.exec("SELECT system, period_name, end_date, is_sandhi FROM dashas");
        if (dashaRes.length > 0 && dashaRes[0].values) {
            const dashas = dashaRes[0].values;
            const vim = dashas.filter((d: any[]) => d[0] === 'Vimshottari');
            if (vim.length > 0) {
                context += "\n[VIMSHOTTARI DASHA TIMELINE]\n";
                vim.forEach((row: any[]) => {
                    const isSandhi = row[3] === 1 ? " [⚠️ Dasha Sandhi]" : "";
                    context += `${row[1]} | Ends: ${row[2]}${isSandhi}\n`;
                });
            }
            const yogini = dashas.filter((d: any[]) => d[0] === 'Yogini');
            if (yogini.length > 0) {
                context += "\n[YOGINI_DASHA]\n";
                yogini.forEach((row: any[]) => context += `${row[1]} | Ends: ${row[2]}\n`);
            }
            const chara = dashas.filter((d: any[]) => d[0] === 'Chara (Jaimini)');
            if (chara.length > 0) {
                context += "\n[CHARA_DASHA (Jaimini)]\n";
                chara.forEach((row: any[]) => context += `${row[1]} | Ends: ${row[2]}\n`);
            }
        }
        const transitRes = db.exec("SELECT planet, sign, degree, retro FROM current_transits");
        if (transitRes.length > 0 && transitRes[0].values) {
            context += `\n[ACCURATE REAL-TIME GOCHAR (Calculated for ${new Date().toDateString()})]\n`;
            transitRes[0].values.forEach((row: any[]) => {
                const retro = row[3] === 1 ? '(Retrograde)' : '';
                context += `${row[0]}: ${row[1]} at ${row[2]} ${retro}\n`;
            });
        }
        if (includeKB) {
            const kbRes = db.exec("SELECT filename, content FROM knowledge_base");
            if (kbRes.length > 0 && kbRes[0].values) {
                context += "\n[REFERENCE KNOWLEDGE BASE - THE RULE BOOK]\n";
                context += "These are the mandatory rules you must follow for analysis.\n";
                kbRes[0].values.forEach((row: any[]) => { context += `\n--- SOURCE FILE: ${row[0]} ---\n${row[1]}\n`; });
            }
        }
    } catch (e) { console.error("Error generating virtual context from DB", e); }
    return context;
};

export const generateGodModeRules = (): string => ORACLE_RULES;

export const generateJapaneseCulturalRules = (): string => {
    return `
${ORACLE_RULES}

# 🌌 システムプロトコル: AATMABODHA [JAPANESE_MODE]

**アイデンティティ:** あなたは「アートマボーダ（Aatmabodha）」です。古代インド占星術（ジョーティッシュ）の深遠なロジックを、現代の日本人の心に響く「日本の占い師（占い師、霊能者）」の言葉で翻訳する存在です。

**文化的な翻訳のルール (重要):**
提供されたデータはインド占星術（Vedic Astrology）のものですが、あなたはそれを**日本の文化的文脈**で解釈しなければなりません。

1.  **用語の変換:**
    *   **Dharma (法)** -> **生きがい (Ikigai)**、**天命 (Tenmei)**、または**道 (Michi)**。
    *   **Karma (業)** -> **運命 (Unmei)**、**宿命 (Shukumei)**、または**ご縁 (Go-en)**。
    *   **Remedies (処方)** -> マントラを唱える代わりに、**神社へのお参り (Omairi)**、**お守り (Omamori)**、**先祖供養 (Senzo Kuyo)**、**盛り塩**、または**禅 (Zen)**的なマインドセットを提案してください。
    *   **Saturn (土星)** -> 「厳しい教師」や「試練 (Shiren)」を与える存在として描写。厄年 (Yakudoshi) の概念に関連付けて説明しても良い。
    *   **Rahu/Ketu** -> 「ドラゴンの頭/尾」や「過去世からの因縁」として神秘的に説明。

2.  **トーンとマナー:**
    *   **敬語 (Keigo):** 丁寧で、落ち着きがあり、少し神秘的なトーン（丁寧語・謙譲語・尊敬語を適切に）。
    *   **共感 (Kyokan):** 相手の痛みに寄り添う。「大変でしたね」「お疲れ様です」などの労いの言葉を自然に使う。
    *   **和の心:** 自然、季節、調和（和）を重んじる比喩を使う。

3.  **解釈のフレームワーク:**
    *   インド占星術の厳密な計算（D1, D9, KPなど）は**そのまま使用**しますが、出力は日本人が直感的に理解できる形にします。

4.  **ゼロ・トレランス (絶対厳守):**
    *   「～の傾向が強く出ています」「～に注意が必要です」という表現を使って、厳しい真実を柔らかく伝えてください。

**システム動作:**
提供されたデータベース（JSONコンテキスト）の惑星配置に基づき、日本の占い師として振る舞ってください。
`;
};

export const generateHindiCulturalRules = (): string => {
    return `
${ORACLE_RULES}

# 🌌 सिस्टम प्रोटोकॉल: AATMABODHA [HINDI_MODE]

**पहचान:** आप «आत्मबोध» हैं। आप ज्योतिष की गणना और संकेतों को हिंदी में स्पष्ट, सम्मानजनक और सांस्कृतिक रूप से उपयुक्त भाषा में व्यक्त करते हैं।

**नियम:**
- दिए गए डेटाबेस (JSON संदर्भ) में ग्रह स्थितियों का ही उपयोग करें; अनुमान लगाकर लग्न या डाशा न बनाएँ।
- धर्म, कर्म, उपाय आदि को भारतीय संदर्भ में समझाएँ; उपाय को व्यावहारिक और संवेदनशील रखें।
- टोन: गर्मजोशी, सम्मान, स्पष्टता — कठोर सत्य को कोमल शब्दों में।

**संचालन:** केवल प्रदत्त कुंडली डेटा के आधार पर उत्तर दें।
`;
};

export const generateDynamicCulturalRules = (language: string): string => {
    return `
${ORACLE_RULES}

# 🌌 SYSTEM PROTOCOL: AATMABODHA [LOCALIZED_MODE]

**LANGUAGE TARGET:** Respond primarily in **${language}** while preserving exact Vedic technical terms where clarity requires (you may briefly gloss them in ${language}).

**Rules:**
- Use only chart data from the provided JSON context; do not invent placements or dasha boundaries.
- Match tone and idioms to native speakers of ${language}; stay respectful and non-alarmist.
`;
};

export const getSystemInstruction = (
    db: any,
    language: string,
    userName: string,
    cultureMode: 'EN' | 'JP' | 'HI' = 'EN',
): { systemInstruction: string; initialGreeting: string } => {
    const baseRules = generateGodModeRules();

    const systemInstruction = `
<HYPER_COGNITIVE_ENGINE>
${baseRules}

## TOKEN_EFFICIENCY_PROTOCOL (MANDATORY)
- **ZERO REPETITION:** Absolutely ban separate [REFERENCES], [SOUL MATRIX], or [DATA AUDIT] blocks.
- **INTEGRATED PROOF:** Weave all technical data (e.g., Mar:H2|D9:H10|SAV:33.00) naturally into the prose.
- **METAPHOR REFRESH:** Do not repeat analogies like 'Dronacharya', 'Bheeshma', or 'Karna' if they appear in recent history.
- **DECIMAL LOCK:** Use exactly 2 decimal places for all numerical scores and ratios.

## RESPONSE_STRUCTURE (ORACLE FLOW)
1. **The Hook:** Warm Empathy / Sanskrit Shloka paired with user name (${userName}).
2. **The Analogy:** Core revelation through a fresh, non-repetitive spiritual or technical metaphor.
3. **The Timing:** Three distinct probability windows (High/Mid/Low) with integrated dasha/transit logic.
4. **The Remedy:** Practical action + Citation of source (BPHS, Gita, etc.).
5. **The Follow-up:** A single, high-IQ philosophical or strategic question.

LANGUAGE MODE: ${language}.
</HYPER_COGNITIVE_ENGINE>
    `;
    return {
        systemInstruction,
        initialGreeting: `Om Tat Sat. Data calibrated. Ask boldly, ${userName}.`,
    };
};

// ─────────────────────────────────────────────────────────────
// Chat Session — returns a mock chat object that maintains
// history locally and calls Flask on each sendMessage()
// ─────────────────────────────────────────────────────────────
export const createChatSession = async (db: any, language: string, cultureMode: 'EN' | 'JP' | 'HI' = 'EN'): Promise<any> => {
    const context = generateCompactOneLiner(db);
    const natalFingerprint = await computeNatalContextFingerprint(db);
    setActiveOracleNatalFingerprint(natalFingerprint);
    const userName = resolveOracleUserDisplayName();
    const { systemInstruction, initialGreeting } = getSystemInstruction(db, language, userName, cultureMode);

    // Load warm history from localStorage (scoped per chart fingerprint)
    const chatHistory: { role: 'user' | 'model'; text: string }[] = [];
    try {
        const scopedKey = getVedicChatHistoryStorageKey();
        const savedRaw =
            typeof window !== "undefined"
                ? localStorage.getItem(scopedKey) || localStorage.getItem("vedicChatHistory")
                : null;
        if (savedRaw) {
            const saved: { role: string; text: string }[] = JSON.parse(savedRaw);
            const recent = saved
                .filter((m) => m.role === "user" || (m.role === "model" && m.text !== initialGreeting))
                .slice(-10);
            recent.forEach((m) => {
                const cleanText = m.text.replace(/\n\n---\n\*Model:.*$/s, "").trim();
                if (cleanText.length > 10) {
                    chatHistory.push({
                        role: m.role as "user" | "model",
                        text: cleanText.slice(0, 800),
                    });
                }
            });
        }
    } catch (e) {
        console.warn("Could not load warm history", e);
    }

    const sessionObj = {
        _history: chatHistory,
        _systemInstruction: systemInstruction,
        _context: context,
        _natalFingerprint: natalFingerprint,

        clearHistory() {
            clearOracleChatRamAndDisk();
        },

        sendMessage: async function (userMessage: string, userQuestion?: string) {
            const userCtx = localStorage.getItem('userContext');
            const ctx = userCtx ? JSON.parse(userCtx) : {};

            const lang = ctx.preferredLanguage || 'Hinglish';
            const loc = typeof ctx.presentCity === 'string' && ctx.presentCity.trim() ? ctx.presentCity.trim() : '';
            const seeking = typeof ctx.whySeeking === 'string' && ctx.whySeeking.trim() ? ctx.whySeeking.trim().slice(0, 1900) : '';
            const focus =
              Array.isArray(ctx.focusAreas) && ctx.focusAreas.length
                ? ctx.focusAreas.filter((x: unknown) => typeof x === 'string').join(', ')
                : '';
            const astro = ctx.astroLevel === 'beginner' || ctx.astroLevel === 'moderate' || ctx.astroLevel === 'advanced' ? ctx.astroLevel : 'moderate';

            const lines: string[] = [];
            lines.push(`USER_LANGUAGE: ${lang}`);
            if (loc) lines.push(`USER_CURRENT_LOCATION: ${loc}`);
            if (seeking) lines.push(`USER_SEEKING: ${seeking}`);
            if (focus) lines.push(`USER_FOCUS_AREAS: ${focus}`);
            lines.push(`USER_ASTRO_LEVEL: ${astro}`);
            const sessionMemory = loadSessionMemory(resolveMemoryUserIdFromStorage());
            const quotaRemaining = getUserQuotaRemainingFromAuth();
            const quotaBlock = `\n[QUOTA_REMAINING] = ${quotaRemaining}\n`;
            const contextPrefix = `${lines.join("\n")}\n${sessionMemory ? sessionMemory + "\n" : ""}${quotaBlock}\n`;

            const fullPrompt = contextPrefix + userMessage;

            const out = await callGeminiChat(
                this._systemInstruction,
                this._history.slice(-3),
                fullPrompt,
                userQuestion,
                this._natalFingerprint,
            );
            const responseText = out.error ? out.error : out.text;

            // Append to local history
            this._history.push({ role: 'user', text: fullPrompt });
            this._history.push({ role: 'model', text: responseText });

            // Return same shape as original SDK response (optional `error` for UI)
            return {
                text: responseText,
                ...(out.error ? { error: out.error } : {}),
                candidates: [{ content: { parts: [{ text: responseText }] } }],
            };
        },
    };

    activeGeminiChatSession = sessionObj;
    attachGeminiWindowApi();
    return sessionObj;
};

// ─────────────────────────────────────────────────────────────
// Generate Cosmic Image
// ─────────────────────────────────────────────────────────────
export const generateCosmicImage = async (prompt: string, userPhoto?: string, userAge?: string): Promise<string | undefined> => {
    try {
        const fullPrompt = `Photorealistic portrait. Cinematic lighting. ${prompt}. High Definition, mystical atmosphere. Age: ${userAge || 'ageless'}.`;
        const imageParts: { mimeType: string; data: string }[] = [];

        if (userPhoto) {
            const { mimeType, data } = processBase64Image(userPhoto);
            imageParts.push({ mimeType, data });
        }

        const res = await fetch(`${BACKEND_URL}/api/gemini-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: GEMINI_MODEL,
                prompt: fullPrompt + (userPhoto ? " STRICT: Maintain exact ETHNICITY/FACE from reference." : ""),
                imageParts,
            }),
        });

        if (!res.ok) return undefined;
        const data = await res.json();
        return data.imageBase64 ? `data:${data.mimeType};base64,${data.imageBase64}` : undefined;
    } catch (e) {
        console.error("Image gen failed", e);
        return undefined;
    }
};

// ─────────────────────────────────────────────────────────────
// Generate Life Book AI
// ─────────────────────────────────────────────────────────────
export const generateLifeBookAI = async (
    db: any,
    profileName?: string,
    language: string = "EN",
): Promise<BookChapter[] | undefined> => {
    const context = generateVirtualFileContext(db, false);
    const prompt = `Based on this chart, write the "Book of Life". Divide the life into 5-7 distinct chapters based on Dasha periods and major transits. 
    For each chapter, provide:
    1. Chapter Title (Creative)
    2. Time Period (Year range & Age)
    3. Narrative (The story of this phase, emotional and material)
    4. Visual Prompt (For an AI image generator to depict this phase, portrait style)
    5. Age Context (e.g. "Childhood", "Youth", "Mid-life")
    
    Output JSON Array of objects: [{ "chapter": 1, "title": "...", "timePeriod": "...", "narrative": "...", "visualPrompt": "...", "ageContext": "..." }, ...]`;

    try {
        const text = await callGemini("CONTEXT:\n" + context + "\n\nTASK:\n" + prompt, "json");
        if (text) {
            const parsed = JSON.parse(text);
            postReportLog({
                profileName: profileName ?? "Profile",
                reportType: "life_book",
                contentValue: parsed,
                language,
            });
            return parsed;
        }
    } catch (e) { console.error(e); }
    return undefined;
};

// ─────────────────────────────────────────────────────────────
// Birth Time Rectification
// ─────────────────────────────────────────────────────────────
export const generateBirthTimeRectification = async (
    db: any,
    photo?: string | null,
    palm?: string | null,
    profileName?: string,
    language: string = "EN",
): Promise<RectificationResult | undefined> => {
    const context = generateVirtualFileContext(db, false);
    const imageParts: { mimeType: string; data: string }[] = [];

    let promptExtra = "";
    if (photo) {
        const p = processBase64Image(photo);
        imageParts.push({ mimeType: p.mimeType, data: p.data });
        promptExtra += "\nUse the attached Face Photo to correlate Ascendant features.";
    }
    if (palm) {
        const p = processBase64Image(palm);
        imageParts.push({ mimeType: p.mimeType, data: p.data });
        promptExtra += "\nUse the attached Palm Photo to correlate Life/Fate lines with Dasha events.";
    }

    const prompt = `CONTEXT:\n${context}${promptExtra}

Perform Birth Time Rectification (BTR). 
1. Analyze consistency between the Chart and the Biometrics (if provided).
2. If no biometrics, analyze internal consistency of D1/D9.
3. Generate a Confidence Score (0-100).
4. Provide a Verdict (Is the time likely correct?).
5. Generate 3 specific "Rectification Questions" to ask the user to distinguish this chart from +/- 2 hours lagna shift.

Output JSON: { "confidenceScore": number, "verdict": "string", "visualMatchAnalysis": "string", "palmMatchAnalysis": "string", "rectificationQuestions": [{ "question": "...", "optionA": "...", "optionB": "...", "reasoning": "..." }] }`;

    try {
        const text = await callGemini(prompt, "json", imageParts.length > 0 ? imageParts : undefined);
        if (text) {
            const parsed = JSON.parse(text);
            postReportLog({
                profileName: profileName ?? "Profile",
                reportType: "btr",
                contentValue: parsed,
                language,
            });
            return parsed;
        }
    } catch (e) { console.error(e); }
    return undefined;
};

// ─────────────────────────────────────────────────────────────
// Advanced BTR Step
// ─────────────────────────────────────────────────────────────
export const runAdvancedBTRStep = async (db: any, step: string, history: any[]): Promise<any> => {
    const context = generateVirtualFileContext(db, false);
    const historyText = history.map(h => `Step ${h.step}: User selected "${h.choice.label}"`).join("\n");

    const prompt = `
CONTEXT:
${context}

PREVIOUS BTR STEPS:
${historyText}

CURRENT STEP: ${step}

TASK: 
If STEP is "FINAL", synthesize all history and chart data to give a final rectified time verdict and analysis.
If STEP is a Chart (D1, D9, KP, etc.), generate an analysis of that chart's role in time accuracy and provide 3 distinct options (scenarios) for the user to verify. One option should match the current chart time. Others should be shifted variations.

Output JSON:
If FINAL: { "finalVerdict": "...", "analysis": "..." }
If STEP: { "analysis": "...", "confidence": number, "options": [{ "id": "curr", "label": "...", "description": "...", "timeAdjustment": "None", "questions": ["q1", "q2"] }, { "id": "opt2", ... }] }
`;

    try {
        const text = await callGemini(prompt, "json");
        if (text) return JSON.parse(text);
    } catch (e) { console.error(e); }
    return undefined;
};

// ─────────────────────────────────────────────────────────────
// Generate Chart from Birth Details with AI
// ─────────────────────────────────────────────────────────────
export const generateChartFromBirthDetailsWithAI = async (
    dob: string,
    tob: string,
    lat: string,
    lon: string,
    timezone: number,
    culture: 'EN' | 'JP' | 'HI'
): Promise<any | null> => {
    const prompt = `
You are a Vedic Astrology Calculation Engine. 
The primary astrology API is currently down, so you must calculate the astrological chart based on the following birth details.

**Input Data:**
Date of Birth: ${dob}
Time of Birth: ${tob}
Timezone Offset: ${timezone}
Latitude: ${lat}
Longitude: ${lon}

**Required Output:**
A complete JSON object matching the raw API response format.
This includes:
1. "D1": An array of planets for the D1 chart. Each object should have { planet, sign, degree, isRetro }.
2. "D9": An array of planets for the D9 chart.
3. "charts": An array of other divisional charts if possible.
4. "VD": Vimshottari Dasha periods.
5. "ATPT": Ashtakvarga and other metrics.

Use standard Vedic Astrology formulas (Parashari system) for all calculations.
Ensure the output is valid JSON.
The response should be in ${culture === 'HI' ? 'Hindi' : culture === 'JP' ? 'Japanese' : 'English'}.
`;

    try {
        const text = await callGemini(prompt, "json");
        if (text) return JSON.parse(text);
    } catch (e) { console.error("AI Chart Generation failed", e); }
    return null;
};

// ─────────────────────────────────────────────────────────────
// Recalculate Astrology Data
// ─────────────────────────────────────────────────────────────
export const recalculateAstrologyData = async (
    planets: any[],
    lagna: any,
    culture: 'EN' | 'JP' | 'HI'
): Promise<AnalysisResult | null> => {
    const prompt = `
You are a Vedic Astrology Calculation Engine. 
Based on the following planetary positions (D1 Rashi Chart), recalculate the entire astrological profile.

**Input Data:**
Lagna: ${JSON.stringify(lagna)}
Planets: ${JSON.stringify(planets)}

**Required Output:**
A complete JSON object matching the "AnalysisResult" interface.
This includes:
1.  "summary": A brief 2-3 sentence summary of the chart.
2.  "charts": An array of ChartData objects (D1, D9, D10, D60).
3.  "dashas": An array of DashaSystem objects (Vimshottari, Yogini, Chara).
4.  "shadbala": An array of ShadbalaData objects.
5.  "kpSystem": A KPSystem object with cusps and planet significators.
6.  "ashtakvarga": A Record<string, number> for house points.
7.  "bhinnaAshtakvarga": A Record<string, Record<string, number>> for planet house points.
8.  "chalit": An array of ChalitRow objects.
9.  "planetShifts": An array of PlanetaryShift objects.
10. "elementalBalance": A Record<string, number>.
11. "ishtaDevata": string.
12. "bhriguBindu": string.
13. "willpowerScore": string.

Use standard Vedic Astrology formulas (Parashari system) for all calculations.
Ensure the output is valid JSON and strictly follows the schema.
The response should be in ${culture === 'HI' ? 'Hindi' : culture === 'JP' ? 'Japanese' : 'English'}.
`;

    try {
        const text = await callGemini(prompt, "json");
        if (text) return JSON.parse(text);
    } catch (e) { console.error("Recalculation failed", e); }
    return null;
};

// ─────────────────────────────────────────────────────────────
// Generate Hidden Gems AI
// ─────────────────────────────────────────────────────────────
export const generateHiddenGemsAI = async (
    db: any,
    profileName?: string,
    language: string = "EN",
): Promise<{strengths: Gem[], weaknesses: Gem[]}> => {
    const context = generateVirtualFileContext(db, false);
    const prompt = `Identify "Hidden Gems" (Strengths) and "Shadow Truths" (Weaknesses) in this chart. Focus on rare yogas, nakshatra secrets, and specific placements.
    Output JSON: { "strengths": [{ "id": "...", "type": "strength", "title": "...", "description": "...", "remedyTitle": "...", "remedy": "...", "tag": "...", "planet": "..." }], "weaknesses": [...] }`;

    try {
        const text = await callGemini("CONTEXT:\n" + context + "\n\nTASK:\n" + prompt, "json");
        if (text) {
            const parsed = JSON.parse(text);
            postReportLog({
                profileName: profileName ?? "Profile",
                reportType: "hidden_gems",
                contentValue: parsed,
                language,
            });
            return parsed;
        }
    } catch (e) { console.error(e); }
    return { strengths: [], weaknesses: [] };
};

// ─────────────────────────────────────────────────────────────
// Generate Daily Forecast
// ─────────────────────────────────────────────────────────────
export const generateDailyForecast = async (
    db: any,
    location: string,
    date: string,
    profileName?: string,
    language: string = "EN",
): Promise<any> => {
    const context = generateVirtualFileContext(db, false);
    const prompt = `Generate a detailed Daily Forecast for Date: ${date} and Location: ${location}.
    Use the provided chart to calculate Gochar (Transits) effects specifically for this person.
    
    ### CRITICAL CALCULATION CONSTRAINTS (ZERO TOLERANCE):
    1. **ZODIAC SYSTEM:** You must use the **SIDEREAL ZODIAC (Nirayana)**, NOT Tropical.
    2. **AYANAMSA:** Apply **'Lahiri Ayanamsa' (Chitra Paksha)**.
    3. **NODES (RAHU/KETU):** 
       - Use **TRUE NODES**.
       - **CALIBRATION CHECK:** In Feb 2026, Rahu MUST be in **AQUARIUS (Kumbha)**. If your output shows Rahu in Libra or Aries, your calculation logic is flawed.

    Include Panchang details (Tithi, Nakshatra).
    Output JSON: { 
      "panchang": { "tithi": "...", "nakshatra": "..." }, 
      "forecast": { "morning": "...", "afternoon": "...", "evening": "..." }, 
      "tips": { "luckyColor": "...", "luckyNumber": "...", "remedy": "..." },
      "transits": [{ "planet": "Sun", "currentSign": "...", "status": "Favorable/Neutral/Challenging", "relationToMoon": "..." }, ...] 
    }`;

    try {
        const text = await callGemini("CONTEXT:\n" + context + "\n\nTASK:\n" + prompt, "json");
        if (text) {
            const parsed = JSON.parse(text);
            postReportLog({
                profileName: profileName ?? "Profile",
                reportType: "daily_forecast",
                contentValue: parsed,
                language,
            });
            return parsed;
        }
    } catch (e) { console.error(e); }
    return null;
};

// ─────────────────────────────────────────────────────────────
// getExtraContext — Telegraphic Metadata Protocol (compact SQL lines, no API)
// ─────────────────────────────────────────────────────────────

const num = (v: unknown): string | number =>
    typeof v === "number" ? v.toFixed(2) : (v as string | number);

export const getExtraContext = (db: any, question: string): string => {
    if (!db) return "";
    const q = question.toLowerCase();

    const safeQuery = (sql: string): any[][] => {
        try {
            const res = db.exec(sql);
            return res?.[0]?.values || [];
        } catch {
            return [];
        }
    };

    // CORE ENGINE ANCHORS
    const futD = safeQuery(
        `SELECT period_name, end_date FROM dashas WHERE system='Vimshottari' AND substr(end_date,7,4)||'-'||substr(end_date,4,2)||'-'||substr(end_date,1,2) > date('now') LIMIT 5`,
    );
    const trans = safeQuery(`SELECT planet, sign, degree, retro FROM current_transits`);

    const dashaMap = futD.map((r) => `${r[0]}|${r[1]}`).join(";");
    const transMap = trans
        .map((r) => `${r[0]}:${r[1]}|${num(r[2])}${r[3] ? "R" : ""}`)
        .join(";");

    let extra = `\n[STATE] TODAY:${new Date().toISOString().split("T")[0]}\nMD_AD:${dashaMap}\nGOCHAR:${transMap}\n`;

    try {
        // CAREER & SUCCESS
        if (q.match(/career|job|business|naukri|success|promotion|work|office/)) {
            const d10 = safeQuery(`SELECT planet_name, D10_Dasamsa_house, D10_Dasamsa_status FROM planets`);
            const sav = safeQuery(
                `SELECT house_number, points FROM ashtakvarga_summary WHERE house_number IN (6,10,11)`,
            );
            const shad = safeQuery(
                `SELECT planet_name, shadbala_ratio FROM planets WHERE planet_name NOT IN ('Rahu','Ketu')`,
            );
            extra += `TOPIC:CAREER\nD10:${d10.map((r) => `${r[0]}:H${r[1]}|${r[2]}`).join(";")}\nSAV:${sav.map((r) => `H${r[0]}:${r[1]}`).join(";")}\nSHAD:${shad.map((r) => `${r[0]}:${num(r[1])}`).join(";")}`;
        }
        // MARRIAGE & RELATIONSHIPS
        else if (q.match(/marriage|love|relationship|partner|spouse|wife|husband/)) {
            const d9 = safeQuery(`SELECT planet_name, D9_Navamsha_house, D9_Navamsha_status FROM planets`);
            const venus = safeQuery(
                `SELECT planet_name, D1_Rashi_house, shadbala_ratio, Vargottama FROM planets WHERE planet_name='Venus'`,
            );
            extra += `TOPIC:MARRIAGE\nD9:${d9.map((r) => `${r[0]}:H${r[1]}|${r[2]}`).join(";")}\nVENUS:H${venus[0]?.[1]}|Shad:${num(venus[0]?.[2])}${venus[0]?.[3] ? "|Varg" : ""}`;
        }
        // WEALTH & ASSETS
        else if (q.match(/money|wealth|property|finance|car|investment|bank/)) {
            const d2 = safeQuery(`SELECT planet_name, D2_Hora_house, D2_Hora_status FROM planets`);
            const savW = safeQuery(`SELECT house_number, points FROM ashtakvarga_summary WHERE house_number IN (2,11)`);
            extra += `TOPIC:WEALTH\nD2:${d2.map((r) => `${r[0]}:H${r[1]}|${r[2]}`).join(";")}\nSAV:${savW.map((r) => `H${r[0]}:${r[1]}`).join(";")}`;
        }
        // FALLBACK / GENERAL
        else {
            const d1 = safeQuery(
                `SELECT planet_name, D1_Rashi_house, D1_Rashi_status, shadbala_ratio FROM planets WHERE planet_name != 'Lagna'`,
            );
            extra += `TOPIC:GENERAL\nD1:${d1.map((r) => `${r[0]}:H${r[1]}|${r[2]}|${num(r[3])}`).join(";")}`;
        }
    } catch (e) {
        console.warn("Telegraphic Refactor: context mapping failed", e);
    }

    return extra;
};

// ─────────────────────────────────────────────────────────────
// Stable natal fingerprint for server-side context-cache keys (no date / transits)
// ─────────────────────────────────────────────────────────────
export async function computeNatalContextFingerprint(db: any): Promise<string> {
    if (!db || typeof crypto === 'undefined' || !crypto.subtle) return '';
    const parts: string[] = [];
    try {
        const basic = db.exec('SELECT key, value FROM basic_details ORDER BY key');
        if (basic[0]?.values?.length) parts.push(JSON.stringify(basic[0].values));
        const avk = db.exec('SELECT key, value FROM avkahada_chakra ORDER BY key');
        if (avk[0]?.values?.length) parts.push(JSON.stringify(avk[0].values));
        const pers = db.exec('SELECT property, value FROM personal ORDER BY property');
        if (pers[0]?.values?.length) parts.push(JSON.stringify(pers[0].values));
        const pl = db.exec(
            `SELECT planet_name, D1_Rashi_house, D1_Rashi_sign, D1_Rashi_degree, D1_Rashi_nakshatra, D1_Rashi_pada
             FROM planets WHERE planet_name != 'Lagna' ORDER BY planet_name`,
        );
        if (pl[0]?.values?.length) parts.push(JSON.stringify(pl[0].values));
    } catch {
        return '';
    }
    const blob = parts.join('|');
    if (!blob) return '';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(blob));
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// ─────────────────────────────────────────────────────────────
// generateCompactOneLiner — unchanged, no API calls
// ─────────────────────────────────────────────────────────────
export const generateCompactOneLiner = (db: any): string => {
    if (!db) return "";
    try {
        const today = new Date().toISOString().split('T')[0];
        let lagna = "", rasi = "", nak = "", nakLord = "", gana = "", nadi = "", paya = "";
        const avkRes = db.exec("SELECT key, value FROM avkahada_chakra");
        if (avkRes.length > 0 && avkRes[0].values) {
            avkRes[0].values.forEach((row: any[]) => {
                const k = (row[0] || "").toLowerCase();
                const v = row[1] || "";
                if (k.includes('ascendant') || k.includes('lagna')) lagna = v;
                if (k === 'sign' || k.includes('rasi')) rasi = v;
                if (k === 'nakshatra' || k === 'birth star') nak = v;
                if (k.includes('nakshatra lord') || k.includes('star lord')) nakLord = v;
                if (k.includes('gana')) gana = v;
                if (k.includes('nadi')) nadi = v;
                if (k.includes('paya')) paya = v;
            });
        }
        const akRes = db.exec(`SELECT planet_name FROM planets WHERE D1_Rashi_jamini = 'Atmakaraka' LIMIT 1`);
        let akStr = akRes[0]?.values?.[0]?.[0] || "";
        if (!akStr) {
            const allPlanetsRes = db.exec(`SELECT planet_name, D1_Rashi_degree FROM planets WHERE planet_name NOT IN ('Lagna', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto')`);
            if (allPlanetsRes.length > 0 && allPlanetsRes[0].values) {
                let maxDeg = -1; let maxPlanet = "";
                allPlanetsRes[0].values.forEach((row: any[]) => {
                    const degStr = row[1] || "";
                    const parts = degStr.split('°');
                    if (parts.length > 0) {
                        const deg = parseInt(parts[0].trim(), 10) || 0;
                        const minParts = parts[1] ? parts[1].split("'") : [];
                        const min = minParts.length > 0 ? parseInt(minParts[0].trim(), 10) || 0 : 0;
                        const totalDeg = deg + (min / 60);
                        if (totalDeg > maxDeg) { maxDeg = totalDeg; maxPlanet = row[0]; }
                    }
                });
                akStr = maxPlanet;
            }
        }
        const pRes = db.exec(`SELECT planet_name, D1_Rashi_house, D1_Rashi_retro, D1_Rashi_avastha, D1_Rashi_pada, D1_Rashi_nakshatra, D1_Rashi_jamini, shadbala_ratio, D1_Rashi_sign, D1_Rashi_status, Co_Tenants, D1_Rashi_yogas, D1_Rashi_yoga_bhangas, D1_Rashi_lord, D1_Rashi_houses_owned, D1_Rashi_is_sandhi, Vargottama FROM planets WHERE planet_name != 'Lagna'`);
        const aspectRes = db.exec(`
    SELECT planet_name, Aspects 
    FROM planets 
    WHERE Aspects IS NOT NULL 
    AND Aspects != ''
    AND planet_name NOT IN ('Lagna')
  `);
        const aspectStr = aspectRes[0]?.values
            ?.map((r: any[]) => `${r[0]}→H${r[1]}`)
            .join(' | ') ?? '';
        let planetsStr = "";
        if (pRes.length > 0 && pRes[0].values) {
            planetsStr = pRes[0].values.map((r: any[]) => `${r[0]}:H${r[1]}(${r[8]||''})${r[2]?'R':''} ${r[9]||''} ${r[3]||''} Nak:${r[4]}-P${r[5]} Shad:${r[7]||''} JK:${r[6]||''}${r[10]?' WITH:'+r[10]:''}${r[11]?' YOGAS:'+r[11]:''}${r[12]&&r[12]!='No'?' YOGA_BHANGA:'+r[12]:''}${r[13]?' LORD:'+r[13]:''}${r[14]?' OWNS:H'+r[14]:''}${r[15]&&r[15]==1?' SANDHI':''}${r[16]&&r[16]==1?' VARGOTTAMA':''}`).join(' | ');
        }
        const shadRes = db.exec(`SELECT planet_name, shadbala_ratio, shadbala_classification FROM planets WHERE planet_name NOT IN ('Lagna','Rahu','Ketu') ORDER BY shadbala_ratio DESC`);
        const shadStr = shadRes[0]?.values?.map((r: any[]) => `${r[0]}:${r[1]}(${r[2]})`).join(' | ') || '';
        const avasthaRes = db.exec(`SELECT planet_name, D1_Rashi_avastha, D1_Rashi_is_combust FROM planets WHERE planet_name NOT IN ('Lagna','Rahu','Ketu')`);
        const avasthaStr = avasthaRes[0]?.values?.map((r: any[]) => `${r[0]}:${r[1]}${r[2]?'(Combust)':''}`).join(' | ') || '';
        const nbryRes = db.exec(`SELECT planet_name, D1_Rashi_status FROM planets WHERE D1_Rashi_nbry='Yes'`);
        const nbryStr = nbryRes[0]?.values?.map((r:any[]) => `${r[0]}(${r[1]}+NBRY)`).join(' | ') || "";
        const dRes = db.exec(`SELECT period_name, end_date FROM dashas WHERE system = 'Vimshottari' AND substr(end_date,7,4)||'-'||substr(end_date,4,2)||'-'||substr(end_date,1,2) > date('now') ORDER BY substr(end_date,7,4)||'-'||substr(end_date,4,2)||'-'||substr(end_date,1,2) ASC LIMIT 3`);
        let dashaStr = "";
        if (dRes.length > 0 && dRes[0].values?.length > 0) {
            const rows = dRes[0].values;
            const ad = rows[0]; const pd = rows.length > 1 ? rows[1] : null;
            dashaStr = `${ad[0]} ends:${ad[1]}`;
            if (pd) dashaStr += ` | PD:${pd[0]} ends:${pd[1]}`;
        }
        const savRes = db.exec("SELECT house_number, points FROM ashtakvarga_summary ORDER BY house_number");
        const bavRes = db.exec(`
    SELECT planet, house_number, points
    FROM bhinna_ashtakvarga
    WHERE planet IN 
    ('Jupiter','Saturn','Mars','Sun','Moon',
    'Mercury','Venus')
    ORDER BY planet, house_number
  `);
        const bavGrouped: Record<string, string[]> = {};
        if (bavRes.length > 0 && bavRes[0].values) {
            bavRes[0].values.forEach((r: any[]) => {
                if (!bavGrouped[r[0]]) bavGrouped[r[0]] = [];
                bavGrouped[r[0]].push(`H${r[1]}:${r[2]}`);
            });
        }
        const bavStr = Object.entries(bavGrouped)
            .map(([p, v]) => `${p}[${v.join(',')}]`)
            .join(' | ');
        let savStr = "";
        if (savRes.length > 0 && savRes[0].values) savStr = savRes[0].values.map((r: any[]) => `H${r[0]}:${r[1]}`).join(' ');
        const wpRes = db.exec(`SELECT value FROM special_points WHERE point_name LIKE '%Willpower%' OR point_name LIKE '%Will Power%' LIMIT 1`);
        const wpStr = wpRes[0]?.values?.[0]?.[0] || "";
        const bbRes = db.exec(`SELECT value FROM special_points WHERE point_name LIKE '%Bhrigu%' LIMIT 1`);
        const bbStr = bbRes[0]?.values?.[0]?.[0] || '';

        const idRes = db.exec(`SELECT value FROM special_points WHERE point_name LIKE '%Ishta%' OR point_name LIKE '%ishta%' LIMIT 1`);
        const idStr = idRes[0]?.values?.[0]?.[0] || '';

        const chalitRes = db.exec(`SELECT planet, from_house_d1, to_house_chalit FROM planet_shifts`);
        const chalitStr = chalitRes[0]?.values?.map((r:any[]) => `${r[0]}:H${r[1]}→H${r[2]}`).join(' | ') || "";
        const fpRes = db.exec("SELECT key, value FROM favourable_points");
        let luckyNum = "", luckyDays = "", luckyStone = "", luckyMetal = "";
        if (fpRes.length > 0 && fpRes[0].values) {
            fpRes[0].values.forEach((row: any[]) => {
                const k = (row[0] || "").toLowerCase(); const v = row[1] || "";
                if (k.includes('number')) luckyNum = v;
                if (k.includes('day')) luckyDays = v;
                if (k.includes('stone')) luckyStone = v;
                if (k.includes('metal')) luckyMetal = v;
            });
        }
        const ghRes = db.exec("SELECT key, value FROM ghatak");
        let badDay = "", badNak = "", badPlanets = "";
        if (ghRes.length > 0 && ghRes[0].values) {
            ghRes[0].values.forEach((row: any[]) => {
                const k = (row[0] || "").toLowerCase(); const v = row[1] || "";
                if (k.includes('day')) badDay = v;
                if (k.includes('nakshatra')) badNak = v;
                if (k.includes('planet')) badPlanets = v;
            });
        }
        const tRes = db.exec(
            "SELECT planet, sign FROM current_transits"
        );
        const transitBavRes = db.exec(`
    SELECT ct.planet, ct.sign,
           ba.house_number, ba.points
    FROM current_transits ct
    LEFT JOIN bhinna_ashtakvarga ba
    ON ct.planet = ba.planet
    ORDER BY ct.planet, ba.house_number
  `);
        const transitBavMap: Record<string, string[]> = {};
        if (transitBavRes.length > 0 &&
            transitBavRes[0].values) {
            transitBavRes[0].values.forEach((r: any[]) => {
                if (!transitBavMap[r[0]])
                    transitBavMap[r[0]] = [];
                if (r[2] != null)
                    transitBavMap[r[0]].push(
                        `H${r[2]}:${r[3]}${Number(r[3]) >= 4 ? '✓' : ''}`
                    );
            });
        }
        let transitsStr = "";
        if (tRes.length > 0 && tRes[0].values) transitsStr = tRes[0].values.map((r: any[]) => `${r[0]}:${r[1]}`).join(' | ');
        const transitBavStr = Object.entries(transitBavMap)
            .map(([p, v]) => `${p}[${v.join(',')}]`)
            .join(' | ');
        console.log("TRANSITS CHECK:", transitsStr);
        const divisionalPlacements = getDivisionalPromptPlacements(db);
        const divisionalJsonPretty =
            divisionalPlacements.length > 0
                ? `\nSHODASHVARGA_16CHARTS_JSON (D1,D2,D3,D4,D7,D9,D10,D12,D16,D20,D24,D27,D30,D40,D45,D60 — planet×chart rows; house_id=bhava, sign_name=sidereal sign):\n${JSON.stringify(divisionalPlacements, null, 2)}\n`
                : "";
        return `Today:[${today}]\nTRANSITS: ${transitsStr}\nTRANSIT_BAV(planet BAV in all houses, ✓=≥4 delivers): ${transitBavStr}\nLagna:[${lagna}] Rasi:[${rasi}] Nak:[${nak}] NakLord:[${nakLord}]\nGana:[${gana}] Nadi:[${nadi}] Paya:[${paya}] AK:${akStr}${divisionalJsonPretty}PLANETS: ${planetsStr}\nSHADBHALA: ${shadStr}\nAVASTHA: ${avasthaStr}\nDASHA: ${dashaStr}\nSAV: ${savStr}\nBAV(planet-house scores,≥4=delivers): ${bavStr}\nWILLPOWER_SCORE: ${wpStr}\n(Formula: 3rdHouseSAV×0.5 + 1.5×MarsShadbala.\n>18.50=strong free will overrides fate |\n12-18.50=mixed | <12=fate dominant)\nBHRIGU_BINDU: ${bbStr}\nISHTA_DEVATA: ${idStr}\nASPECTS(planet→houses_aspected): ${aspectStr}\nFP: Lucky#[${luckyNum}] Days:[${luckyDays}] Stone:[${luckyStone}] Metal:[${luckyMetal}]\nGH: BadDay:[${badDay}] BadNak:[${badNak}] BadPlanets:[${badPlanets}]\nCHALIT_SHIFTS:${chalitStr}\nNBRY_CANCELLED:${nbryStr}`;
    } catch (e) {
        console.error("Error generating compact one liner", e);
        return "";
    }
};