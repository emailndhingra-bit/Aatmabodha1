import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Doughnut, Bar as ChartJsBar, Line, Pie } from 'react-chartjs-2';
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

const USD_TO_INR = 92.47;
const GOLD = '#c9a96e';
const BG = '#0a0a0f';
const CARD = '#12121a';
const BORDER = '#2a2a38';

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

const REPORT_TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  life_book: { bg: 'rgba(139, 92, 246, 0.28)', color: '#d8b4fe' },
  hidden_gems: { bg: 'rgba(245, 158, 11, 0.22)', color: '#fcd34d' },
  daily_forecast: { bg: 'rgba(59, 130, 246, 0.22)', color: '#93c5fd' },
  btr: { bg: 'rgba(34, 197, 94, 0.22)', color: '#86efac' },
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
  };
}

const chartFont = { family: 'system-ui, sans-serif' };
const axisCommon = {
  ticks: { color: '#8a8a9a', font: chartFont },
  grid: { color: BORDER },
  border: { color: BORDER },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<'users' | 'questions' | 'cost' | 'reports'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [reportStats, setReportStats] = useState<{
    totalReports: number;
    todayCount: number;
    weekCount: number;
    countByType: Record<string, number>;
  } | null>(null);
  const [reportList, setReportList] = useState<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [adminQuestionRows, setAdminQuestionRows] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [analyticsUpdatedAt, setAnalyticsUpdatedAt] = useState<number | null>(null);
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false);

  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    const r = await fetch(`${BACKEND}/api/auth/admin/users`, { headers });
    const d = await r.json();
    setUsers(Array.isArray(d) ? d : []);
  };

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

  const refreshAnalytics = useCallback(async () => {
    setAnalyticsRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchUsers()]);
      setAnalyticsUpdatedAt(Date.now());
    } finally {
      setAnalyticsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== 'questions') return;
    void fetchAdminQuestions();
  }, [tab]);

  const fetchReportStats = async () => {
    const r = await fetch(`${BACKEND}/api/admin/reports/stats`, { headers });
    if (!r.ok) return;
    setReportStats(await r.json());
  };

  const fetchReportList = async () => {
    setReportsLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(reportsPage), limit: '50' });
      if (reportTypeFilter) qs.set('type', reportTypeFilter);
      const r = await fetch(`${BACKEND}/api/admin/reports?${qs}`, { headers });
      if (r.ok) setReportList(await r.json());
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'reports') return;
    fetchReportStats();
  }, [tab]);

  useEffect(() => {
    if (tab !== 'reports') return;
    fetchReportList();
  }, [tab, reportsPage, reportTypeFilter]);

  const mostPopularReportType = useMemo(() => {
    const c = reportStats?.countByType;
    if (!c || !Object.keys(c).length) return '—';
    let best = '';
    let max = -1;
    for (const [k, v] of Object.entries(c)) {
      if (v > max) {
        max = v;
        best = k;
      }
    }
    return best || '—';
  }, [reportStats]);

  const reportChartData = useMemo(() => {
    const c = reportStats?.countByType ?? {};
    return Object.entries(c)
      .map(([reportType, count]) => ({ reportType, count }))
      .sort((a, b) => a.reportType.localeCompare(b.reportType));
  }, [reportStats]);

  const reportPagination = useMemo(() => {
    if (!reportList) return { totalPages: 1, canNext: false, canPrev: reportsPage > 1 };
    const totalPages = Math.max(1, Math.ceil(reportList.total / reportList.limit));
    return {
      totalPages,
      canNext: reportsPage < totalPages,
      canPrev: reportsPage > 1,
    };
  }, [reportList, reportsPage]);

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

  if (loading) return <div style={{ padding: 40, color: '#ccc', background: '#0d0d1a', minHeight: '100vh' }}>Loading admin data...</div>;

  return (
    <div style={{ background: '#0d0d1a', minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#c9a84c', fontSize: 20, fontWeight: 600, marginBottom: 24, letterSpacing: 2, textTransform: 'uppercase' }}>
        Admin Dashboard
      </h1>

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
        {(['users', 'questions', 'cost', 'reports'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', cursor: 'pointer', border: 'none', borderRadius: '8px 8px 0 0',
            background: tab === t ? '#1a1a3e' : 'transparent',
            color: tab === t ? '#c9a84c' : '#666',
            fontWeight: tab === t ? 600 : 400,
            fontSize: 13, textTransform: 'capitalize',
            borderBottom: tab === t ? '2px solid #c9a84c' : '2px solid transparent',
          }}>
            {t === 'users' ? `Users (${users.length})` : t === 'questions' ? 'Questions' : t === 'cost' ? 'Analytics' : 'Reports'}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1a1a2e' }}>
                {['Name', 'Email', 'Status', 'Questions', 'Actions'].map(h => (
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
                  <td style={{ padding: '12px 14px', color: '#ddd' }}>{u.questionsUsed ?? 0}/{u.questionsLimit ?? 60}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                KPIs from DB totals · charts from recent <code style={{ color: '#9a9aaa' }}>logs</code> sample (up to 200 rows)
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

      {/* REPORTS TAB */}
      {tab === 'reports' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Reports', val: reportStats !== null ? reportStats.totalReports : '—' },
              { label: 'Today', val: reportStats !== null ? reportStats.todayCount : '—' },
              { label: 'This Week', val: reportStats !== null ? reportStats.weekCount : '—' },
              { label: 'Most Popular Type', val: reportStats !== null ? mostPopularReportType : '—' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10, padding: '12px 18px', minWidth: 130 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#c9a84c' }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <h3 style={{ color: '#c9a84c', fontSize: 14, marginBottom: 12 }}>Reports by type</h3>
            {reportChartData.length === 0 ? (
              <div style={{ color: '#666', padding: 32, textAlign: 'center', fontSize: 13 }}>No report counts yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={reportChartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                  <XAxis dataKey="reportType" tick={{ fill: '#888', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#ccc' }}
                    labelStyle={{ color: '#c9a84c' }}
                  />
                  <RechartsBar dataKey="count" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: '#888' }}>Type</label>
            <select
              value={reportTypeFilter}
              onChange={e => {
                setReportTypeFilter(e.target.value);
                setReportsPage(1);
              }}
              style={{
                background: '#1a1a2e',
                color: '#ddd',
                border: '1px solid #2a2a4a',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                minWidth: 180,
              }}
            >
              <option value="">All</option>
              <option value="life_book">life_book</option>
              <option value="hidden_gems">hidden_gems</option>
              <option value="daily_forecast">daily_forecast</option>
              <option value="btr">btr</option>
            </select>
          </div>

          {reportsLoading && !reportList ? (
            <div style={{ color: '#666', padding: 20, fontSize: 13 }}>Loading reports…</div>
          ) : (
            <>
              {reportsLoading && reportList && (
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Refreshing…</div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1a1a2e' }}>
                      {['Time', 'User Hash', 'Profile', 'Type', 'Title', 'Language'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#888', fontWeight: 500, borderBottom: '1px solid #2a2a4a' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportList?.items ?? []).map((row: any) => {
                      const badge = REPORT_TYPE_BADGE[row.reportType] ?? { bg: '#2a2a4a', color: '#ccc' };
                      const uid = String(row.userId ?? '');
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                          <td style={{ padding: '10px 12px', color: '#666', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#888', fontFamily: 'monospace' }}>{uid.slice(0, 8)}</td>
                          <td style={{ padding: '10px 12px', color: '#ccc' }}>{row.profileName ?? '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                              {row.reportType}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#ccc', maxWidth: 280 }}>{row.title ?? '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#aaa' }}>{row.language ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {(!reportList?.items || reportList.items.length === 0) && !reportsLoading && (
                <div style={{ color: '#666', padding: 16, fontSize: 13 }}>No reports in this view.</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Page {reportList?.page ?? reportsPage} · {reportList?.total ?? 0} total
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={!reportPagination.canPrev || reportsLoading}
                    onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                    style={{
                      background: !reportPagination.canPrev ? '#2a2a3e' : '#1a1a3e',
                      color: !reportPagination.canPrev ? '#555' : '#c9a84c',
                      border: '1px solid #2a2a4a',
                      borderRadius: 8,
                      padding: '8px 16px',
                      cursor: !reportPagination.canPrev ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={reportsLoading || !reportList || !reportPagination.canNext}
                    onClick={() => setReportsPage(p => p + 1)}
                    style={{
                      background: !reportPagination.canNext || !reportList ? '#2a2a3e' : '#1a1a3e',
                      color: !reportPagination.canNext || !reportList ? '#555' : '#c9a84c',
                      border: '1px solid #2a2a4a',
                      borderRadius: 8,
                      padding: '8px 16px',
                      cursor: !reportPagination.canNext || !reportList ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
