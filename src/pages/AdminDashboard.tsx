import { useState, useEffect, useMemo, useCallback, Fragment, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  buildAnalysisResultFromChartJson,
  convertToISTForAPI,
  fetchAnalysisForProfile,
} from '../../services/chartFromProfile';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar as ChartJsBar, Line, Pie, Chart } from 'react-chartjs-2';
import AdminReportsHub from './AdminReportsHub';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';

const LS_ADMIN_ACTIVE_PROFILE = 'adminActiveProfile';
const LS_ADMIN_PROFILE_DIRECTORY = 'adminProfileDirectory';
const LS_ACTIVE_ORACLE_DB = 'activeOracleDB';
const LS_ADMIN_QUICK_CHART = 'adminQuickChart';

function uint8ToBase64(u8: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(binary);
}

function readAdminDirectory(): any[] {
  try {
    const raw = localStorage.getItem(LS_ADMIN_PROFILE_DIRECTORY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAdminDirectory(entries: any[]) {
  localStorage.setItem(LS_ADMIN_PROFILE_DIRECTORY, JSON.stringify(entries));
}

const USD_TO_INR = 92.47;
const GOLD = '#c9a96e';
const BG = '#0a0a0f';
const CARD = '#12121a';
const BORDER = '#2a2a38';

const qcInput: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: '#111',
  color: '#eee',
};

const qcBtn: CSSProperties = {
  background: '#1a1a3e',
  color: GOLD,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 13,
};

function formatAudTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  CAREER: '#378ADD',
  MARRIAGE: '#D4537E',
  HEALTH: '#639922',
  WEALTH: '#BA7517',
  PROPERTY: '#7F77DD',
  CHILDREN: '#1D9E75',
  TRAVEL: '#5DCAA5',
  SPIRITUAL: '#D85A30',
  PERSONALITY: '#534AB7',
  TIMING: '#888780',
  GENERAL: '#444441',
  VEHICLE: '#5B8FC7',
};

const ANALYTICS_CATEGORIES = [
  'CAREER',
  'MARRIAGE',
  'HEALTH',
  'WEALTH',
  'PROPERTY',
  'CHILDREN',
  'TRAVEL',
  'SPIRITUAL',
  'PERSONALITY',
  'TIMING',
  'GENERAL',
] as const;

const INTENT_KEYS = ['ANXIETY', 'AMBITION', 'VALIDATION', 'CURIOSITY', 'CRISIS', 'PLANNING', 'GENERAL'] as const;
const TONE_KEYS = ['URGENT', 'CALM', 'CONFUSED', 'HOPEFUL', 'DESPERATE', 'NEUTRAL'] as const;

type StatsLog = {
  userHash?: string;
  questionCategory?: string | null;
  questionIntent?: string | null;
  emotionalTone?: string | null;
  language?: string | null;
  cacheHit?: boolean;
  costUsd?: number;
  createdAt?: string | Date;
  sessionDepth?: number | null;
  sessionId?: string | null;
  dashaAtTime?: string | null;
  moonSignAtTime?: string | null;
  userMoonSign?: string | null;
  userLagna?: string | null;
  userAtmakaraka?: string | null;
  userSadeSati?: boolean | null;
  userDashaType?: string | null;
  ageGroup?: string | null;
  returnedAfterDays?: number | null;
  prevCategory?: string | null;
};

function normalizeLogs(stats: any): StatsLog[] {
  const raw = stats?.logs;
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any) => ({
    userHash: r.userHash,
    questionCategory: r.questionCategory ?? null,
    questionIntent: r.questionIntent ?? null,
    emotionalTone: r.emotionalTone ?? null,
    language: r.language ?? 'EN',
    cacheHit: Boolean(r.cacheHit),
    costUsd: typeof r.costUsd === 'number' ? r.costUsd : parseFloat(String(r.costUsd ?? 0)) || 0,
    createdAt: r.createdAt,
    sessionDepth: r.sessionDepth ?? null,
    sessionId: r.sessionId ?? null,
    dashaAtTime: r.dashaAtTime ?? null,
    moonSignAtTime: r.moonSignAtTime ?? null,
    userMoonSign: (r as any).userMoonSign ?? null,
    userLagna: (r as any).userLagna ?? null,
    userAtmakaraka: (r as any).userAtmakaraka ?? null,
    userSadeSati: (r as any).userSadeSati ?? null,
    userDashaType: (r as any).userDashaType ?? null,
    ageGroup: (r as any).ageGroup ?? null,
    returnedAfterDays: (r as any).returnedAfterDays ?? null,
    prevCategory: (r as any).prevCategory ?? null,
  }));
}

function bucketLanguage(code: string | null | undefined): string {
  const c = (code || 'EN').trim();
  const u = c.toUpperCase();
  if (u === 'EN' || u === 'ENGLISH') return 'English';
  if (u === 'HI' || u === 'HINDI') return 'Hindi';
  if (u === 'HINGLISH' || u === 'HI-EN') return 'Hinglish';
  if (u === 'JP' || u === 'JAPANESE') return 'Japanese';
  return 'Regional / Other';
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function buildAnalyticsModel(stats: any, users: any[]) {
  const logs = normalizeLogs(stats);
  const USD_TO_INR_LOCAL = 83;
  const todayCostInr = Number(stats?.todayCostUsd ?? 0) * USD_TO_INR_LOCAL;
  const weekCostInr = Number(stats?.weekCostUsd ?? 0) * USD_TO_INR_LOCAL;
  const monthCostInr = Number(stats?.monthCostUsd ?? 0) * USD_TO_INR_LOCAL;
  const todayQueries = Number(stats?.todayQueries ?? 0);
  const peakHoursDataRaw: { hour: number; total: number; distressed: number }[] = Array.isArray(stats?.peakHours)
    ? stats.peakHours
    : [];
  const peakByHour = new Map<number, { hour: number; total: number; distressed: number }>();
  for (const r of peakHoursDataRaw) {
    const h = Number(r.hour);
    peakByHour.set(h, {
      hour: h,
      total: Number(r.total) || 0,
      distressed: Number(r.distressed) || 0,
    });
  }
  const peakHoursData = Array.from({ length: 24 }, (_, h) => peakByHour.get(h) ?? { hour: h, total: 0, distressed: 0 });
  const returnedDist: { days: number; cnt: number }[] = Array.isArray(stats?.returnedDist) ? stats.returnedDist : [];
  const newUsers = logs.filter((r) => r.returnedAfterDays === 0 || r.returnedAfterDays == null).length;
  const returningUsers = logs.filter((r) => r.returnedAfterDays != null && r.returnedAfterDays > 0).length;

  const totalQuestions = Number(stats?.totalQuestions ?? 0);
  const totalCostUsd = Number(stats?.totalCost ?? 0);
  const cacheHits = Number(stats?.cacheHits ?? 0);
  const avgCostUsd = Number(stats?.avgCostPerQuestion ?? 0);
  const totalCostInr = totalCostUsd * USD_TO_INR;
  const avgCostInr = avgCostUsd * USD_TO_INR;
  const cacheHitRatePct = totalQuestions > 0 ? (cacheHits / totalQuestions) * 100 : 0;
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const revenuePotential = totalUsers * 1100;

  const catCounts: Record<string, number> = {};
  const catCostSum: Record<string, number> = {};
  for (const c of ANALYTICS_CATEGORIES) {
    catCounts[c] = 0;
    catCostSum[c] = 0;
  }
  for (const row of logs) {
    const cat = (row.questionCategory || 'GENERAL').toUpperCase();
    const key = ANALYTICS_CATEGORIES.includes(cat as (typeof ANALYTICS_CATEGORIES)[number]) ? cat : 'GENERAL';
    catCounts[key] = (catCounts[key] || 0) + 1;
    catCostSum[key] = (catCostSum[key] || 0) + (row.costUsd || 0);
  }
  const catTotal = logs.length || 1;
  const donutLabels = [...ANALYTICS_CATEGORIES];
  const donutData = donutLabels.map((k) => catCounts[k] || 0);
  const donutColors = donutLabels.map((k) => CATEGORY_COLORS[k] || CATEGORY_COLORS.GENERAL);
  const avgCostByCat = donutLabels.map((k) => {
    const n = catCounts[k] || 0;
    return n > 0 ? ((catCostSum[k] || 0) / n) * USD_TO_INR : 0;
  });

  const intentCounts: Record<string, number> = {};
  for (const k of INTENT_KEYS) intentCounts[k] = 0;
  for (const row of logs) {
    const k = (row.questionIntent || 'GENERAL').toUpperCase();
    if ((INTENT_KEYS as readonly string[]).includes(k)) intentCounts[k] = (intentCounts[k] || 0) + 1;
    else intentCounts.GENERAL++;
  }

  const toneCounts: Record<string, number> = {};
  for (const k of TONE_KEYS) toneCounts[k] = 0;
  for (const row of logs) {
    const k = (row.emotionalTone || 'NEUTRAL').toUpperCase();
    if ((TONE_KEYS as readonly string[]).includes(k)) toneCounts[k] = (toneCounts[k] || 0) + 1;
    else toneCounts.NEUTRAL++;
  }

  const hourBuckets = new Array(24).fill(0);
  for (const row of logs) {
    if (!row.createdAt) continue;
    const d = new Date(row.createdAt);
    if (!Number.isNaN(d.getTime())) hourBuckets[d.getHours()]++;
  }
  let bestHour = 0;
  let bestCount = -1;
  for (let h = 0; h < 24; h++) {
    if (hourBuckets[h] > bestCount) {
      bestCount = hourBuckets[h];
      bestHour = h;
    }
  }

  const sessionGroups = new Map<string, number>();
  for (const row of logs) {
    const sid = row.sessionId || row.userHash || 'unknown';
    sessionGroups.set(sid, (sessionGroups.get(sid) || 0) + 1);
  }
  const sessionCount = Math.max(1, sessionGroups.size);
  const avgQsPerSession = logs.length / sessionCount;

  const now = new Date();
  const monthLogs = logs.filter((r) => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    return !Number.isNaN(d.getTime()) && isSameMonth(d, now);
  });
  const monthHits = monthLogs.filter((r) => r.cacheHit).length;
  const cacheSavedInrHeuristic = monthHits * avgCostInr * 0.42;

  const dayKeys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const qPerDay: Record<string, number> = {};
  const costPerDayUsd: Record<string, number> = {};
  for (const k of dayKeys) {
    qPerDay[k] = 0;
    costPerDayUsd[k] = 0;
  }
  for (const row of logs) {
    if (!row.createdAt) continue;
    const d = new Date(row.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    if (key in qPerDay) {
      qPerDay[key]++;
      costPerDayUsd[key] += row.costUsd || 0;
    }
  }
  const last7 = dayKeys.slice(-7);
  const prev7 = dayKeys.slice(-14, -7);
  const sumQ = (keys: string[]) => keys.reduce((a, k) => a + (qPerDay[k] || 0), 0);
  const sumC = (keys: string[]) => keys.reduce((a, k) => a + (costPerDayUsd[k] || 0), 0);
  const qLast = sumQ(last7);
  const qPrev = sumQ(prev7);
  const cLast = sumC(last7);
  const cPrev = sumC(prev7);
  const qTrend = qPrev === 0 ? (qLast > 0 ? 1 : 0) : (qLast - qPrev) / qPrev;
  const cTrend = cPrev === 0 ? (cLast > 0 ? 1 : 0) : (cLast - cPrev) / cPrev;

  const hitsInLogs = logs.filter((r) => r.cacheHit).length;
  const missInLogs = logs.length - hitsInLogs;
  const missRateLogs = logs.length > 0 ? missInLogs / logs.length : 0;

  const n = logs.length || 1;
  const fillPct = (pred: (row: StatsLog) => boolean) => (logs.filter(pred).length / n) * 100;
  const pctCategory = fillPct((r) => Boolean(r.questionCategory));
  const pctIntent = fillPct((r) => Boolean(r.questionIntent));
  const pctTone = fillPct((r) => Boolean(r.emotionalTone));
  const pctDepth = fillPct((r) => r.sessionDepth != null && r.sessionDepth !== undefined);
  const datasetCompleteness = (pctCategory + pctIntent + pctTone + pctDepth) / 4;
  const moatCrore = (totalQuestions / 2_000_000) * 500;

  const langBuckets: Record<string, number> = {};
  for (const row of logs) {
    const b = bucketLanguage(row.language);
    langBuckets[b] = (langBuckets[b] || 0) + 1;
  }

  const costIfNoCacheInr = totalCostInr * (1 + Math.min(2.5, missRateLogs * 1.8));

  const sortedByTime = [...logs].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
  const half = Math.max(1, Math.floor(sortedByTime.length / 2));
  const older = sortedByTime.slice(0, half);
  const newer = sortedByTime.slice(half);
  const missRate = (arr: StatsLog[]) =>
    arr.length === 0 ? 0 : arr.filter((r) => !r.cacheHit).length / arr.length;
  const missTrend = missRate(newer) - missRate(older);

  return {
    logs,
    totalQuestions,
    totalCostInr,
    avgCostInr,
    cacheHitRatePct,
    totalUsers,
    revenuePotential,
    donutLabels,
    donutData,
    donutColors,
    avgCostByCat,
    intentCounts,
    toneCounts,
    bestHour,
    bestCount,
    avgQsPerSession,
    cacheSavedInrHeuristic,
    dayKeys,
    qPerDay,
    costPerDayUsd,
    qTrend,
    cTrend,
    missRateLogs,
    pctCategory,
    pctIntent,
    pctTone,
    pctDepth,
    datasetCompleteness,
    moatCrore,
    langBuckets,
    costIfNoCacheInr,
    monthHits,
    monthLogsLen: monthLogs.length,
    missTrend,
    todayCostInr,
    weekCostInr,
    monthCostInr,
    todayQueries,
    peakHoursData,
    returnedDist,
    newUsers,
    returningUsers,
  };
}

const TONE_STACK_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HOPEFUL: '#22c55e',
  CONFUSED: '#f59e0b',
  DESPERATE: '#7f1d1d',
  CALM: '#3b82f6',
  NEUTRAL: '#64748b',
};

const MOCK_DASHA_GROUPS = ['Saturn MD', 'Rahu MD', 'Jupiter MD', 'Ketu MD'];
const DASHA_CHART_CATS = ['CAREER', 'MARRIAGE', 'HEALTH', 'WEALTH', 'SPIRITUAL', 'TIMING'] as const;
/** Illustrative counts — shown only when dashaAtTime is empty in logs */
const MOCK_DASHA_MATRIX: number[][] = [
  [18, 6, 4, 8, 5, 7],
  [5, 4, 2, 22, 3, 4],
  [12, 9, 6, 5, 4, 11],
  [3, 8, 5, 4, 14, 2],
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normCategory(c: string | null | undefined): string {
  const u = (c || 'GENERAL').toUpperCase();
  return ANALYTICS_CATEGORIES.includes(u as (typeof ANALYTICS_CATEGORIES)[number]) ? u : 'GENERAL';
}

function normTone(t: string | null | undefined): string {
  const u = (t || 'NEUTRAL').toUpperCase();
  return (TONE_KEYS as readonly string[]).includes(u) ? u : 'NEUTRAL';
}

type MySavedChartType = 'bar' | 'line' | 'doughnut' | 'pie';

function bucketMyChartX(log: StatsLog, xField: string): string {
  switch (xField) {
    case 'questionCategory':
      return normCategory(log.questionCategory);
    case 'emotionalTone':
      return normTone(log.emotionalTone);
    case 'questionIntent':
      return (log.questionIntent || 'GENERAL').toUpperCase();
    case 'language':
      return String(log.language || 'EN');
    case 'cacheHit':
      return log.cacheHit ? 'HIT' : 'MISS';
    case 'hour': {
      if (!log.createdAt) return '—';
      const d = new Date(log.createdAt);
      return Number.isNaN(d.getTime()) ? '—' : String(d.getHours());
    }
    default:
      return '—';
  }
}

/** Chart.js payload: `{ type, data, options }` — stored as JSON in `chartConfig`. */
function buildLogsChartConfig(
  logs: StatsLog[],
  chartType: MySavedChartType,
  xField: string,
  yField: string,
  groupBy: string,
): { type: MySavedChartType; data: any; options: any } {
  type Cell = { count: number; sumCostUsd: number; sumDepth: number; depthCount: number };
  const cells = new Map<string, Cell>();
  const useGroup = Boolean(groupBy && groupBy !== 'none');

  const bump = (key: string, log: StatsLog) => {
    if (!cells.has(key)) {
      cells.set(key, { count: 0, sumCostUsd: 0, sumDepth: 0, depthCount: 0 });
    }
    const c = cells.get(key)!;
    c.count += 1;
    c.sumCostUsd += Number(log.costUsd) || 0;
    const sd = log.sessionDepth;
    if (sd != null && sd !== undefined && !Number.isNaN(Number(sd))) {
      c.sumDepth += Number(sd);
      c.depthCount += 1;
    }
  };

  for (const log of logs) {
    const x = bucketMyChartX(log, xField);
    if (useGroup) {
      const g = bucketMyChartX(log, groupBy);
      bump(`${x}|||${g}`, log);
    } else {
      bump(x, log);
    }
  }

  const metric = (cell: Cell | undefined): number => {
    if (!cell || cell.count === 0) return 0;
    if (yField === 'count') return cell.count;
    if (yField === 'avgCost') return (cell.sumCostUsd / cell.count) * USD_TO_INR;
    if (yField === 'sessionDepth') return cell.depthCount ? cell.sumDepth / cell.depthCount : 0;
    return 0;
  };

  const axisCommon = {
    ticks: { color: '#8a8a9a' },
    grid: { color: BORDER },
    border: { color: BORDER },
  };

  const baseOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#a8a8b8', font: { size: 11 } } },
      tooltip: { backgroundColor: '#1a1a24', titleColor: GOLD, bodyColor: '#ddd' },
    },
  };

  if (logs.length === 0) {
    return {
      type: chartType,
      data: { labels: ['No data'], datasets: [{ label: '—', data: [0], backgroundColor: '#444' }] },
      options: baseOptions,
    };
  }

  if (chartType === 'doughnut' || chartType === 'pie') {
    if (useGroup) {
      const entries = [...cells.entries()].sort(([ka], [kb]) => ka.localeCompare(kb));
      const labels = entries.map(([key]) => {
        const [xv, gv] = key.split('|||');
        return `${xv} · ${gv}`;
      });
      const data = entries.map(([, cell]) => metric(cell));
      const bg = labels.map((_, i) => `hsla(${40 + (i * 37) % 360}, 55%, 52%, 0.88)`);
      return {
        type: chartType,
        data: {
          labels,
          datasets: [{ data, backgroundColor: bg, borderWidth: 0 }],
        },
        options: {
          ...baseOptions,
          plugins: { ...baseOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: '#a8a8b8' } } },
        },
      };
    }
    const labels = [...cells.keys()].sort((a, b) => a.localeCompare(b));
    const data = labels.map((lab) => metric(cells.get(lab)));
    return {
      type: chartType,
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map((_, i) => `hsla(${40 + i * 37}, 55%, 55%, 0.85)`),
            borderWidth: 0,
          },
        ],
      },
      options: {
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: '#a8a8b8' } } },
      },
    };
  }

  if (!useGroup) {
    const labels = [...cells.keys()].sort((a, b) => a.localeCompare(b));
    const data = labels.map((lab) => metric(cells.get(lab)));
    const label =
      yField === 'count' ? 'Count' : yField === 'avgCost' ? 'Avg cost (INR)' : 'Avg session depth';
    return {
      type: chartType,
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            backgroundColor: chartType === 'bar' ? 'rgba(201, 169, 110, 0.75)' : undefined,
            borderColor: chartType === 'line' ? GOLD : undefined,
            tension: 0.25,
            fill: chartType === 'line' ? 'origin' : false,
          },
        ],
      },
      options: {
        ...baseOptions,
        scales: { x: { ...axisCommon }, y: { ...axisCommon, beginAtZero: true } },
      },
    };
  }

  const xSet = new Set<string>();
  const gSet = new Set<string>();
  for (const key of cells.keys()) {
    const [xv, gv] = key.split('|||');
    xSet.add(xv);
    gSet.add(gv);
  }
  const labels = [...xSet].sort((a, b) => a.localeCompare(b));
  const groups = [...gSet].sort((a, b) => a.localeCompare(b));
  const palette = ['#c9a96e', '#818cf8', '#34d399', '#f472b6', '#60a5fa', '#fbbf24', '#f87171'];
  const datasets = groups.map((g, gi) => ({
    label: g,
    data: labels.map((lab) => metric(cells.get(`${lab}|||${g}`))),
    backgroundColor: chartType === 'bar' ? palette[gi % palette.length] : undefined,
    borderColor: chartType === 'line' ? palette[gi % palette.length] : undefined,
    tension: 0.25,
  }));

  return {
    type: chartType,
    data: { labels, datasets },
    options: {
      ...baseOptions,
      scales: { x: { ...axisCommon }, y: { ...axisCommon, beginAtZero: true } },
    },
  };
}

function planetFromDasha(d: string | null | undefined): string | null {
  if (!d || !String(d).trim()) return null;
  const m = String(d).trim().match(/^([A-Za-z]+)/);
  return m ? `${m[1]} MD` : null;
}

function buildProjectKarmaModel(stats: any) {
  const logs = normalizeLogs(stats);
  const records = Number(stats?.totalQuestions ?? 0);
  const sample = logs.length;

  // Real astrological distributions from DB aggregates
  const moonSignDist: { sign: string; cnt: number }[] = Array.isArray(stats?.moonSignDist) ? stats.moonSignDist : [];
  const lagnaDist: { sign: string; cnt: number }[] = Array.isArray(stats?.lagnaDist) ? stats.lagnaDist : [];
  const akDist: { planet: string; cnt: number }[] = Array.isArray(stats?.akDist) ? stats.akDist : [];
  const dashaDist: { dasha: string; cnt: number }[] = Array.isArray(stats?.dashaDist) ? stats.dashaDist : [];
  const sadeSatiCount = Number(stats?.sadeSatiCount ?? 0);
  const sadeSatiPct = records > 0 ? Math.round((sadeSatiCount / records) * 100) : 0;
  const dashaCatMatrix: { dasha: string; cat: string; cnt: number }[] = Array.isArray(stats?.dashaCatMatrix)
    ? stats.dashaCatMatrix
    : [];
  const emotionAgeDist: { tone: string; age: string; cnt: number }[] = Array.isArray(stats?.emotionAgeDist)
    ? stats.emotionAgeDist
    : [];
  const peakHoursDataRaw: { hour: number; total: number; distressed: number }[] = Array.isArray(stats?.peakHours)
    ? stats.peakHours
    : [];
  const peakByHourK = new Map<number, { hour: number; total: number; distressed: number }>();
  for (const r of peakHoursDataRaw) {
    const h = Number(r.hour);
    peakByHourK.set(h, {
      hour: h,
      total: Number(r.total) || 0,
      distressed: Number(r.distressed) || 0,
    });
  }
  const peakHoursData = Array.from({ length: 24 }, (_, h) => peakByHourK.get(h) ?? { hour: h, total: 0, distressed: 0 });

  // High value signals
  const desperateMarriage = logs.filter(
    (l) => normCategory(l.questionCategory) === 'MARRIAGE' && normTone(l.emotionalTone) === 'DESPERATE',
  ).length;
  const urgentCareer = logs.filter(
    (l) => normCategory(l.questionCategory) === 'CAREER' && normTone(l.emotionalTone) === 'URGENT',
  ).length;

  const estRupee = (records / 2_000_000) * 50_000_000;
  const estLakh = estRupee / 100_000;
  const pct = (pred: (l: StatsLog) => boolean) =>
    sample === 0 ? 0 : (logs.filter(pred).length / sample) * 100;
  const pctCat = pct((l) => Boolean(l.questionCategory));
  const pctInt = pct((l) => Boolean(l.questionIntent));
  const pctTon = pct((l) => Boolean(l.emotionalTone));
  const pctDep = pct((l) => l.sessionDepth != null && l.sessionDepth !== undefined);
  const pctDasha = pct((l) => Boolean(l.dashaAtTime && String(l.dashaAtTime).trim()));
  const pctMoon = pct((l) => Boolean(l.moonSignAtTime && String(l.moonSignAtTime).trim()));
  const pctNatalMoon = pct((l) => Boolean(l.userMoonSign && String(l.userMoonSign).trim()));
  const pctLagna = pct((l) => Boolean(l.userLagna && String(l.userLagna).trim()));
  const pctSade = pct((l) => l.userSadeSati === true || l.userSadeSati === false);
  const pctAge = pct((l) => Boolean(l.ageGroup && String(l.ageGroup).trim()));
  const completenessCore = (pctCat + pctInt + pctTon + pctDep) / 4;
  const completenessAll =
    (pctCat + pctInt + pctTon + pctDep + pctDasha + pctMoon + pctNatalMoon + pctLagna + pctSade + pctAge) / 10;
  const valueScorePct = Math.round(completenessAll * 10) / 10;

  const hasRealDasha = logs.some((l) => l.dashaAtTime && String(l.dashaAtTime).trim());
  let dashaUseMock = !hasRealDasha && sample > 0;
  if (sample === 0) dashaUseMock = true;
  const dashaGroupLabels = dashaUseMock ? [...MOCK_DASHA_GROUPS] : [...new Set(logs.map((l) => planetFromDasha(l.dashaAtTime)).filter(Boolean))] as string[];
  if (!dashaUseMock && dashaGroupLabels.length === 0) dashaUseMock = true;
  const dashaLabels = [...DASHA_CHART_CATS];
  const dashaDatasets: { label: string; data: number[]; backgroundColor: string }[] = [];
  if (dashaUseMock) {
    const colors = ['#94a3b8', '#c9a96e', '#818cf8', '#f97316'];
    MOCK_DASHA_GROUPS.forEach((label, gi) => {
      dashaDatasets.push({
        label,
        data: [...MOCK_DASHA_MATRIX[gi]],
        backgroundColor: colors[gi % colors.length],
      });
    });
  } else {
    const palette = ['#94a3b8', '#c9a96e', '#818cf8', '#f97316', '#22c55e', '#d946ef'];
    dashaGroupLabels.forEach((g, gi) => {
      const row = dashaLabels.map((cat) =>
        logs.filter((l) => planetFromDasha(l.dashaAtTime) === g && normCategory(l.questionCategory) === cat).length,
      );
      dashaDatasets.push({ label: g, data: row, backgroundColor: palette[gi % palette.length] });
    });
  }

  const stackCats = ['CAREER', 'MARRIAGE', 'HEALTH', 'WEALTH', 'SPIRITUAL', 'GENERAL'];
  const stackedToneDatasets = TONE_KEYS.map((tone) => ({
    label: tone,
    stack: 'tones',
    data: stackCats.map(
      (cat) => logs.filter((l) => normCategory(l.questionCategory) === cat && normTone(l.emotionalTone) === tone).length,
    ),
    backgroundColor: TONE_STACK_COLORS[tone] || '#64748b',
  }));

  const journeyMap = new Map<string, number>();
  const sorted = [...logs].sort((a, b) => {
    const ha = a.userHash || '';
    const hb = b.userHash || '';
    if (ha !== hb) return ha.localeCompare(hb);
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i].userHash || '') !== (sorted[i - 1].userHash || '')) continue;
    const a = normCategory(sorted[i - 1].questionCategory);
    const b = normCategory(sorted[i].questionCategory);
    if (a === b) continue;
    const key = `${a} → ${b}`;
    journeyMap.set(key, (journeyMap.get(key) || 0) + 1);
  }
  const journeyRows = [...journeyMap.entries()].sort((x, y) => y[1] - x[1]).slice(0, 24);
  type JourneyRow = { from: string; to: string; count: number; mock: boolean };
  const journeyParsed: JourneyRow[] = journeyRows.map(([k, c]) => {
    const parts = k.split(' → ');
    return { from: parts[0]?.trim() || '—', to: parts[1]?.trim() || '—', count: c, mock: false };
  });
  const journeyUseMock = journeyParsed.length === 0;
  const journeyDisplay: JourneyRow[] = journeyUseMock
    ? [
        { from: 'CAREER', to: 'MARRIAGE', count: 12, mock: true },
        { from: 'CAREER', to: 'WEALTH', count: 8, mock: true },
        { from: 'MARRIAGE', to: 'HEALTH', count: 6, mock: true },
        { from: 'WEALTH', to: 'SPIRITUAL', count: 5, mock: true },
        { from: 'HEALTH', to: 'CAREER', count: 4, mock: true },
      ]
    : journeyParsed;

  const hasAge = logs.some((l) => l.ageGroup && String(l.ageGroup).trim());
  const ageUseMock = !hasAge && sample > 0;
  const ageGroups = ageUseMock ? ['18–27', '28–42', '43–55', '55+'] : [...new Set(logs.map((l) => l.ageGroup).filter(Boolean))] as string[];
  const ageMockMatrix: number[][] = [
    [8, 4, 2, 6, 3, 5],
    [12, 9, 5, 8, 4, 7],
    [6, 11, 8, 5, 6, 4],
    [3, 5, 14, 4, 9, 6],
  ];
  const ageDatasets = ageGroups.map((ag, gi) => ({
    label: ag,
    data: stackCats.map((cat) => {
      if (ageUseMock) return ageMockMatrix[gi]?.[stackCats.indexOf(cat)] ?? 0;
      return logs.filter((l) => l.ageGroup === ag && normCategory(l.questionCategory) === cat).length;
    }),
    backgroundColor: ['#c9a96e', '#818cf8', '#34d399', '#f472b6'][gi % 4],
  }));

  const isHindi = (l: StatsLog) => bucketLanguage(l.language) === 'Hindi';
  const isEnglish = (l: StatsLog) => bucketLanguage(l.language) === 'English';
  const hi = logs.filter(isHindi);
  const en = logs.filter(isEnglish);
  const avgDepth = (arr: StatsLog[]) =>
    arr.length === 0 ? 0 : arr.reduce((s, l) => s + (Number(l.sessionDepth) || 0), 0) / arr.length;
  const urgentFrac = (arr: StatsLog[]) =>
    arr.length === 0
      ? 0
      : arr.filter((l) => ['URGENT', 'DESPERATE'].includes(normTone(l.emotionalTone))).length / arr.length;
  const avgCostInr = (arr: StatsLog[]) =>
    arr.length === 0 ? 0 : (arr.reduce((s, l) => s + (l.costUsd || 0), 0) / arr.length) * USD_TO_INR;

  const heat: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0));
  for (const l of logs) {
    if (!l.createdAt) continue;
    const d = new Date(l.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    heat[d.getHours()][d.getDay()]++;
  }
  let peakH = 0;
  let peakD = 0;
  let peakV = -1;
  for (let h = 0; h < 24; h++) {
    for (let wd = 0; wd < 7; wd++) {
      if (heat[h][wd] > peakV) {
        peakV = heat[h][wd];
        peakH = h;
        peakD = wd;
      }
    }
  }
  const minSlot = heat.flat().every((v) => v === 0)
    ? null
    : (() => {
        let mh = 0;
        let md = 0;
        let mv = Infinity;
        for (let h = 0; h < 24; h++) {
          for (let wd = 0; wd < 7; wd++) {
            const v = heat[h][wd];
            if (v < mv) {
              mv = v;
              mh = h;
              md = wd;
            }
          }
        }
        return { h: mh, d: md, v: mv };
      })();
  const heatMax = Math.max(1, ...heat.flat());

  const lateNightVol = [22, 23, 0].reduce((s, h) => s + heat[h].reduce((a, v) => a + v, 0), 0);
  const morningVol = [6, 7].reduce((s, h) => s + heat[h].reduce((a, v) => a + v, 0), 0);
  const peakInsight =
    peakV <= 0
      ? 'No timestamps in sample — heatmap uses zeros.'
      : lateNightVol >= morningVol * 1.2
        ? 'People seek guidance most at: 10PM–12AM (late-night volume dominates in this sample).'
        : `Peak single hour slot: ${WEEKDAY_LABELS[peakD]} ${String(peakH).padStart(2, '0')}:00–${String((peakH + 1) % 24).padStart(2, '0')}:00 (${peakV} questions).`;
  const lowInsight =
    minSlot == null
      ? 'Lowest: —'
      : morningVol <= lateNightVol * 0.35 && morningVol > 0
        ? 'Lowest: 6AM–8AM band (early morning is quiet vs evenings in this sample).'
        : `Quietest slot in grid: ${WEEKDAY_LABELS[minSlot.d]} ${String(minSlot.h).padStart(2, '0')}:00 (${minSlot.v} questions).`;

  const marr = logs.filter((l) => normCategory(l.questionCategory) === 'MARRIAGE');
  const marrUrgentPct = marr.length ? (marr.filter((l) => normTone(l.emotionalTone) === 'URGENT').length / marr.length) * 100 : 0;
  const marrUrgentDesperatePct = marr.length
    ? (marr.filter((l) => ['URGENT', 'DESPERATE'].includes(normTone(l.emotionalTone))).length / marr.length) * 100
    : 0;
  const spir = logs.filter((l) => normCategory(l.questionCategory) === 'SPIRITUAL');
  const spirCalmPct = spir.length ? (spir.filter((l) => normTone(l.emotionalTone) === 'CALM').length / spir.length) * 100 : 0;
  const career = logs.filter((l) => normCategory(l.questionCategory) === 'CAREER');
  const careerAmb = career.filter((l) => (l.questionIntent || '').toUpperCase() === 'AMBITION').length;
  const careerAnx = career.filter((l) => (l.questionIntent || '').toUpperCase() === 'ANXIETY').length;

  const fieldRows = [
    { field: 'questionCategory', pct: pctCat },
    { field: 'questionIntent', pct: pctInt },
    { field: 'emotionalTone', pct: pctTon },
    { field: 'sessionDepth', pct: pctDep },
    { field: 'dashaAtTime', pct: pctDasha },
    { field: 'moonSignAtTime', pct: pctMoon },
    { field: 'userMoonSign', pct: pctNatalMoon },
    { field: 'userLagna', pct: pctLagna },
    { field: 'userSadeSati', pct: pctSade },
    { field: 'ageGroup', pct: pctAge },
  ].map((r) => ({
    ...r,
    filled: Math.min(records || sample, Math.round((r.pct / 100) * (records > 0 ? records : sample))),
    status: r.pct >= 80 ? 'ready' : r.pct >= 20 ? 'building' : 'pending',
  }));
  const overallCompletenessPct = Math.round(completenessAll * 1000) / 10;

  return {
    logs,
    sample,
    records,
    estLakh,
    completenessCore,
    completenessAll,
    valueScorePct,
    dashaUseMock,
    dashaLabels,
    dashaDatasets,
    stackedToneDatasets,
    stackCats,
    journeyDisplay,
    journeyUseMock,
    ageUseMock,
    ageDatasets,
    heat,
    heatMax,
    peakH,
    peakD,
    peakV,
    minSlot,
    marrUrgentPct,
    marrUrgentDesperatePct,
    spirCalmPct,
    careerAmb,
    careerAnx,
    careerN: career.length,
    marrN: marr.length,
    spirN: spir.length,
    fieldRows,
    overallCompletenessPct,
    peakInsight,
    lowInsight,
    hiN: hi.length,
    enN: en.length,
    hiAvgDepth: avgDepth(hi),
    enAvgDepth: avgDepth(en),
    hiUrgentFrac: urgentFrac(hi),
    enUrgentFrac: urgentFrac(en),
    hiAvgCost: avgCostInr(hi),
    enAvgCost: avgCostInr(en),
    moonSignDist,
    lagnaDist,
    akDist,
    dashaDist,
    sadeSatiCount,
    sadeSatiPct,
    dashaCatMatrix,
    emotionAgeDist,
    peakHoursData,
    desperateMarriage,
    urgentCareer,
  };
}

const chartFont = { family: 'system-ui, sans-serif' };
const axisCommon = {
  ticks: { color: '#8a8a9a', font: chartFont },
  grid: { color: BORDER },
  border: { color: BORDER },
};

const SARVAM_LANGS: { code: string; label: string }[] = [
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'od-IN', label: 'Odia' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<
    'users' | 'questions' | 'cost' | 'karma' | 'mycharts' | 'reports' | 'quickchart' | 'audiooracle'
  >('users');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [qcName, setQcName] = useState('');
  const [qcDob, setQcDob] = useState('');
  const [qcTob, setQcTob] = useState('');
  const [qcPlace, setQcPlace] = useState('');
  const [qcLat, setQcLat] = useState('');
  const [qcLon, setQcLon] = useState('');
  const [qcTz, setQcTz] = useState('5.5');
  const [qcGender, setQcGender] = useState('Prefer not to say');
  const [qcSessionOnly, setQcSessionOnly] = useState(true);
  const [qcBusy, setQcBusy] = useState(false);
  const [qcGeoBusy, setQcGeoBusy] = useState(false);

  const [quotaEditUserId, setQuotaEditUserId] = useState<string | null>(null);
  const [quotaDraft, setQuotaDraft] = useState('');

  const [audLang, setAudLang] = useState('hi-IN');
  const [audProfileId, setAudProfileId] = useState('');
  const [audQuestion, setAudQuestion] = useState('');
  const [audBusy, setAudBusy] = useState(false);
  const [audText, setAudText] = useState('');
  const [audB64, setAudB64] = useState<string | null>(null);
  const [audPlaying, setAudPlaying] = useState(false);
  const [audTime, setAudTime] = useState(0);
  const [audDur, setAudDur] = useState(0);
  const [showAudTranscript, setShowAudTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [adminQuestionRows, setAdminQuestionRows] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [analyticsUpdatedAt, setAnalyticsUpdatedAt] = useState<number | null>(null);
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false);

  const [savedCharts, setSavedCharts] = useState<any[]>([]);
  const [myChartsLoading, setMyChartsLoading] = useState(false);
  const [mcName, setMcName] = useState('');
  const [mcType, setMcType] = useState<MySavedChartType>('bar');
  const [mcX, setMcX] = useState('questionCategory');
  const [mcY, setMcY] = useState('count');
  const [mcGroup, setMcGroup] = useState('none');
  const [mcDesc, setMcDesc] = useState('');
  const [mcPreview, setMcPreview] = useState<{ type: MySavedChartType; data: any; options: any } | null>(null);
  const [mcEdit, setMcEdit] = useState<{ id: string; chartName: string; description: string } | null>(null);

  const [profileCounts, setProfileCounts] = useState<Record<string, number>>({});
  const [profileModal, setProfileModal] = useState<null | { user: any; loading: boolean; profiles: any[] }>(null);
  const [adminProfileUiTick, setAdminProfileUiTick] = useState(0);
  const [myProfiles, setMyProfiles] = useState<any[]>([]);

  const token = localStorage.getItem('auth_token');
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchUsers = useCallback(async () => {
    const r = await fetch(`${BACKEND}/api/admin/users`, { headers });
    const d = await r.json();
    setUsers(Array.isArray(d) ? d : []);
  }, [headers]);

  const fetchStats = async () => {
    const r = await fetch(`${BACKEND}/api/admin/stats`, { headers });
    const d = await r.json();
    setStats(d);
  };

  const fetchAdminQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/questions/admin/list`, { headers });
      if (r.ok) setAdminQuestionRows(await r.json());
      else setAdminQuestionRows([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (stats) setAnalyticsUpdatedAt(Date.now());
  }, [stats]);

  const analyticsModel = useMemo(
    () => (stats ? buildAnalyticsModel(stats, users) : null),
    [stats, users],
  );

  const karmaModel = useMemo(() => (stats ? buildProjectKarmaModel(stats) : null), [stats]);

  const refreshAnalytics = useCallback(async () => {
    setAnalyticsRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchUsers()]);
      setAnalyticsUpdatedAt(Date.now());
    } finally {
      setAnalyticsRefreshing(false);
    }
  }, []);

  const fetchSavedCharts = useCallback(async () => {
    if (!token) return;
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    setMyChartsLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/saved-charts`, { headers: h });
      if (r.ok) setSavedCharts(await r.json());
      else setSavedCharts([]);
    } finally {
      setMyChartsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab !== 'mycharts' || !token) return;
    void fetchSavedCharts();
  }, [tab, token, fetchSavedCharts]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const r = await fetch(`${BACKEND}/api/profiles`, { headers });
      if (r.ok) setMyProfiles(await r.json());
      else setMyProfiles([]);
    })();
  }, [token]);

  useEffect(() => {
    if (tab !== 'users' || !token) return;
    void (async () => {
      const r = await fetch(`${BACKEND}/api/profiles/admin/counts`, { headers });
      if (r.ok) setProfileCounts(await r.json());
    })();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== 'questions') return;
    void fetchAdminQuestions();
  }, [tab]);

  const act = async (id: string, action: 'approve' | 'reject' | 'remove') => {
    const url =
      action === 'remove'
        ? `${BACKEND}/api/auth/admin/users/${id}`
        : action === 'approve'
          ? `${BACKEND}/api/auth/admin/approve/${id}`
          : `${BACKEND}/api/auth/admin/reject/${id}`;
    const method = action === 'remove' ? 'DELETE' : 'POST';
    const r = await fetch(url, { method, headers });
    if (r.ok) {
      setMsg(`User ${action === 'remove' ? 'removed' : `${action}d`} successfully`);
      fetchUsers();
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg('Action failed — check console');
    }
  };

  const statusColor: Record<string, string> = { approved: '#1a7a3e', pending: '#7a5c00', rejected: '#7a1a1a' };
  const statusBg: Record<string, string> = { approved: '#d4edda', pending: '#fff3cd', rejected: '#f8d7da' };

  const myChartLogs = useMemo(() => normalizeLogs(stats), [stats]);

  const runMcPreview = useCallback(() => {
    if (!stats) {
      setMsg('Load dashboard stats first.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setMcPreview(buildLogsChartConfig(myChartLogs, mcType, mcX, mcY, mcGroup));
  }, [stats, myChartLogs, mcType, mcX, mcY, mcGroup]);

  const saveMcChart = useCallback(async () => {
    if (!token) return;
    if (!mcName.trim()) {
      setMsg('Set a chart name before saving.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    if (!mcPreview) {
      setMsg('Click Preview Chart first.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const body = {
      chartName: mcName.trim(),
      chartType: mcType,
      chartConfig: JSON.stringify(mcPreview),
      description: mcDesc.trim() || undefined,
      xAxis: mcX,
      yAxis: mcY,
      groupBy: mcGroup === 'none' ? undefined : mcGroup,
    };
    const r = await fetch(`${BACKEND}/api/saved-charts`, { method: 'POST', headers: h, body: JSON.stringify(body) });
    if (r.ok) {
      setMsg('Chart saved.');
      setTimeout(() => setMsg(''), 2500);
      await fetchSavedCharts();
    } else {
      setMsg('Save failed — check admin login / network.');
      setTimeout(() => setMsg(''), 4000);
    }
  }, [token, mcName, mcPreview, mcDesc, mcX, mcY, mcGroup, mcType, fetchSavedCharts]);

  const toggleMcPin = useCallback(
    async (id: string) => {
      if (!token) return;
      const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const r = await fetch(`${BACKEND}/api/saved-charts/${id}/pin`, { method: 'PATCH', headers: h });
      if (r.ok) await fetchSavedCharts();
    },
    [token, fetchSavedCharts],
  );

  const deleteMcChart = useCallback(
    async (id: string) => {
      if (!token || !confirm('Delete this saved chart?')) return;
      const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const r = await fetch(`${BACKEND}/api/saved-charts/${id}`, { method: 'DELETE', headers: h });
      if (r.ok) {
        setMsg('Chart deleted.');
        setTimeout(() => setMsg(''), 2500);
        await fetchSavedCharts();
      }
    },
    [token, fetchSavedCharts],
  );

  const saveMcEdit = useCallback(async () => {
    if (!token || !mcEdit) return;
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const r = await fetch(`${BACKEND}/api/saved-charts/${mcEdit.id}`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({
        chartName: mcEdit.chartName.trim(),
        description: mcEdit.description.trim() || undefined,
      }),
    });
    if (r.ok) {
      setMcEdit(null);
      setMsg('Chart updated.');
      setTimeout(() => setMsg(''), 2500);
      await fetchSavedCharts();
    }
  }, [token, mcEdit, fetchSavedCharts]);

  const adminActiveParsed = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_ADMIN_ACTIVE_PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [adminProfileUiTick]);

  const mergedProfileChoices = useMemo(() => {
    let auth: any = null;
    try {
      auth = JSON.parse(localStorage.getItem('auth_user') || 'null');
    } catch {
      auth = null;
    }
    const rows: { key: string; label: string; owner: any; profile: any }[] = [];
    for (const p of myProfiles || []) {
      rows.push({
        key: `mine-${p.id}`,
        label: `${p.name || 'Profile'} (you)`,
        owner: auth,
        profile: p,
      });
    }
    for (const e of readAdminDirectory()) {
      if (!e?.profileId) continue;
      rows.push({
        key: `dir-${e.profileId}`,
        label: `${e.profileName || 'Profile'} · ${e.userEmail || e.userId || 'user'}`,
        owner: { id: e.userId, email: e.userEmail },
        profile: e.profile || {
          id: e.profileId,
          name: e.profileName,
          dateOfBirth: e.dateOfBirth,
          timeOfBirth: e.timeOfBirth,
          placeOfBirth: e.placeOfBirth,
          latitude: e.latitude,
          longitude: e.longitude,
          timezone: e.timezone,
          gender: e.gender,
        },
      });
    }
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (seen.has(r.key)) return false;
      seen.add(r.key);
      return true;
    });
  }, [myProfiles, adminProfileUiTick]);

  const applyOracleFromProfile = useCallback(
    async (ownerUser: any, profile: any, opts: { redirect: boolean }) => {
      if (!token) return;
      setMsg('Generating chart…');
      try {
        const analysis = await fetchAnalysisForProfile({
          name: profile.name,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
          timeOfBirth: profile.timeOfBirth,
          placeOfBirth: profile.placeOfBirth,
          latitude: profile.latitude,
          longitude: profile.longitude,
          timezone: profile.timezone,
        });
        const lat = profile.latitude != null && profile.latitude !== '' ? Number(profile.latitude) : Number.NaN;
        const lng = profile.longitude != null && profile.longitude !== '' ? Number(profile.longitude) : Number.NaN;
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          localStorage.setItem('vedicUserLocation', `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        const tzNum =
          profile.timezone != null && profile.timezone !== '' ? parseFloat(String(profile.timezone)) : Number.NaN;
        if (Number.isFinite(tzNum)) {
          localStorage.setItem('vedicUserTimezone', String(tzNum));
        }
        try {
          localStorage.setItem('vedicAstroData', JSON.stringify(analysis));
        } catch {
          setMsg('Chart JSON too large for this browser storage.');
          setTimeout(() => setMsg(''), 5000);
          return;
        }
        const { initDatabase } = await import('../../services/db');
        const db = await initDatabase(
          analysis,
          Number.isFinite(lat) ? lat : undefined,
          Number.isFinite(lng) ? lng : undefined,
        );
        if (db && typeof (db as any).export === 'function') {
          localStorage.setItem(LS_ACTIVE_ORACLE_DB, uint8ToBase64((db as any).export()));
        } else {
          localStorage.removeItem(LS_ACTIVE_ORACLE_DB);
        }
        const entry = {
          userId: ownerUser?.id,
          profileId: profile.id,
          profileName: profile.name || 'Profile',
          userEmail: ownerUser?.email,
          profile: { ...profile },
          dbData: analysis,
        };
        localStorage.setItem(LS_ADMIN_ACTIVE_PROFILE, JSON.stringify(entry));
        const dir = readAdminDirectory().filter((e: any) => e.profileId !== profile.id);
        dir.push(entry);
        writeAdminDirectory(dir);
        setAdminProfileUiTick((t) => t + 1);
        setMsg(opts.redirect ? 'Opening oracle…' : 'Oracle chart saved locally for this profile.');
        setTimeout(() => setMsg(''), 2500);
        if (opts.redirect) {
          window.location.href = '/';
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        setMsg(err?.message || 'Failed to build chart');
        setTimeout(() => setMsg(''), 5000);
      }
    },
    [token],
  );

  const geocodeQuickChart = useCallback(async () => {
    if (!qcPlace.trim()) {
      setMsg('Enter a place first.');
      setTimeout(() => setMsg(''), 2500);
      return;
    }
    setQcGeoBusy(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(qcPlace.trim())}`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'AatmabodhaAdmin/1.0 (contact: app)' } },
      );
      const data = await r.json();
      if (Array.isArray(data) && data[0]) {
        setQcLat(String(data[0].lat));
        setQcLon(String(data[0].lon));
        setMsg('Location found.');
      } else {
        setMsg('No results — try a larger city or region.');
      }
    } catch {
      setMsg('Geocode failed.');
    } finally {
      setQcGeoBusy(false);
      setTimeout(() => setMsg(''), 4000);
    }
  }, [qcPlace]);

  const submitQuickChart = useCallback(async () => {
    if (!token) return;
    const tz = parseFloat(qcTz) || 5.5;
    const lat = parseFloat(qcLat);
    const lon = parseFloat(qcLon);
    if (!qcName.trim() || !qcDob || !qcTob || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      setMsg('Fill name, DOB, TOB, and valid coordinates (Geocode or enter lat/lon).');
      setTimeout(() => setMsg(''), 4000);
      return;
    }
    const { date_of_birth, time_of_birth } = convertToISTForAPI(qcDob, qcTob, tz);
    const permanent = !qcSessionOnly;
    setQcBusy(true);
    try {
      const r = await fetch(`${BACKEND}/api/admin/quick-chart`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: qcName.trim(),
          date_of_birth,
          time_of_birth,
          latitude: lat,
          longitude: lon,
          timezone: tz,
          gender: qcGender,
          placeOfBirth: qcPlace.trim() || undefined,
          storageDateOfBirth: qcDob,
          storageTimeOfBirth: qcTob,
          permanent,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || `HTTP ${r.status}`);
      }
      const payload = await r.json();
      const analysis = buildAnalysisResultFromChartJson(payload.chart, {
        name: qcName.trim(),
        gender: qcGender,
        dateOfBirth: qcDob,
        timeOfBirth: qcTob,
        placeOfBirth: qcPlace,
        latitude: lat,
        longitude: lon,
        timezone: tz,
      });
      localStorage.setItem('vedicUserLocation', `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      localStorage.setItem('vedicUserTimezone', String(tz));
      try {
        localStorage.setItem('vedicAstroData', JSON.stringify(analysis));
      } catch {
        setMsg('Chart JSON too large for this browser storage.');
        setTimeout(() => setMsg(''), 5000);
        return;
      }
      const { initDatabase } = await import('../../services/db');
      const db = await initDatabase(analysis, lat, lon);
      if (db && typeof (db as any).export === 'function') {
        localStorage.setItem(LS_ACTIVE_ORACLE_DB, uint8ToBase64((db as any).export()));
      } else {
        localStorage.removeItem(LS_ACTIVE_ORACLE_DB);
      }
      const savedProfile = payload.profile;
      const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
      const entry = {
        userId: authUser?.id,
        profileId: savedProfile?.id ?? `quick-${Date.now()}`,
        profileName: qcName.trim(),
        userEmail: authUser?.email,
        profile: savedProfile || {
          name: qcName.trim(),
          gender: qcGender,
          dateOfBirth: qcDob,
          timeOfBirth: qcTob,
          placeOfBirth: qcPlace,
          latitude: lat,
          longitude: lon,
          timezone: tz,
        },
        dbData: analysis,
        purpose: 'Test Only',
      };
      localStorage.setItem(LS_ADMIN_ACTIVE_PROFILE, JSON.stringify(entry));
      localStorage.setItem(
        LS_ADMIN_QUICK_CHART,
        JSON.stringify({
          name: qcName.trim(),
          sessionOnly: qcSessionOnly,
          purpose: 'Test Only',
          profileId: savedProfile?.id ?? null,
        }),
      );
      setAdminProfileUiTick((t) => t + 1);
      setMsg('Quick chart ready — opening Oracle…');
      setTimeout(() => setMsg(''), 2500);
      window.location.href = '/';
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMsg(err?.message || 'Quick chart failed');
      setTimeout(() => setMsg(''), 5000);
    } finally {
      setQcBusy(false);
    }
  }, [
    token,
    headers,
    qcName,
    qcDob,
    qcTob,
    qcLat,
    qcLon,
    qcTz,
    qcGender,
    qcPlace,
    qcSessionOnly,
  ]);

  const saveUserQuota = useCallback(
    async (userId: string, displayName: string) => {
      const n = parseInt(quotaDraft, 10);
      if (Number.isNaN(n) || n < 0) {
        setMsg('Quota must be a whole number ≥ 0 (0 = unlimited).');
        setTimeout(() => setMsg(''), 3500);
        return;
      }
      const r = await fetch(`${BACKEND}/api/admin/users/${encodeURIComponent(userId)}/quota`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ quota: n }),
      });
      if (r.ok) {
        setQuotaEditUserId(null);
        setMsg(`Quota updated to ${n === 0 ? 'Unlimited ∞' : n} for ${displayName}`);
        setTimeout(() => setMsg(''), 3500);
        await fetchUsers();
      } else {
        setMsg('Quota update failed');
        setTimeout(() => setMsg(''), 4000);
      }
    },
    [headers, quotaDraft, fetchUsers],
  );

  const startVoiceAsk = useCallback(() => {
    const W = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) {
      setMsg('Voice input not supported in this browser.');
      setTimeout(() => setMsg(''), 3500);
      return;
    }
    const rec = new SR();
    rec.lang = audLang.startsWith('hi') ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: any) => {
      const t = ev.results[0]?.[0]?.transcript?.trim();
      if (t) {
        setAudQuestion(t);
        if (/[\u0900-\u097F]/.test(t)) setAudLang('hi-IN');
      }
    };
    rec.onerror = () => {
      setMsg('Voice capture error');
      setTimeout(() => setMsg(''), 3000);
    };
    rec.start();
  }, [audLang]);

  const submitAudioOracle = useCallback(async () => {
    if (!token || !audProfileId || !audQuestion.trim()) {
      setMsg('Pick a profile and enter a question.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setAudBusy(true);
    setAudB64(null);
    setAudText('');
    try {
      const r = await fetch(`${BACKEND}/api/admin/oracle/audio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: audQuestion.trim(),
          language: audLang,
          profileId: audProfileId,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data as { message?: string }).message || `HTTP ${r.status}`);
      setAudText(String(data.text || ''));
      setAudB64(typeof data.audioBase64 === 'string' ? data.audioBase64 : null);
      if (data.audioBase64 && audioRef.current) {
        audioRef.current.src = `data:audio/wav;base64,${data.audioBase64}`;
        audioRef.current.load();
      }
    } catch (e: unknown) {
      setMsg((e as Error).message || 'Audio oracle failed');
      setTimeout(() => setMsg(''), 5000);
    } finally {
      setAudBusy(false);
    }
  }, [token, headers, audProfileId, audQuestion, audLang]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setAudTime(el.currentTime);
    const onDur = () => setAudDur(el.duration || 0);
    const onPlay = () => setAudPlaying(true);
    const onPause = () => setAudPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDur);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, []);

  useEffect(() => {
    if (mergedProfileChoices.length && !audProfileId) {
      const first = mergedProfileChoices[0];
      if (first?.profile?.id) setAudProfileId(String(first.profile.id));
    }
  }, [mergedProfileChoices, audProfileId]);

  const openProfilesForUser = useCallback(
    async (user: any) => {
      if (!token) return;
      setProfileModal({ user, loading: true, profiles: [] });
      try {
        const r = await fetch(`${BACKEND}/api/profiles/admin?userId=${encodeURIComponent(user.id)}`, { headers });
        if (!r.ok) {
          setProfileModal({ user, loading: false, profiles: [] });
          setMsg('Could not load profiles (admin only).');
          setTimeout(() => setMsg(''), 4000);
          return;
        }
        const list = await r.json();
        setProfileModal({ user, loading: false, profiles: Array.isArray(list) ? list : [] });
      } catch {
        setProfileModal({ user, loading: false, profiles: [] });
      }
    },
    [token],
  );

  if (loading) return <div style={{ padding: 40, color: '#ccc', background: '#0d0d1a', minHeight: '100vh' }}>Loading admin data...</div>;

  return (
    <div style={{ background: '#0d0d1a', minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            color: '#c9a84c',
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Admin Dashboard
        </h1>
        <div
          style={{
            background: '#1a1a2e',
            border: '1px solid #2a2a4a',
            borderRadius: 10,
            padding: '10px 14px',
            minWidth: 260,
            maxWidth: 420,
          }}
        >
          <div style={{ fontSize: 10, color: '#6a6a7c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Oracle profile (local)
          </div>
          <div style={{ fontSize: 13, color: '#e8e8ee', fontWeight: 600, marginBottom: 8 }}>
            {adminActiveParsed?.profileName || '— none selected —'}
          </div>
          <select
            value={adminActiveParsed?.profileId || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              if (v === '__clear__') {
                localStorage.removeItem(LS_ADMIN_ACTIVE_PROFILE);
                localStorage.removeItem(LS_ACTIVE_ORACLE_DB);
                setAdminProfileUiTick((t) => t + 1);
                return;
              }
              const row = mergedProfileChoices.find((x) => x.profile?.id === v);
              if (!row?.profile) return;
              void applyOracleFromProfile(row.owner || { id: row.profile.userId }, row.profile, { redirect: true });
            }}
            style={{
              width: '100%',
              background: '#12121a',
              color: '#ddd',
              border: '1px solid #2a2a38',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            <option value="">— Open Oracle as profile —</option>
            {mergedProfileChoices.map((r) => (
              <option key={r.key} value={r.profile?.id || r.key}>
                {r.label}
              </option>
            ))}
            <option value="__clear__">Clear admin target (keys only)</option>
          </select>
          <div style={{ fontSize: 10, color: '#5a5a6c', lineHeight: 1.4 }}>
            Your saved profiles + any user you load from the Users tab. Selecting runs chart API and sends you to the main
            Oracle (/) with <code style={{ color: '#7a7a8c' }}>adminActiveProfile</code> + <code style={{ color: '#7a7a8c' }}>activeOracleDB</code>.
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ background: '#1a3a1a', color: '#7bed9f', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* TOP STATS */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Questions', val: Number(stats.totalQuestions ?? 0) },
            { label: 'Total Cost (INR)', val: `₹${((stats.totalCost ?? 0) * USD_TO_INR).toFixed(2)}` },
            { label: 'Avg Cost/Q (INR)', val: `₹${((stats.avgCostPerQuestion ?? 0) * USD_TO_INR).toFixed(4)}` },
            { label: 'Cache Hits', val: stats.cacheHits ?? 0 },
            { label: 'Cache Size', val: stats.cache?.size ?? 0 },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10, padding: '12px 18px', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#c9a84c' }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #2a2a4a', paddingBottom: 0 }}>
        {(
          [
            'users',
            'questions',
            'cost',
            'karma',
            'mycharts',
            'reports',
            'quickchart',
            'audiooracle',
          ] as const
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: tab === t ? '#1a1a3e' : 'transparent',
              color: tab === t ? '#c9a84c' : '#666',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 13,
              textTransform:
                t === 'karma' || t === 'mycharts' || t === 'quickchart' || t === 'audiooracle'
                  ? 'none'
                  : 'capitalize',
              borderBottom: tab === t ? '2px solid #c9a84c' : '2px solid transparent',
            }}
          >
            {t === 'users'
              ? `Users (${users.length})`
              : t === 'questions'
                ? 'Questions'
                : t === 'cost'
                  ? 'Analytics'
                  : t === 'karma'
                    ? 'Project Karma'
                    : t === 'mycharts'
                      ? 'My Charts'
                      : t === 'reports'
                        ? 'Reports'
                        : t === 'quickchart'
                          ? 'Quick Chart'
                          : t === 'audiooracle'
                            ? 'Audio Oracle'
                            : String(t)}
          </button>
        ))}
      </div>

      {tab === 'quickchart' && (
        <div style={{ maxWidth: 720, color: '#ccc', fontSize: 14, lineHeight: 1.5 }}>
          <p style={{ color: GOLD, fontWeight: 600, marginBottom: 12 }}>Quick Chart — Test Only</p>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
            Creates a temporary nativity for Oracle testing. Purpose is tagged <strong>Test Only</strong>. Session-only data is cleared when you sign out from the main app.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Name</div>
              <input value={qcName} onChange={(e) => setQcName(e.target.value)} style={qcInput} />
            </label>
            <label>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Gender</div>
              <select value={qcGender} onChange={(e) => setQcGender(e.target.value)} style={qcInput}>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <label>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>DOB</div>
              <input type="date" value={qcDob} onChange={(e) => setQcDob(e.target.value)} style={qcInput} />
            </label>
            <label>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TOB</div>
              <input type="time" value={qcTob} onChange={(e) => setQcTob(e.target.value)} style={qcInput} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Place of Birth</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={qcPlace} onChange={(e) => setQcPlace(e.target.value)} placeholder="City, State, Country" style={{ ...qcInput, flex: 1 }} />
                <button type="button" disabled={qcGeoBusy} onClick={() => void geocodeQuickChart()} style={qcBtn}>
                  {qcGeoBusy ? '…' : 'Geocode'}
                </button>
              </div>
            </label>
            <label>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Latitude</div>
              <input value={qcLat} onChange={(e) => setQcLat(e.target.value)} style={qcInput} />
            </label>
            <label>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Longitude</div>
              <input value={qcLon} onChange={(e) => setQcLon(e.target.value)} style={qcInput} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Timezone offset (hours from UTC)</div>
              <input value={qcTz} onChange={(e) => setQcTz(e.target.value)} style={qcInput} />
            </label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={qcSessionOnly} onChange={(e) => setQcSessionOnly(e.target.checked)} />
            <span>Session only (do not save profile to database)</span>
          </label>
          <p style={{ fontSize: 11, color: '#666', marginTop: 8 }}>Uncheck to save permanently under your admin account (tagged created_by_admin).</p>
          <button type="button" disabled={qcBusy} onClick={() => void submitQuickChart()} style={{ ...qcBtn, marginTop: 20, padding: '10px 20px', fontWeight: 700 }}>
            {qcBusy ? 'Working…' : 'Create & open in Oracle'}
          </button>
        </div>
      )}

      {tab === 'audiooracle' && (
        <div style={{ maxWidth: 640, color: '#ccc', fontSize: 14 }}>
          <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
          <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>🎙️ Audio Oracle [ADMIN ONLY]</div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#888' }}>Profile</div>
            <select
              value={audProfileId}
              onChange={(e) => setAudProfileId(e.target.value)}
              style={{ ...qcInput, width: '100%', marginTop: 4 }}
            >
              {mergedProfileChoices.map((row) => (
                <option key={row.key} value={row.profile?.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#888' }}>Language</div>
            <select value={audLang} onChange={(e) => setAudLang(e.target.value)} style={{ ...qcInput, width: '100%', marginTop: 4 }}>
              {SARVAM_LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.code})
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button type="button" onClick={startVoiceAsk} style={qcBtn}>
              🎤 Ask by voice
            </button>
          </div>
          <textarea
            value={audQuestion}
            onChange={(e) => setAudQuestion(e.target.value)}
            placeholder="Type question…"
            rows={3}
            style={{ ...qcInput, width: '100%', resize: 'vertical' }}
          />
          <button type="button" disabled={audBusy} onClick={() => void submitAudioOracle()} style={{ ...qcBtn, marginTop: 10, fontWeight: 700 }}>
            {audBusy ? '…' : '▶️ Get Audio Answer'}
          </button>
          {audB64 && (
            <div style={{ marginTop: 20, padding: 14, borderRadius: 10, border: '1px solid #2a2a4a', background: '#12121a' }}>
              <div style={{ fontSize: 12, color: GOLD, marginBottom: 8 }}>🔊 {audPlaying ? 'Playing response…' : 'Ready'}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                {formatAudTime(audTime)} / {formatAudTime(audDur || 0)}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={qcBtn} onClick={() => audioRef.current?.play()}>
                  ▶️
                </button>
                <button type="button" style={qcBtn} onClick={() => audioRef.current?.pause()}>
                  ⏸
                </button>
                <button
                  type="button"
                  style={qcBtn}
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                      void audioRef.current.play();
                    }
                  }}
                >
                  🔄 Replay
                </button>
                <a
                  href={audB64 ? `data:audio/wav;base64,${audB64}` : '#'}
                  download="oracle-answer.wav"
                  style={{ ...qcBtn, textDecoration: 'none', display: 'inline-block' }}
                >
                  📥
                </a>
              </div>
            </div>
          )}
          <button type="button" onClick={() => setShowAudTranscript((s) => !s)} style={{ ...qcBtn, marginTop: 12 }}>
            {showAudTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {showAudTranscript && audText && (
            <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 12, color: '#bbb', background: '#0a0a12', padding: 12, borderRadius: 8 }}>{audText}</pre>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1a1a2e' }}>
                {['Name', 'Email', 'Status', 'Profiles', 'Questions', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#888', fontWeight: 500, borderBottom: '1px solid #2a2a4a' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                  <td style={{ padding: '12px 14px', color: '#ddd' }}>{u.name || u.firstName || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#aaa' }}>{u.email}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: statusBg[u.status] || '#333', color: statusColor[u.status] || '#ccc',
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600
                    }}>{u.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        minWidth: 28,
                        textAlign: 'center',
                        background: '#2a2540',
                        color: GOLD,
                        borderRadius: 8,
                        padding: '4px 8px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {profileCounts[u.id] ?? '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#ddd' }}>
                    {(() => {
                      const cap = typeof u.current_quota === 'number' ? u.current_quota : 60;
                      const used = u.questionsUsed ?? 0;
                      const unlimited = cap === 0;
                      const label = unlimited ? `${used}/∞` : `${used}/${cap}`;
                      const warn = !unlimited && cap > 0 && used / cap > 0.8;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>{label}</span>
                            {unlimited && (
                              <span
                                style={{
                                  background: 'rgba(201,169,110,0.22)',
                                  color: GOLD,
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                }}
                              >
                                ∞ UNLIMITED
                              </span>
                            )}
                            {warn && (
                              <span
                                style={{
                                  background: 'rgba(180,50,50,0.35)',
                                  color: '#ffb3b3',
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                }}
                              >
                                {'>'}80%
                              </span>
                            )}
                          </div>
                          {quotaEditUserId === u.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <input
                                value={quotaDraft}
                                onChange={(e) => setQuotaDraft(e.target.value)}
                                style={{ width: 64, padding: 6, borderRadius: 6, border: '1px solid #444', background: '#111', color: '#eee' }}
                              />
                              <button
                                type="button"
                                onClick={() => void saveUserQuota(u.id, u.name || u.email)}
                                style={{ ...qcBtn, padding: '6px 12px', fontSize: 12 }}
                              >
                                Save
                              </button>
                              <button type="button" onClick={() => setQuotaEditUserId(null)} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setQuotaEditUserId(u.id);
                                setQuotaDraft(String(cap));
                              }}
                              style={{ fontSize: 12, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                            >
                              Edit Quota ✏️
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => void openProfilesForUser(u)}
                        style={{
                          background: '#1a1a3e',
                          color: GOLD,
                          border: '1px solid #2a2a4a',
                          borderRadius: 6,
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        View Profiles
                      </button>
                      <button
                        type="button"
                        onClick={() => void openProfilesForUser(u)}
                        style={{
                          background: '#2a2540',
                          color: '#c4b5fd',
                          border: '1px solid #4c3f6b',
                          borderRadius: 6,
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Switch Profile
                      </button>
                      {u.status !== 'approved' && (
                        <button onClick={() => act(u.id, 'approve')} style={{ background: '#1a4a2a', color: '#7bed9f', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
                          Approve
                        </button>
                      )}
                      {u.status !== 'rejected' && (
                        <button onClick={() => act(u.id, 'reject')} style={{ background: '#4a2a1a', color: '#ff9966', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
                          Reject
                        </button>
                      )}
                      <button onClick={() => { if (confirm(`Delete ${u.email}?`)) act(u.id, 'remove'); }} style={{ background: '#4a1a1a', color: '#ff6b6b', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QUESTIONS TAB — totalQuestions from /api/admin/stats, not list length */}
      {tab === 'questions' && (
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
            Total in database:{' '}
            <strong style={{ color: '#c9a84c' }}>{Number(stats?.totalQuestions ?? 0)}</strong>
            {!questionsLoading && adminQuestionRows.length > 0 && (
              <span style={{ color: '#666' }}> · Showing {adminQuestionRows.length} most recent</span>
            )}
          </div>
          {questionsLoading ? (
            <div style={{ color: '#888', padding: 20, fontSize: 13 }}>Loading questions…</div>
          ) : adminQuestionRows.length === 0 ? (
            <div style={{ color: '#666', padding: 20, fontSize: 13 }}>No questions logged yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1a1a2e' }}>
                    {['User Hash', 'Category', 'Language', 'Cache', 'Cost', 'Time'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#888', fontWeight: 500, borderBottom: '1px solid #2a2a4a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adminQuestionRows.map((q: any, i: number) => {
                    const cat = q.category || 'GENERAL';
                    const bg = CATEGORY_COLORS[cat] || CATEGORY_COLORS.GENERAL;
                    return (
                      <tr key={`${q.userHash}-${i}`} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={{ padding: '10px 12px', color: '#888', fontFamily: 'monospace' }}>{q.userHash}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontWeight: 600,
                              fontSize: 11,
                              letterSpacing: 0.5,
                              color: '#fff',
                              background: bg,
                              border: '1px solid rgba(255,255,255,0.12)',
                            }}
                          >
                            {cat}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#aaa' }}>{q.language || 'EN'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: q.cacheHit ? '#7bed9f' : '#aaa', fontWeight: q.cacheHit ? 600 : 400 }}>
                            {q.cacheHit ? 'HIT' : 'MISS'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#c9a84c' }}>₹{q.costInr ?? '0.0000'}</td>
                        <td style={{ padding: '10px 12px', color: '#666', fontSize: 11 }}>
                          {q.time ? new Date(q.time).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB (Cost & Cache) — derived from /api/admin/stats + users list */}
      {tab === 'cost' && (
        <div style={{ background: BG, borderRadius: 12, padding: '20px 16px 28px', border: `1px solid ${BORDER}` }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ color: GOLD, fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                Oracle analytics
              </h2>
              <p style={{ color: '#7a7a8c', fontSize: 12, margin: '6px 0 0' }}>
                KPIs from DB totals · charts from recent <code style={{ color: '#9a9aaa' }}>logs</code> sample (up to 2000 rows)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: '#6a6a7c', fontSize: 12 }}>
                Last updated:{' '}
                {analyticsUpdatedAt == null
                  ? '—'
                  : `${Math.max(0, Math.floor((Date.now() - analyticsUpdatedAt) / 60000))} mins ago`}
              </span>
              <button
                type="button"
                disabled={analyticsRefreshing || !stats}
                onClick={() => void refreshAnalytics()}
                style={{
                  background: analyticsRefreshing ? '#2a2a38' : CARD,
                  color: GOLD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: '8px 18px',
                  cursor: analyticsRefreshing || !stats ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {analyticsRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {!stats || !analyticsModel ? (
            <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Load stats to view analytics.</div>
          ) : (
            <>
              {/* COST COMMAND CENTER */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                {[
                  {
                    label: 'Today',
                    value: `₹${analyticsModel.todayCostInr?.toFixed(2) ?? '0.00'}`,
                    sub: `${analyticsModel.todayQueries ?? 0} queries`,
                    color: '#c9a96e',
                  },
                  {
                    label: 'This Week',
                    value: `₹${analyticsModel.weekCostInr?.toFixed(2) ?? '0.00'}`,
                    sub: `vs ₹${analyticsModel.totalCostInr?.toFixed(0)} total`,
                    color: '#818cf8',
                  },
                  {
                    label: 'This Month',
                    value: `₹${analyticsModel.monthCostInr?.toFixed(2) ?? '0.00'}`,
                    sub: `cache saved ₹${analyticsModel.cacheSavedInrHeuristic?.toFixed(0)}`,
                    color: '#34d399',
                  },
                  {
                    label: 'Cache HIT %',
                    value: `${analyticsModel.cacheHitRatePct?.toFixed(1)}%`,
                    sub:
                      analyticsModel.cacheHitRatePct >= 60
                        ? '✅ Excellent'
                        : analyticsModel.cacheHitRatePct >= 40
                          ? '⚠️ Moderate'
                          : '🔴 Low',
                    color:
                      analyticsModel.cacheHitRatePct >= 60
                        ? '#34d399'
                        : analyticsModel.cacheHitRatePct >= 40
                          ? '#f97316'
                          : '#ef4444',
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${card.color}40`,
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {card.label}
                    </div>
                    <div style={{ color: card.color, fontSize: '24px', fontWeight: 700, margin: '8px 0 4px' }}>
                      {card.value}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {analyticsModel.peakHoursData && analyticsModel.peakHoursData.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ color: '#c9a96e', fontWeight: 600, marginBottom: '12px' }}>📊 Queries by Hour (IST)</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                    {analyticsModel.peakHoursData.map((h) => {
                      const maxTotal = Math.max(1, ...analyticsModel.peakHoursData.map((x) => x.total));
                      const height = Math.round((h.total / maxTotal) * 80);
                      const distressRatio = h.total > 0 ? h.distressed / h.total : 0;
                      return (
                        <div
                          key={h.hour}
                          title={`${h.hour}:00 — ${h.total} queries, ${h.distressed} distressed`}
                          style={{
                            flex: 1,
                            height: `${Math.max(2, height)}px`,
                            background:
                              distressRatio > 0.5 ? '#ef4444' : distressRatio > 0.3 ? '#f97316' : '#818cf8',
                            borderRadius: '2px 2px 0 0',
                            cursor: 'pointer',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#475569',
                      fontSize: '10px',
                      marginTop: '4px',
                    }}
                  >
                    <span>12AM</span>
                    <span>6AM</span>
                    <span>12PM</span>
                    <span>6PM</span>
                    <span>11PM</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                    🔴 Red = {'>'} 50% distressed queries at that hour
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(129,140,248,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                    New Users (in sample)
                  </div>
                  <div style={{ color: '#818cf8', fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>
                    {analyticsModel.newUsers ?? 0}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>First-time queries</div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(201,169,110,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Returning Users</div>
                  <div style={{ color: '#c9a96e', fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>
                    {analyticsModel.returningUsers ?? 0}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Came back after first query</div>
                </div>
              </div>

              {/* SECTION 1 — KPI */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {[
                  { label: 'Total Questions', sub: 'All time (DB)', val: analyticsModel.totalQuestions.toLocaleString() },
                  {
                    label: 'Total Cost',
                    sub: 'INR · DB aggregate',
                    val: `₹${analyticsModel.totalCostInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  },
                  {
                    label: 'Avg Cost / Q',
                    sub: 'INR',
                    val: `₹${analyticsModel.avgCostInr.toLocaleString(undefined, { maximumFractionDigits: 4 })}`,
                  },
                  {
                    label: 'Cache hit rate',
                    sub: 'Global',
                    val: `${analyticsModel.cacheHitRatePct.toFixed(2)}%`,
                  },
                  { label: 'Total users', sub: 'Admin directory', val: String(analyticsModel.totalUsers) },
                  {
                    label: 'Revenue potential',
                    sub: 'users × ₹1100',
                    val: `₹${analyticsModel.revenuePotential.toLocaleString()}`,
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    style={{
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      minHeight: 88,
                    }}
                  >
                    <div style={{ fontSize: 10, color: '#6a6a7c', textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: '#5a5a6c', marginTop: 4 }}>{k.sub}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, marginTop: 8 }}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* SECTION 2 — Category */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Question categories</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 12px' }}>Share of recent logs · counts & %</p>
                  <div style={{ height: 280, position: 'relative' }}>
                    <Doughnut
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '58%',
                        plugins: {
                          legend: { position: 'right', labels: { color: '#a8a8b8', font: { size: 10 }, boxWidth: 10 } },
                          tooltip: {
                            callbacks: {
                              label(ctx) {
                                const t = ctx.dataset.data.reduce((a: number, n: number) => a + n, 0) || 1;
                                const v = Number(ctx.raw);
                                return `${ctx.label}: ${v} (${((v / t) * 100).toFixed(1)}%)`;
                              },
                            },
                            backgroundColor: '#1a1a24',
                            titleColor: GOLD,
                            bodyColor: '#ddd',
                          },
                        },
                      }}
                      data={{
                        labels: analyticsModel.donutLabels,
                        datasets: [
                          {
                            data: analyticsModel.donutData,
                            backgroundColor: analyticsModel.donutColors,
                            borderWidth: 0,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Avg cost by category</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 12px' }}>INR per question · recent logs sample</p>
                  <div style={{ height: 280, position: 'relative' }}>
                    <ChartJsBar
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { ...axisCommon, ticks: { ...axisCommon.ticks, maxRotation: 45, minRotation: 35 } },
                          y: {
                            ...axisCommon,
                            ticks: {
                              ...axisCommon.ticks,
                              callback: (v) => `₹${Number(v).toFixed(0)}`,
                            },
                          },
                        },
                      }}
                      data={{
                        labels: analyticsModel.donutLabels,
                        datasets: [
                          {
                            label: 'Avg INR',
                            data: analyticsModel.avgCostByCat,
                            backgroundColor: analyticsModel.donutLabels.map(
                              (k) => CATEGORY_COLORS[k] || CATEGORY_COLORS.GENERAL,
                            ),
                            borderRadius: 6,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3 — Behavioral */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h4 style={{ color: GOLD, fontSize: 13, margin: '0 0 6px' }}>Most active hour</h4>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 10px' }}>From timestamps in recent logs</p>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#e8e8ee' }}>
                    {analyticsModel.bestCount <= 0
                      ? '—'
                      : `${String(analyticsModel.bestHour).padStart(2, '0')}:00 – ${String(analyticsModel.bestHour + 1).padStart(2, '0')}:00`}
                  </div>
                  <div style={{ fontSize: 12, color: '#7a7a8c', marginTop: 6 }}>{analyticsModel.bestCount} events in window</div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h4 style={{ color: GOLD, fontSize: 13, margin: '0 0 6px' }}>Avg questions / session</h4>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 10px' }}>Grouped by sessionId or userHash in sample</p>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#e8e8ee' }}>
                    {analyticsModel.avgQsPerSession.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h4 style={{ color: GOLD, fontSize: 13, margin: '0 0 6px' }}>Cache efficiency (estimate)</h4>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 10px' }}>
                    Heuristic on this month&apos;s rows in sample ({analyticsModel.monthLogsLen} rows)
                  </p>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#7bed9f' }}>
                    Cache saved ≈ ₹{Math.round(analyticsModel.cacheSavedInrHeuristic).toLocaleString()} this month
                  </div>
                  <div style={{ fontSize: 11, color: '#5a5a6c', marginTop: 8 }}>Illustrative: hits × avg cost × 42%</div>
                </div>
              </div>

              {/* SECTION 4 — Intent & tone */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Question intent</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 12px' }}>ANXIETY · AMBITION · … · GENERAL</p>
                  <div style={{ height: 260, position: 'relative' }}>
                    <ChartJsBar
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: { x: axisCommon, y: axisCommon },
                      }}
                      data={{
                        labels: [...INTENT_KEYS],
                        datasets: [
                          {
                            label: 'Count',
                            data: INTENT_KEYS.map((k) => analyticsModel.intentCounts[k] || 0),
                            backgroundColor: 'rgba(201, 169, 110, 0.75)',
                            borderRadius: 4,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Emotional tone</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 12px' }}>URGENT · CALM · … · NEUTRAL</p>
                  <div style={{ height: 260, position: 'relative' }}>
                    <ChartJsBar
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: { x: axisCommon, y: axisCommon },
                      }}
                      data={{
                        labels: [...TONE_KEYS],
                        datasets: [
                          {
                            label: 'Count',
                            data: TONE_KEYS.map((k) => analyticsModel.toneCounts[k] || 0),
                            backgroundColor: 'rgba(129, 140, 248, 0.75)',
                            borderRadius: 4,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5 — Language & geo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Language mix</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 12px' }}>Recent logs · EN / HI / Hinglish / Regional</p>
                  <div style={{ height: 260, position: 'relative' }}>
                    <Pie
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom', labels: { color: '#a8a8b8', font: { size: 10 } } },
                        },
                      }}
                      data={{
                        labels: Object.keys(analyticsModel.langBuckets),
                        datasets: [
                          {
                            data: Object.values(analyticsModel.langBuckets),
                            backgroundColor: [
                              '#6366f1',
                              '#c9a96e',
                              '#22c55e',
                              '#f97316',
                              '#a855f7',
                              '#64748b',
                            ],
                            borderWidth: 0,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Geography</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 12px' }}>Top cities when available</p>
                  <div
                    style={{
                      height: 260,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5a5a6c',
                      fontSize: 13,
                      textAlign: 'center',
                      padding: 20,
                    }}
                  >
                    City-level data is not stored on question logs (privacy). Use USER_CONTEXT in app analytics when
                    wired.
                  </div>
                </div>
              </div>

              {/* SECTION 6 — Time series */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Questions per day</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 8px' }}>
                    Last 30 days · sample only · week trend{' '}
                    <span style={{ color: analyticsModel.qTrend >= 0 ? '#7bed9f' : '#f87171' }}>
                      {analyticsModel.qTrend >= 0 ? '▲' : '▼'} {Math.abs(analyticsModel.qTrend * 100).toFixed(0)}%
                    </span>{' '}
                    vs prior week
                  </p>
                  <div style={{ height: 240, position: 'relative' }}>
                    <Line
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { ...axisCommon, ticks: { maxTicksLimit: 8 } },
                          y: { ...axisCommon, beginAtZero: true },
                        },
                      }}
                      data={{
                        labels: analyticsModel.dayKeys.map((d) => d.slice(5)),
                        datasets: [
                          {
                            label: 'Questions',
                            data: analyticsModel.dayKeys.map((k) => analyticsModel.qPerDay[k] || 0),
                            borderColor: GOLD,
                            backgroundColor: 'rgba(201, 169, 110, 0.15)',
                            fill: true,
                            tension: 0.25,
                            pointRadius: 2,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 4px' }}>Cost per day</h3>
                  <p style={{ color: '#6a6a7c', fontSize: 11, margin: '0 0 8px' }}>
                    INR · sample · week trend{' '}
                    <span style={{ color: analyticsModel.cTrend >= 0 ? '#7bed9f' : '#f87171' }}>
                      {analyticsModel.cTrend >= 0 ? '▲' : '▼'} {Math.abs(analyticsModel.cTrend * 100).toFixed(0)}%
                    </span>
                  </p>
                  <div style={{ height: 240, position: 'relative' }}>
                    <Line
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { ...axisCommon, ticks: { maxTicksLimit: 8 } },
                          y: {
                            ...axisCommon,
                            beginAtZero: true,
                            ticks: {
                              ...axisCommon.ticks,
                              callback: (v) => `₹${Number(v).toFixed(0)}`,
                            },
                          },
                        },
                      }}
                      data={{
                        labels: analyticsModel.dayKeys.map((d) => d.slice(5)),
                        datasets: [
                          {
                            label: 'INR',
                            data: analyticsModel.dayKeys.map(
                              (k) => (analyticsModel.costPerDayUsd[k] || 0) * USD_TO_INR,
                            ),
                            borderColor: '#818cf8',
                            backgroundColor: 'rgba(129, 140, 248, 0.12)',
                            fill: true,
                            tension: 0.25,
                            pointRadius: 2,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7 — Moat */}
              <div
                style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                }}
              >
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>Project Karma · moat score</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 16px' }}>
                  Field completeness on recent logs sample (not full DB scan)
                </p>
                {(
                  [
                    ['questionCategory', analyticsModel.pctCategory],
                    ['questionIntent', analyticsModel.pctIntent],
                    ['emotionalTone', analyticsModel.pctTone],
                    ['sessionDepth', analyticsModel.pctDepth],
                  ] as const
                ).map(([label, pct]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9a9aaa' }}>
                      <span>{label}</span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, background: '#1a1a22', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: GOLD }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 13, color: '#b8b8c8' }}>
                    Dataset completeness:{' '}
                    <strong style={{ color: GOLD }}>{analyticsModel.datasetCompleteness.toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: 14, color: '#e8e8ee', marginTop: 8 }}>
                    Estimated strategic value:{' '}
                    <strong style={{ color: GOLD }}>
                      ₹{analyticsModel.moatCrore.toFixed(2)} crore
                    </strong>
                    <span style={{ fontSize: 11, color: '#6a6a7c', marginLeft: 8 }}>
                      (totalQuestions / 2M × 500 crore)
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 8 — Cache deep dive */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#6a6a7c' }}>Cache size (current)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, marginTop: 6 }}>
                    {stats?.cache?.size ?? 0} / {stats?.cache?.maxSize ?? 1000}
                  </div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#6a6a7c' }}>TTL (hours)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, marginTop: 6 }}>
                    {stats?.cache?.ttlHours ?? 6}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a5a6c', marginTop: 6 }}>Server-managed in-memory cache</div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#6a6a7c' }}>Miss rate trend (sample)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, marginTop: 6 }}>
                    {(analyticsModel.missRateLogs * 100).toFixed(1)}% overall
                  </div>
                  <div style={{ fontSize: 12, color: analyticsModel.missTrend <= 0 ? '#7bed9f' : '#f87171', marginTop: 6 }}>
                    Chronological halves: Δ miss rate {(analyticsModel.missTrend * 100).toFixed(2)} pp
                  </div>
                </div>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#6a6a7c' }}>Cost if cache disabled (estimate)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fca5a5', marginTop: 6 }}>
                    ₹{Math.round(analyticsModel.costIfNoCacheInr).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a5a6c', marginTop: 6 }}>Scaled from observed miss mix</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* PROJECT KARMA TAB — sellable dataset intelligence */}
      {tab === 'karma' && (
        <div style={{ background: BG, borderRadius: 12, padding: '20px 16px 28px', border: `1px solid ${BORDER}` }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ color: GOLD, fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>Project Karma</h2>
              <p style={{ color: '#7a7a8c', fontSize: 12, margin: '6px 0 0' }}>
                Sellable intelligence from <code style={{ color: '#9a9aaa' }}>stats.logs</code> sample + DB totals (
                {karmaModel?.sample ?? 0} rows in sample)
              </p>
            </div>
            <button
              type="button"
              disabled={analyticsRefreshing || !stats}
              onClick={() => void refreshAnalytics()}
              style={{
                background: analyticsRefreshing ? '#2a2a38' : CARD,
                color: GOLD,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '8px 18px',
                cursor: analyticsRefreshing || !stats ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {analyticsRefreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
          </div>

          {!stats || !karmaModel ? (
            <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Load stats to view Project Karma.</div>
          ) : (
            <>
              {karmaModel.moonSignDist && karmaModel.moonSignDist.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#c9a96e', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>
                    🌙 Moon Sign Distribution
                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: '11px', marginLeft: '8px' }}>
                      (from DB — real data)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {karmaModel.moonSignDist.slice(0, 12).map((item) => (
                      <div
                        key={item.sign}
                        style={{
                          background: 'rgba(201,169,110,0.1)',
                          border: '1px solid rgba(201,169,110,0.3)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          minWidth: '80px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ color: '#c9a96e', fontWeight: 700, fontSize: '18px' }}>{item.cnt}</div>
                        <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>{item.sign}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {karmaModel.akDist && karmaModel.akDist.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>
                    ⭐ Atmakaraka Distribution
                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: '11px', marginLeft: '8px' }}>
                      (soul planet of users)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {karmaModel.akDist.map((item) => (
                      <div
                        key={item.planet}
                        style={{
                          background: 'rgba(129,140,248,0.1)',
                          border: '1px solid rgba(129,140,248,0.3)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '20px' }}>{item.cnt}</div>
                        <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>{item.planet}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Sade Sati Users</div>
                  <div style={{ color: '#ef4444', fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>
                    {karmaModel.sadeSatiPct ?? 0}%
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>
                    {karmaModel.sadeSatiCount ?? 0} users in Saturn affliction
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Desperate + Marriage</div>
                  <div style={{ color: '#f97316', fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>
                    {karmaModel.desperateMarriage ?? 0}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Highest urgency queries</div>
                </div>
                <div
                  style={{
                    background: 'rgba(234,179,8,0.1)',
                    border: '1px solid rgba(234,179,8,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Urgent + Career</div>
                  <div style={{ color: '#eab308', fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>
                    {karmaModel.urgentCareer ?? 0}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Time-pressure career queries</div>
                </div>
              </div>

              {karmaModel.dashaDist && karmaModel.dashaDist.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ color: '#34d399', fontWeight: 600, marginBottom: '12px' }}>🪐 Active Dasha Distribution</div>
                  {karmaModel.dashaDist.map((item) => {
                    const max = Math.max(1, ...karmaModel.dashaDist.map((x) => x.cnt));
                    return (
                      <div key={item.dasha} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '80px', color: '#94a3b8', fontSize: '12px', textAlign: 'right' }}>
                          {item.dasha}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            height: '20px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.round((item.cnt / max) * 100)}%`,
                              height: '100%',
                              background: '#34d399',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              paddingLeft: '6px',
                            }}
                          >
                            <span style={{ color: '#000', fontSize: '10px', fontWeight: 700 }}>{item.cnt}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ color: '#c9a96e', fontWeight: 600, marginBottom: '12px' }}>📦 Export Anonymized Datasets</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    {
                      label: 'Behavioral Dataset',
                      desc: 'Category + Emotion + Dasha + Age',
                      onClick: () => {
                        const rows = karmaModel.logs.map((l: StatsLog) => ({
                          questionCategory: l.questionCategory || '',
                          emotionalTone: l.emotionalTone || '',
                          userDashaType: l.userDashaType || '',
                          ageGroup: l.ageGroup || '',
                          sessionDepth: l.sessionDepth ?? '',
                          returnedAfterDays: l.returnedAfterDays ?? '',
                          prevCategory: l.prevCategory || '',
                          language: l.language || '',
                        }));
                        if (!rows.length) {
                          alert('No data to export');
                          return;
                        }
                        const csv = [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).join(','))].join(
                          '\n',
                        );
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `aatmabodha_behavioral_${new Date().toISOString().slice(0, 10)}.csv`;
                        a.click();
                      },
                    },
                    {
                      label: 'Astrological Dataset',
                      desc: 'Moon + Lagna + AK + Dasha + SadeSati',
                      onClick: () => {
                        const rows = karmaModel.logs
                          .filter((l) => l.userMoonSign || l.userLagna)
                          .map((l: StatsLog) => ({
                            userMoonSign: l.userMoonSign || '',
                            userLagna: l.userLagna || '',
                            userAtmakaraka: l.userAtmakaraka || '',
                            userDashaType: l.userDashaType || '',
                            dashaAtTime: l.dashaAtTime || '',
                            userSadeSati: l.userSadeSati ?? '',
                            ageGroup: l.ageGroup || '',
                            questionCategory: l.questionCategory || '',
                            emotionalTone: l.emotionalTone || '',
                          }));
                        if (!rows.length) {
                          alert('No astrological data yet — generate charts first');
                          return;
                        }
                        const csv = [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).join(','))].join(
                          '\n',
                        );
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `aatmabodha_astro_${new Date().toISOString().slice(0, 10)}.csv`;
                        a.click();
                      },
                    },
                  ].map((btn) => (
                    <div key={btn.label}>
                      <button
                        type="button"
                        onClick={btn.onClick}
                        style={{
                          background: 'rgba(201,169,110,0.15)',
                          border: '1px solid rgba(201,169,110,0.4)',
                          borderRadius: '8px',
                          color: '#c9a96e',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        ⬇ {btn.label}
                      </button>
                      <div style={{ color: '#475569', fontSize: '10px', marginTop: '4px' }}>{btn.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 1 — Moat header */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${CARD} 0%, #16161f 100%)`,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '24px 22px',
                  marginBottom: 22,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f8', letterSpacing: 0.3 }}>Project Karma Dataset</div>
                <div style={{ fontSize: 14, color: '#9a9aaf', marginTop: 8, maxWidth: 520, lineHeight: 1.45 }}>
                  {"World's first Vedic behavioral intelligence database"}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 14,
                    marginTop: 22,
                  }}
                >
                  {[
                    { label: 'Records', val: karmaModel.records.toLocaleString() },
                    {
                      label: 'Est. value',
                      val: `₹${karmaModel.estLakh.toLocaleString(undefined, { maximumFractionDigits: 2 })} lakh`,
                      sub: '(records / 2M × ₹5 crore in lakh)',
                    },
                    {
                      label: 'Completeness',
                      val: `${(karmaModel.completenessAll * 100).toFixed(1)}%`,
                      sub: '10-field blend · logs sample',
                    },
                    { label: 'Target', val: '2,000,000 records' },
                  ].map((s) => (
                    <div key={s.label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, color: '#6a6a7c', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, marginTop: 6 }}>{s.val}</div>
                      {s.sub && <div style={{ fontSize: 10, color: '#5a5a6c', marginTop: 4 }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2 — Dasha × category */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>Which Dasha triggers which questions?</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 8px' }}>Core sellable insight · grouped counts by question category</p>
                {karmaModel.dashaUseMock && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#fbbf24',
                      background: 'rgba(251,191,36,0.08)',
                      border: '1px solid rgba(251,191,36,0.25)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      marginBottom: 12,
                    }}
                  >
                    Sample — populates with usage: <strong style={{ color: '#fcd34d' }}>dashaAtTime</strong> is empty in
                    logs; chart shows labeled mock structure until real dasha tags arrive.
                  </div>
                )}
                <div style={{ height: 280, position: 'relative' }}>
                  <ChartJsBar
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#a8a8b8', font: { size: 10 }, boxWidth: 12 } },
                      },
                      scales: { x: { ...axisCommon, beginAtZero: true, stacked: false }, y: { ...axisCommon, stacked: false } },
                    }}
                    data={{
                      labels: karmaModel.dashaLabels,
                      datasets: karmaModel.dashaDatasets.map((d) => ({
                        ...d,
                        borderWidth: 0,
                        borderRadius: 4,
                      })),
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 16 }}>
                  {[
                    'Saturn Dasha users ask 3× more CAREER questions',
                    'Rahu Dasha = highest WEALTH question rate',
                    'Ketu Dasha = most SPIRITUAL questions',
                  ].map((txt) => (
                    <div
                      key={txt}
                      style={{
                        background: '#16161e',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        fontSize: 12,
                        color: '#c8c8d4',
                      }}
                    >
                      {txt}
                      <div style={{ fontSize: 10, color: '#6a6a7c', marginTop: 8 }}>
                        Static insight — becomes data-driven when <code style={{ color: '#8a8a9a' }}>dashaAtTime</code>{' '}
                        populates.
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3 — Emotion × life area */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>What emotion drives each life question?</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 12px' }}>
                  Stacked counts by <code style={{ color: '#8a8a9a' }}>emotionalTone</code> · real data from logs sample
                </p>
                <div style={{ height: 300, position: 'relative' }}>
                  <ChartJsBar
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#a8a8b8', font: { size: 9 }, boxWidth: 10 } },
                      },
                      scales: {
                        x: { ...axisCommon, stacked: true },
                        y: { ...axisCommon, stacked: true, beginAtZero: true },
                      },
                    }}
                    data={{
                      labels: karmaModel.stackCats,
                      datasets: karmaModel.stackedToneDatasets,
                    }}
                  />
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: '#b0b0be', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: '#fda4af' }}>MARRIAGE</strong> questions ={' '}
                    {karmaModel.marrN > 0 ? (
                      <>
                        {karmaModel.marrUrgentDesperatePct.toFixed(0)}% URGENT+DESPERATE in sample
                        <span style={{ color: '#6a6a7c' }}> · narrative target 67% URGENT tone</span>
                      </>
                    ) : (
                      <>67% URGENT tone (illustrative — no MARRIAGE rows in sample)</>
                    )}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong style={{ color: '#93c5fd' }}>SPIRITUAL</strong> questions ={' '}
                    {karmaModel.spirN > 0 ? (
                      <>
                        {karmaModel.spirCalmPct.toFixed(0)}% CALM in sample
                        <span style={{ color: '#6a6a7c' }}> · narrative target 82% CALM tone</span>
                      </>
                    ) : (
                      <>82% CALM tone (illustrative — no SPIRITUAL rows in sample)</>
                    )}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong style={{ color: '#7dd3fc' }}>CAREER</strong> questions = mix of AMBITION + ANXIETY
                    {karmaModel.careerN > 0 && (
                      <span style={{ color: '#6a6a7c' }}>
                        {' '}
                        · sample: {karmaModel.careerAmb} AMBITION / {karmaModel.careerAnx} ANXIETY intent tags
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4 — Session journey */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>How do life questions evolve in a session?</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 12px' }}>
                  First Q category → second Q category → count (sorted by userHash + time; consecutive rows per user)
                </p>
                {karmaModel.journeyUseMock && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#fbbf24',
                      marginBottom: 10,
                      padding: '6px 10px',
                      background: 'rgba(251,191,36,0.06)',
                      borderRadius: 8,
                    }}
                  >
                    Sample rows — real transitions appear when users ask multiple distinct categories in sequence.
                  </div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#16161e' }}>
                      {['First category', 'Second category', 'Count', 'Source'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            color: '#888',
                            fontWeight: 600,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {karmaModel.journeyDisplay.map((row, i) => (
                      <tr key={`${row.from}-${row.to}-${i}`} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '10px 12px', color: '#ddd' }}>{row.from}</td>
                        <td style={{ padding: '10px 12px', color: '#ddd' }}>{row.to}</td>
                        <td style={{ padding: '10px 12px', color: GOLD, fontWeight: 600 }}>{row.count}</td>
                        <td style={{ padding: '10px 12px', color: '#6a6a7c', fontSize: 11 }}>
                          {row.mock ? 'Mock example' : 'Derived from logs'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SECTION 5 — Age × concern */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>Life concerns by age group</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 12px' }}>
                  Grouped bars: age cohort vs question category
                </p>
                {karmaModel.ageUseMock && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#fbbf24',
                      marginBottom: 10,
                      padding: '6px 10px',
                      background: 'rgba(251,191,36,0.06)',
                      borderRadius: 8,
                    }}
                  >
                    Sample — populates with usage: <strong style={{ color: '#fcd34d' }}>ageGroup</strong> not yet in logs;
                    illustrative distribution only.
                  </div>
                )}
                <div style={{ height: 300, position: 'relative' }}>
                  <ChartJsBar
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#a8a8b8', font: { size: 9 }, boxWidth: 10 } },
                      },
                      scales: {
                        x: { ...axisCommon, stacked: false },
                        y: { ...axisCommon, beginAtZero: true, stacked: false },
                      },
                    }}
                    data={{
                      labels: karmaModel.stackCats,
                      datasets: karmaModel.ageDatasets.map((d) => ({ ...d, borderWidth: 0, borderRadius: 4 })),
                    }}
                  />
                </div>
              </div>

              {/* SECTION 6 — Language × depth */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>Does language affect emotional openness?</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 14px' }}>
                  Hindi vs English — averages from logs sample (other languages excluded from this head-to-head)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    {
                      title: 'Hindi users',
                      n: karmaModel.hiN,
                      rows: [
                        ['Avg session depth', karmaModel.hiAvgDepth.toFixed(2)],
                        ['% URGENT / DESPERATE', `${(karmaModel.hiUrgentFrac * 100).toFixed(1)}%`],
                        ['Avg cost (INR)', `₹${karmaModel.hiAvgCost.toFixed(4)}`],
                      ],
                    },
                    {
                      title: 'English users',
                      n: karmaModel.enN,
                      rows: [
                        ['Avg session depth', karmaModel.enAvgDepth.toFixed(2)],
                        ['% URGENT / DESPERATE', `${(karmaModel.enUrgentFrac * 100).toFixed(1)}%`],
                        ['Avg cost (INR)', `₹${karmaModel.enAvgCost.toFixed(4)}`],
                      ],
                    },
                  ].map((col) => (
                    <div key={col.title} style={{ background: '#16161e', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{col.title}</div>
                      <div style={{ fontSize: 11, color: '#6a6a7c', marginTop: 4 }}>{col.n} rows in sample</div>
                      <table style={{ width: '100%', marginTop: 12, fontSize: 12 }}>
                        <tbody>
                          {col.rows.map(([k, v]) => (
                            <tr key={k}>
                              <td style={{ padding: '6px 0', color: '#9a9aaa' }}>{k}</td>
                              <td style={{ padding: '6px 0', textAlign: 'right', color: '#e8e8ee', fontWeight: 600 }}>{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 7 — Timing heatmap */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>When do people seek cosmic guidance?</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 12px' }}>
                  Heatmap: hour of day (0–23) × weekday · intensity = question volume in logs sample
                </p>
                <div style={{ fontSize: 12, color: '#b8b8c8', marginBottom: 12, lineHeight: 1.5 }}>
                  <div>{karmaModel.peakInsight}</div>
                  <div style={{ marginTop: 6 }}>{karmaModel.lowInsight}</div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `32px repeat(7, minmax(0, 1fr))`,
                    gap: 3,
                    fontSize: 10,
                    alignItems: 'stretch',
                  }}
                >
                  <div />
                  {WEEKDAY_LABELS.map((d) => (
                    <div key={d} style={{ textAlign: 'center', color: '#8a8a9a', fontWeight: 600 }}>
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: 24 }, (_, h) => (
                    <Fragment key={`heat-row-${h}`}>
                      <div style={{ color: '#7a7a8c', textAlign: 'right', paddingRight: 4 }}>{h}</div>
                      {WEEKDAY_LABELS.map((_, wd) => {
                        const v = karmaModel.heat[h][wd];
                        const a = v / karmaModel.heatMax;
                        return (
                          <div
                            key={`${h}-${wd}`}
                            title={`${h}:00 · ${WEEKDAY_LABELS[wd]} · ${v} questions`}
                            style={{
                              borderRadius: 3,
                              minHeight: 16,
                              background: `rgba(201, 169, 110, ${0.08 + a * 0.92})`,
                              border: `1px solid rgba(201,169,110,${0.12 + a * 0.35})`,
                            }}
                          />
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>

              {/* SECTION 8 — Buyer intelligence */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 12px' }}>Who would buy this data?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  {(
                    [
                      {
                        icon: '🎓',
                        title: 'ACADEMIC RESEARCH',
                        who: 'IITs, Psychology depts',
                        val: 'Behavioral patterns linked to verified astrological configurations',
                        need: 10_000,
                      },
                      {
                        icon: '🏦',
                        title: 'INSURANCE / FINTECH',
                        who: 'Life stage prediction',
                        val: 'When people are in major life transitions (dasha change)',
                        need: 100_000,
                      },
                      {
                        icon: '🧠',
                        title: 'MENTAL HEALTH PLATFORMS',
                        who: 'Anxiety pattern detection',
                        val: 'Emotional tone + life area + timing',
                        need: 50_000,
                      },
                      {
                        icon: '🤖',
                        title: 'LLM TRAINING DATA',
                        who: 'Vedic reasoning dataset',
                        val: 'Hinglish Q&A with astrological context',
                        need: 500_000,
                      },
                    ] as const
                  ).map((card) => {
                    const pct = Math.min(100, (karmaModel.records / card.need) * 100);
                    return (
                      <div
                        key={card.title}
                        style={{
                          background: CARD,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 12,
                          padding: '16px 14px',
                        }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: 0.5 }}>{card.title}</div>
                        <div style={{ fontSize: 12, color: '#9a9aaf', marginTop: 6 }}>{card.who}</div>
                        <div style={{ fontSize: 12, color: '#c8c8d4', marginTop: 10, lineHeight: 1.45 }}>
                          <span style={{ color: '#7a7a8c' }}>Value: </span>
                          {card.val}
                        </div>
                        <div style={{ fontSize: 11, color: '#6a6a7c', marginTop: 10 }}>
                          Records needed: {card.need.toLocaleString()}+
                        </div>
                        <div style={{ height: 8, background: '#1a1a22', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: GOLD }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#8a8a9a', marginTop: 6 }}>
                          {karmaModel.records.toLocaleString()} / {card.need.toLocaleString()} = {pct.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 9 — Completeness tracker */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <h3 style={{ color: GOLD, fontSize: 15, margin: '0 0 4px' }}>Dataset quality score</h3>
                <p style={{ color: '#6a6a7c', fontSize: 12, margin: '0 0 14px' }}>
                  Sellable fields · filled counts extrapolated from logs sample to DB record total where applicable
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
                    <thead>
                      <tr style={{ background: '#16161e' }}>
                        {['Field', 'Filled (est.)', '%', 'Status'].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: 'left',
                              padding: '10px 12px',
                              color: '#888',
                              borderBottom: `1px solid ${BORDER}`,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {karmaModel.fieldRows.map((r) => (
                        <tr key={r.field} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: '10px 12px', color: '#ddd', fontFamily: 'monospace', fontSize: 11 }}>{r.field}</td>
                          <td style={{ padding: '10px 12px', color: '#ccc' }}>{r.filled}</td>
                          <td style={{ padding: '10px 12px', color: GOLD, fontWeight: 600 }}>{r.pct.toFixed(1)}%</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                color:
                                  r.status === 'ready' ? '#4ade80' : r.status === 'building' ? '#fbbf24' : '#94a3b8',
                              }}
                            >
                              {r.status === 'ready' ? '✅ Ready' : r.status === 'building' ? '🔄 Building' : '⏳ Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: `1px solid ${BORDER}`,
                    fontSize: 13,
                    color: '#c8c8d4',
                    lineHeight: 1.65,
                  }}
                >
                  <div>
                    Overall dataset value score:{' '}
                    <strong style={{ color: GOLD }}>Current: {karmaModel.overallCompletenessPct}% complete</strong>
                  </div>
                  <div style={{ color: '#9a9aaf', marginTop: 6 }}>At 50%: Dataset licensing possible</div>
                  <div style={{ color: '#9a9aaf' }}>At 80%: Premium pricing unlocked</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* MY CHARTS TAB */}
      {tab === 'mycharts' && (
        <div style={{ background: BG, borderRadius: 12, padding: '20px 16px 28px', border: `1px solid ${BORDER}` }}>
          <h2 style={{ color: GOLD, fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>My Charts</h2>
          <p style={{ color: '#7a7a8c', fontSize: 12, margin: '0 0 20px' }}>
            Build charts from admin stats logs, preview with Chart.js, save configs to the database (per admin email).
          </p>

          {/* PART A — builder */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 22,
            }}
          >
            <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 12px' }}>Chart builder</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 14,
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa' }}>
                Chart name
                <input
                  value={mcName}
                  onChange={(e) => setMcName(e.target.value)}
                  placeholder="e.g. Career vs tone"
                  style={{
                    background: '#16161e',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#e8e8ee',
                    fontSize: 13,
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa' }}>
                Chart type
                <select
                  value={mcType}
                  onChange={(e) => setMcType(e.target.value as MySavedChartType)}
                  style={{
                    background: '#16161e',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#e8e8ee',
                    fontSize: 13,
                  }}
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="doughnut">Doughnut</option>
                  <option value="pie">Pie</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa' }}>
                X axis
                <select
                  value={mcX}
                  onChange={(e) => setMcX(e.target.value)}
                  style={{
                    background: '#16161e',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#e8e8ee',
                    fontSize: 13,
                  }}
                >
                  {['questionCategory', 'emotionalTone', 'questionIntent', 'language', 'cacheHit', 'hour'].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa' }}>
                Y axis
                <select
                  value={mcY}
                  onChange={(e) => setMcY(e.target.value)}
                  style={{
                    background: '#16161e',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#e8e8ee',
                    fontSize: 13,
                  }}
                >
                  <option value="count">count</option>
                  <option value="avgCost">avgCost (INR)</option>
                  <option value="sessionDepth">sessionDepth (avg)</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa' }}>
                Group by (optional)
                <select
                  value={mcGroup}
                  onChange={(e) => setMcGroup(e.target.value)}
                  style={{
                    background: '#16161e',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#e8e8ee',
                    fontSize: 13,
                  }}
                >
                  <option value="none">none</option>
                  {['questionCategory', 'emotionalTone', 'questionIntent', 'language', 'cacheHit', 'hour'].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa', gridColumn: '1 / -1' }}>
                Description (optional)
                <input
                  value={mcDesc}
                  onChange={(e) => setMcDesc(e.target.value)}
                  placeholder="Short note for the gallery card"
                  style={{
                    background: '#16161e',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#e8e8ee',
                    fontSize: 13,
                  }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => runMcPreview()}
                style={{
                  background: CARD,
                  color: GOLD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Preview chart
              </button>
              <button
                type="button"
                onClick={() => void saveMcChart()}
                style={{
                  background: GOLD,
                  color: '#111',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Save chart
              </button>
            </div>
            {mcPreview && (
              <div style={{ marginTop: 18, height: 320, position: 'relative' }}>
                <Chart type={mcPreview.type} data={mcPreview.data} options={mcPreview.options} />
              </div>
            )}
          </div>

          {/* PART B — gallery */}
          <h3 style={{ color: GOLD, fontSize: 14, margin: '0 0 12px' }}>Saved charts gallery</h3>
          {myChartsLoading ? (
            <div style={{ color: '#888', padding: 24 }}>Loading saved charts…</div>
          ) : savedCharts.length === 0 ? (
            <div style={{ color: '#666', padding: 16, fontSize: 13 }}>No saved charts yet. Build one above and save.</div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {savedCharts.map((c: any) => {
                let parsed: { type?: MySavedChartType; data: any; options?: any } | null = null;
                try {
                  parsed = JSON.parse(c.chartConfig);
                } catch {
                  parsed = null;
                }
                const chartType = (parsed?.type || c.chartType || 'bar') as MySavedChartType;
                return (
                  <div
                    key={c.id}
                    style={{
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f6' }}>{c.chartName}</div>
                        {c.description && (
                          <div style={{ fontSize: 12, color: '#8a8a9a', marginTop: 4 }}>{c.description}</div>
                        )}
                        <div style={{ fontSize: 10, color: '#5a5a6c', marginTop: 6 }}>
                          {c.xAxis} · {c.yAxis}
                          {c.groupBy ? ` · group ${c.groupBy}` : ''}
                          {c.isPinned ? ' · pinned' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          title="Pin"
                          onClick={() => void toggleMcPin(c.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          📌
                        </button>
                        <button
                          type="button"
                          title="Edit name / description"
                          onClick={() =>
                            setMcEdit({
                              id: c.id,
                              chartName: c.chartName || '',
                              description: c.description || '',
                            })
                          }
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => void deleteMcChart(c.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={{ height: 220, position: 'relative' }}>
                      {parsed?.data ? (
                        <Chart type={chartType} data={parsed.data} options={parsed.options ?? {}} />
                      ) : (
                        <div style={{ color: '#f87171', fontSize: 12 }}>Could not parse chartConfig</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {mcEdit && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                padding: 16,
              }}
            >
              <div
                style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: 20,
                  maxWidth: 400,
                  width: '100%',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, marginBottom: 14 }}>Edit chart</div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa', marginBottom: 12 }}>
                  Name
                  <input
                    value={mcEdit.chartName}
                    onChange={(e) => setMcEdit({ ...mcEdit, chartName: e.target.value })}
                    style={{
                      background: '#16161e',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      color: '#e8e8ee',
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#9a9aaa', marginBottom: 16 }}>
                  Description
                  <input
                    value={mcEdit.description}
                    onChange={(e) => setMcEdit({ ...mcEdit, description: e.target.value })}
                    style={{
                      background: '#16161e',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      color: '#e8e8ee',
                    }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setMcEdit(null)}
                    style={{
                      background: 'transparent',
                      color: '#aaa',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      padding: '8px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveMcEdit()}
                    style={{
                      background: GOLD,
                      color: '#111',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPORTS HUB */}
      {tab === 'reports' && <AdminReportsHub backend={BACKEND} headers={headers} />}

      {profileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => !profileModal.loading && setProfileModal(null)}
        >
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, marginBottom: 6 }}>Profiles</div>
            <div style={{ fontSize: 12, color: '#8a8a9a', marginBottom: 14 }}>
              {profileModal.user?.email} · GET /api/profiles/admin?userId=
              {profileModal.user?.id}
            </div>
            {profileModal.loading ? (
              <div style={{ color: '#888', padding: 24 }}>Loading profiles…</div>
            ) : profileModal.profiles.length === 0 ? (
              <div style={{ color: '#666', fontSize: 13 }}>No profiles for this user.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#16161e' }}>
                    {['Name', 'DOB', 'Actions'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#888', borderBottom: `1px solid ${BORDER}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profileModal.profiles.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 10px', color: '#eee' }}>{p.name || '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#aaa', fontSize: 12 }}>{p.dateOfBirth || '—'}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => void applyOracleFromProfile(profileModal.user, p, { redirect: false })}
                            style={{
                              background: '#2a2540',
                              color: '#c4b5fd',
                              border: '1px solid #4c3f6b',
                              borderRadius: 6,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Switch profile
                          </button>
                          <button
                            type="button"
                            onClick={() => void applyOracleFromProfile(profileModal.user, p, { redirect: true })}
                            style={{
                              background: GOLD,
                              color: '#111',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            Load in Oracle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                disabled={profileModal.loading}
                onClick={() => setProfileModal(null)}
                style={{
                  background: 'transparent',
                  color: '#aaa',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: profileModal.loading ? 'not-allowed' : 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
