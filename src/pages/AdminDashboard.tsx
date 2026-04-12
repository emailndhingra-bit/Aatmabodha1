import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';

const USD_TO_INR = 92.47;

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
            { label: 'Total Questions', val: stats.totalQuestions ?? 0 },
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
            {t === 'users' ? `Users (${users.length})` : t === 'questions' ? 'Questions' : t === 'cost' ? 'Cost & Cache' : 'Reports'}
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

      {/* QUESTIONS TAB */}
      {tab === 'questions' && (
        <div>
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

      {/* COST TAB */}
      {tab === 'cost' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10, padding: 16 }}>
            <h3 style={{ color: '#c9a84c', fontSize: 14, marginBottom: 12 }}>
              Actual Spend (from DB — exact)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Total Cost (INR)', val: `₹${((stats?.totalCost ?? 0) * USD_TO_INR).toFixed(2)}` },
                { label: 'Avg Cost/Q (INR)', val: `₹${((stats?.avgCostPerQuestion ?? 0) * USD_TO_INR).toFixed(4)}` },
                { label: 'Cache Hit Questions', val: stats?.cacheHits ?? 0 },
                { label: 'Total Questions', val: stats?.totalQuestions ?? 0 },
              ].map(row => (
                <div key={row.label} style={{ background: '#141428', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{row.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#c9a84c' }}>{row.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 10, padding: 16 }}>
            <h3 style={{ color: '#c9a84c', fontSize: 14, marginBottom: 12 }}>In-memory response cache</h3>
            <div style={{ fontSize: 12, color: '#aaa', lineHeight: 2 }}>
              <div>Size: {stats?.cache?.size ?? 0} / {stats?.cache?.maxSize ?? 1000} entries</div>
              <div>TTL: {stats?.cache?.ttlHours ?? 6} hours</div>
            </div>
          </div>
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
                  <Bar dataKey="count" fill="#c9a84c" radius={[4, 4, 0, 0]} />
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
