import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { buildChildDestinyPromptParts, extractChartData } from '../services/childDestinyReportService';
import { generateReportPDF } from '../services/reportPdfGenerator';

const GOLD = '#c9a96e';
const NAVY = '#0c1222';
const CARD = '#12121a';
const BORDER = '#2a2a38';
const MUTED = '#8a8a9a';

const REPORT_TILES = [
  {
    id: 'career_clarity',
    icon: '💼',
    name: 'Career Clarity Report',
    blurb: 'Professional path, strengths, and timing from the 10th house lens.',
    questions: '22 Q',
    pages: '~40 pages',
    price: '₹1,999',
    dual: false,
    tiers: [{ v: 'standard', l: 'Standard — ₹1,999' }],
  },
  {
    id: 'business_founder',
    icon: '📈',
    name: 'Business Founder Report',
    blurb: 'Partnership, capital cycles, and execution windows.',
    questions: '24 Q',
    pages: '~50 pages',
    price: '₹2,499–₹3,999',
    dual: false,
    tiers: [
      { v: 'growth', l: 'Growth — ₹2,499' },
      { v: 'scale', l: 'Scale — ₹3,999' },
    ],
  },
  {
    id: 'kundli_match_plus',
    icon: '💍',
    name: 'Kundli Match Plus',
    blurb: 'Deep synastry with koota-style harmony and shared timeline.',
    questions: '26 Q',
    pages: '~35 pages',
    price: '₹1,499–₹2,999',
    dual: true,
    tiers: [
      { v: 'essential', l: 'Essential — ₹1,499' },
      { v: 'premium', l: 'Premium — ₹2,999' },
    ],
  },
  {
    id: 'vibe_check',
    icon: '✨',
    name: 'Vibe Check',
    blurb: 'Lightweight chemistry read — eight thematic sections.',
    questions: '8 sections',
    pages: '~6 pages',
    price: '₹199–₹299',
    dual: true,
    tiers: [
      { v: 'lite', l: 'Lite — ₹199' },
      { v: 'plus', l: 'Plus — ₹299' },
    ],
  },
  {
    id: 'child_destiny',
    icon: '🌟',
    name: 'Child Destiny Report',
    blurb: 'Temperament, learning style, and nurturing guidance — never fear-based.',
    questions: '28 Q',
    pages: '~38 pages',
    price: '₹1,999–₹3,499',
    dual: false,
    tiers: [
      { v: 'guide', l: 'Guide — ₹1,999' },
      { v: 'deep', l: 'Deep — ₹3,499' },
    ],
  },
] as const;

type ProfileRow = {
  id: string;
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string | null;
  userId: string;
  ownerEmail: string | null;
};

type HubStats = { totalGenerated: number; thisMonth: number; avgGenerationMin: string };

type GenRow = {
  id: string;
  reportType: string;
  person: string;
  generated: string;
  pages: number;
  pdfUrl: string | null;
};

type Props = { backend: string; headers: Record<string, string> };

export default function AdminReportsHub({ backend, headers }: Props) {
  const [stats, setStats] = useState<HubStats | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [history, setHistory] = useState<{ items: GenRow[]; total: number; page: number; limit: number } | null>(null);
  const [histPage, setHistPage] = useState(1);
  const [msg, setMsg] = useState('');

  const [childDestinyProfileId, setChildDestinyProfileId] = useState('');
  const [childGenerating, setChildGenerating] = useState(false);
  const [childReportStatus, setChildReportStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTile, setActiveTile] = useState<(typeof REPORT_TILES)[number] | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [profileA, setProfileA] = useState('');
  const [profileB, setProfileB] = useState('');
  const [tier, setTier] = useState('');
  const [language, setLanguage] = useState('Hinglish');
  const [familyBiz, setFamilyBiz] = useState(false);

  const [overlay, setOverlay] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [lastResult, setLastResult] = useState<{ id: string; pdfUrl: string | null; pageCount: number } | null>(null);

  const loadStats = useCallback(async () => {
    const r = await fetch(`${backend}/api/admin/reports-hub/stats`, { headers });
    if (r.ok) setStats(await r.json());
  }, [backend, headers]);

  const loadProfiles = useCallback(async () => {
    const qs = profileSearch.trim() ? `?search=${encodeURIComponent(profileSearch.trim())}` : '';
    const r = await fetch(`${backend}/api/admin/reports-hub/profiles${qs}`, { headers });
    if (r.ok) setProfiles(await r.json());
  }, [backend, headers, profileSearch]);

  const loadHistory = useCallback(async () => {
    const r = await fetch(`${backend}/api/admin/reports-hub/generated?page=${histPage}&limit=15`, { headers });
    if (r.ok) setHistory(await r.json());
  }, [backend, headers, histPage]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    const t = setTimeout(() => void loadProfiles(), 280);
    return () => clearTimeout(t);
  }, [loadProfiles]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const sectionLabels = useMemo(() => {
    if (!activeTile) return ['Section 1: Planetary Profile', 'Section 2: Career Direction', 'Section 3: Synthesis'];
    if (activeTile.id === 'vibe_check') return ['Section 1: First Impression', 'Section 2: Values & Pace', 'Section 3: Flags'];
    return ['Section 1: Foundation', 'Section 2: Core Analysis', 'Section 3: Timing & Guidance'];
  }, [activeTile]);

  useEffect(() => {
    if (!overlay) return;
    const id = window.setInterval(() => {
      setProgressIdx((i) => (i + 1) % 3);
    }, 2200);
    return () => clearInterval(id);
  }, [overlay]);

  const openGenerate = (tile: (typeof REPORT_TILES)[number]) => {
    setActiveTile(tile);
    setTier(tile.tiers[0]?.v ?? '');
    setStep(1);
    setProfileA('');
    setProfileB('');
    setLanguage('Hinglish');
    setFamilyBiz(false);
    setModalOpen(true);
  };

  const scrollToHistory = () => {
    document.getElementById('admin-reports-history')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChildDestinyReport = async () => {
    if (!childDestinyProfileId) return;
    setChildGenerating(true);
    setChildReportStatus('Fetching chart from engine…');
    try {
      const chartRes = await fetch(
        `${backend}/api/admin/reports-hub/profile/${encodeURIComponent(childDestinyProfileId)}/chart`,
        { headers },
      );
      if (!chartRes.ok) {
        const errBody = await chartRes.text();
        throw new Error(errBody || `HTTP ${chartRes.status}`);
      }
      const rawChart = (await chartRes.json()) as Record<string, unknown>;
      const hint = profiles.find((p) => p.id === childDestinyProfileId);
      const chartData = extractChartData(rawChart, {
        name: hint?.name,
        dateOfBirth: hint?.dateOfBirth,
      });
      const promptParts = buildChildDestinyPromptParts(chartData);
      setChildReportStatus('Generating Child Destiny Report (3 AI passes, ~2–6 min)…');
      const response = await fetch(`${backend}/api/reports/child-destiny`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptParts }),
      });
      const data = (await response.json().catch(() => ({}))) as { report?: string; message?: string };
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
      const report = String(data.report || '');
      if (!report.trim()) throw new Error('Empty report from server');
      await generateReportPDF(report, chartData.childName);
      setChildReportStatus('Print dialog opened — choose Save as PDF to download.');
    } catch (error) {
      setChildReportStatus('Error generating report. Try again.');
      console.error(error);
    } finally {
      setChildGenerating(false);
    }
  };

  const runGenerate = async () => {
    if (!activeTile) return;
    if (!profileA) {
      setMsg('Select a primary profile.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    if (activeTile.dual && !profileB) {
      setMsg('Select a second profile for this report.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setModalOpen(false);
    setOverlay(true);
    setProgressIdx(0);
    setLastResult(null);
    try {
      const body: Record<string, unknown> = {
        reportType: activeTile.id,
        profileIdA: profileA,
        language,
        tier: tier || undefined,
        flags: activeTile.id === 'business_founder' ? { familyBusiness: familyBiz } : {},
      };
      if (activeTile.dual) body.profileIdB = profileB;
      const r = await fetch(`${backend}/api/admin/reports-hub/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data as { message?: string }).message || `HTTP ${r.status}`);
      setLastResult({ id: data.id, pdfUrl: data.pdfUrl, pageCount: data.pageCount });
      setStep(5);
      setModalOpen(true);
      void loadStats();
      void loadHistory();
    } catch (e) {
      setMsg((e as Error).message || 'Generation failed');
      setTimeout(() => setMsg(''), 5000);
      setStep(1);
      setModalOpen(true);
    } finally {
      setOverlay(false);
    }
  };

  const downloadPdf = async (id: string) => {
    const r = await fetch(`${backend}/api/admin/reports-hub/generated/${id}/pdf`, { headers });
    if (!r.ok) {
      setMsg('Download failed');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewPdf = async (id: string) => {
    const r = await fetch(`${backend}/api/admin/reports-hub/generated/${id}/pdf`, { headers });
    if (!r.ok) return;
    const blob = await r.blob();
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Delete this generated report?')) return;
    const r = await fetch(`${backend}/api/admin/reports-hub/generated/${id}`, { method: 'DELETE', headers });
    if (r.ok) void loadHistory();
  };

  const regenerateRow = async (id: string) => {
    setOverlay(true);
    try {
      const r = await fetch(`${backend}/api/admin/reports-hub/generated/${id}/regenerate`, { method: 'POST', headers });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data as { message?: string }).message || `HTTP ${r.status}`);
      setLastResult({ id: data.id, pdfUrl: data.pdfUrl, pageCount: data.pageCount });
      setStep(5);
      setModalOpen(true);
      void loadStats();
      void loadHistory();
    } catch (e) {
      setMsg((e as Error).message || 'Regenerate failed');
      setTimeout(() => setMsg(''), 5000);
    } finally {
      setOverlay(false);
    }
  };

  const profileLabel = (id: string) => profiles.find((p) => p.id === id)?.name || id.slice(0, 8);

  return (
    <div style={{ color: '#ddd' }}>
      {msg && (
        <div style={{ background: '#3a1a1a', color: '#ffb4b4', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 26, color: GOLD, margin: '0 0 8px', letterSpacing: '0.02em' }}>Generate Reports</h2>
        <p style={{ color: MUTED, fontSize: 14, maxWidth: 560, lineHeight: 1.55, margin: 0 }}>
          AI-powered Vedic astrology reports for any chart in the database
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Reports Generated', val: stats ? String(stats.totalGenerated) : '—' },
          { label: 'This Month', val: stats ? String(stats.thisMonth) : '—' },
          { label: 'Avg Generation', val: stats && stats.avgGenerationMin !== '—' ? `${stats.avgGenerationMin} min` : '—' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: `linear-gradient(145deg, ${NAVY}, #161e2e)`,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '14px 22px',
              minWidth: 160,
              boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: GOLD }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div
        id="child-destiny-report-panel"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(201,169,110,0.3)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
          maxWidth: 920,
        }}
      >
        <div style={{ color: GOLD, fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Child Destiny Report</div>
        <div style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>
          Select a saved profile (coordinates required). Fetches live Replit chart JSON, runs Gemini (3 parts), then opens print/PDF.
        </div>

        <select
          value={childDestinyProfileId}
          onChange={(e) => setChildDestinyProfileId(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: 8,
            color: '#94a3b8',
            padding: '10px 16px',
            width: '100%',
            marginBottom: 12,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          <option value="">-- Select user profile --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.userId.slice(0, 8)}…)
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void handleChildDestinyReport()}
          disabled={!childDestinyProfileId || childGenerating}
          style={{
            background: childGenerating ? 'rgba(201,169,110,0.3)' : 'rgba(201,169,110,0.15)',
            border: '1px solid rgba(201,169,110,0.5)',
            borderRadius: 8,
            color: GOLD,
            padding: '12px 24px',
            cursor: childDestinyProfileId && !childGenerating ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: 14,
            width: '100%',
          }}
        >
          {childGenerating ? 'Generating report (multi-part)…' : 'Generate Child Destiny Report'}
        </button>

        {childReportStatus && (
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{childReportStatus}</div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 18,
          marginBottom: 36,
          maxWidth: 920,
        }}
      >
        {REPORT_TILES.map((tile) => (
          <div
            key={tile.id}
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: `1px solid ${BORDER}`,
              background: CARD,
              boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                background: `linear-gradient(90deg, #0a1628, #152238)`,
                padding: '14px 16px',
                borderBottom: `1px solid rgba(201,169,110,0.25)`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>{tile.icon}</span>
              <div style={{ fontWeight: 700, color: '#f5f0e6', fontSize: 15 }}>{tile.name}</div>
            </div>
            <div style={{ padding: '14px 16px', flex: 1 }}>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, margin: '0 0 12px' }}>{tile.blurb}</p>
              <div style={{ fontSize: 12, color: '#b8b8c8', marginBottom: 8 }}>
                {tile.pages ? `${tile.questions} · ${tile.pages}` : tile.questions}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{tile.price}</div>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <button
                type="button"
                onClick={() => {
                  if (tile.id === 'child_destiny') {
                    document.getElementById('child-destiny-report-panel')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    openGenerate(tile);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${GOLD}`,
                  background: 'linear-gradient(180deg, rgba(201,169,110,0.2), rgba(201,169,110,0.05))',
                  color: GOLD,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {tile.id === 'child_destiny' ? 'Quick panel ↓' : 'Generate →'}
              </button>
            </div>
          </div>
        ))}

        <div
          style={{
            borderRadius: 14,
            overflow: 'hidden',
            border: `1px solid ${BORDER}`,
            background: CARD,
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              background: `linear-gradient(90deg, #0a1628, #152238)`,
              padding: '14px 16px',
              borderBottom: `1px solid rgba(201,169,110,0.25)`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>📋</span>
            <div style={{ fontWeight: 700, color: '#f5f0e6', fontSize: 15 }}>Report History</div>
          </div>
          <div style={{ padding: '14px 16px', flex: 1 }}>
            <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, margin: '0 0 12px' }}>
              View all past generated reports — download, preview, or regenerate from one place.
            </p>
            <div style={{ fontSize: 12, color: '#b8b8c8', marginBottom: 8 }}>Table below · paginated</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>Admin only</div>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <button
              type="button"
              onClick={scrollToHistory}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${GOLD}`,
                background: 'linear-gradient(180deg, rgba(201,169,110,0.12), rgba(201,169,110,0.03))',
                color: GOLD,
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              View history →
            </button>
          </div>
        </div>
      </div>

      <h3 id="admin-reports-history" style={{ color: GOLD, fontSize: 16, marginBottom: 12 }}>
        Report history
      </h3>
      <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: NAVY }}>
              {['Report Type', 'Person', 'Generated', 'Pages', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: MUTED, fontWeight: 600, borderBottom: `1px solid ${BORDER}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(history?.items ?? []).map((row) => (
              <tr key={row.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: '12px 14px', color: '#e8e8ee' }}>{row.reportType}</td>
                <td style={{ padding: '12px 14px', color: '#ccc' }}>{row.person}</td>
                <td style={{ padding: '12px 14px', color: '#888', fontSize: 12 }}>{row.generated ? new Date(row.generated).toLocaleString() : '—'}</td>
                <td style={{ padding: '12px 14px' }}>{row.pages}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => void downloadPdf(row.id)} style={miniBtn}>
                      Download
                    </button>
                    <button type="button" onClick={() => void previewPdf(row.id)} style={miniBtn}>
                      Preview
                    </button>
                    <button type="button" onClick={() => void regenerateRow(row.id)} style={miniBtn}>
                      Regenerate
                    </button>
                    <button type="button" onClick={() => void deleteRow(row.id)} style={{ ...miniBtn, color: '#f87171' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!history?.items || history.items.length === 0) && (
          <div style={{ padding: 20, color: '#666', fontSize: 13 }}>No generated PDFs yet.</div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <span style={{ fontSize: 12, color: '#666' }}>
          Page {history?.page ?? histPage} · {history?.total ?? 0} total
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" disabled={histPage <= 1} onClick={() => setHistPage((p) => Math.max(1, p - 1))} style={miniBtn}>
            Previous
          </button>
          <button
            type="button"
            disabled={!history || histPage * (history.limit || 15) >= (history.total || 0)}
            onClick={() => setHistPage((p) => p + 1)}
            style={miniBtn}
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen && activeTile && (
        <div style={modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            {step < 5 && (
              <>
                <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.12em', marginBottom: 6 }}>CONFIGURE</div>
                <h3 style={{ margin: '0 0 16px', color: '#f5f0e6', fontSize: 18 }}>Configure {activeTile.name}</h3>
                {step === 1 && (
                  <div>
                    <p style={{ color: MUTED, fontSize: 13 }}>Step 1 — Confirm report</p>
                    <button type="button" style={primaryBtn} onClick={() => setStep(2)}>
                      Continue
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <p style={{ color: MUTED, fontSize: 13, marginBottom: 10 }}>Step 2 — Profiles (search)</p>
                    <input
                      value={profileSearch}
                      onChange={(e) => setProfileSearch(e.target.value)}
                      placeholder="Search name or place…"
                      style={inputStyle}
                    />
                    <label style={labelStyle}>Primary profile</label>
                    <select value={profileA} onChange={(e) => setProfileA(e.target.value)} style={inputStyle}>
                      <option value="">— Select —</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.dateOfBirth} · {p.placeOfBirth || '—'}
                        </option>
                      ))}
                    </select>
                    {activeTile.dual && (
                      <>
                        <label style={labelStyle}>Second profile</label>
                        <select value={profileB} onChange={(e) => setProfileB(e.target.value)} style={inputStyle}>
                          <option value="">— Select —</option>
                          {profiles
                            .filter((p) => p.id !== profileA)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} · {p.dateOfBirth} · {p.placeOfBirth || '—'}
                              </option>
                            ))}
                        </select>
                      </>
                    )}
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button type="button" style={ghostBtn} onClick={() => setStep(1)}>
                        Back
                      </button>
                      <button type="button" style={primaryBtn} onClick={() => setStep(3)}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <p style={{ color: MUTED, fontSize: 13, marginBottom: 10 }}>Step 3 — Options</p>
                    {activeTile.tiers.length > 0 && (
                      <>
                        <label style={labelStyle}>Tier</label>
                        <select value={tier} onChange={(e) => setTier(e.target.value)} style={inputStyle}>
                          {activeTile.tiers.map((t) => (
                            <option key={t.v} value={t.v}>
                              {t.l}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    <label style={labelStyle}>Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} style={inputStyle}>
                      <option>Hindi</option>
                      <option>English</option>
                      <option>Hinglish</option>
                    </select>
                    {activeTile.id === 'business_founder' && (
                      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={familyBiz} onChange={(e) => setFamilyBiz(e.target.checked)} />
                        Family business context
                      </label>
                    )}
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button type="button" style={ghostBtn} onClick={() => setStep(2)}>
                        Back
                      </button>
                      <button type="button" style={primaryBtn} onClick={() => setStep(4)}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div>
                    <p style={{ color: MUTED, fontSize: 13, marginBottom: 10 }}>Step 4 — Ready to generate</p>
                    <ul style={{ color: '#bbb', fontSize: 12, lineHeight: 1.6 }}>
                      <li>Primary: {profileLabel(profileA)}</li>
                      {activeTile.dual && <li>Partner: {profileLabel(profileB)}</li>}
                      <li>Language: {language}</li>
                      {tier && <li>Tier: {tier}</li>}
                    </ul>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button type="button" style={ghostBtn} onClick={() => setStep(3)}>
                        Back
                      </button>
                      <button type="button" style={primaryBtn} onClick={() => void runGenerate()}>
                        Start generation
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {step === 5 && lastResult && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✦</div>
                <h3 style={{ color: GOLD, margin: '0 0 8px' }}>Report Ready!</h3>
                <p style={{ color: MUTED, fontSize: 13 }}>{lastResult.pageCount} pages · PDF stored securely</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 18 }}>
                  <button type="button" style={primaryBtn} onClick={() => void downloadPdf(lastResult.id)}>
                    📥 Download PDF
                  </button>
                  <button type="button" style={ghostBtn} onClick={() => void previewPdf(lastResult.id)}>
                    👁️ Preview
                  </button>
                  <button
                    type="button"
                    style={ghostBtn}
                    onClick={() => window.alert('Email delivery will connect to your mail provider — coming soon.')}
                  >
                    📧 Email to User
                  </button>
                </div>
                <button type="button" style={{ ...ghostBtn, marginTop: 20, width: '100%' }} onClick={() => { setModalOpen(false); setStep(1); }}>
                  Close
                </button>
              </div>
            )}
            {step < 5 && (
              <button type="button" style={{ ...ghostBtn, marginTop: 14, width: '100%' }} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {overlay && (
        <div style={fullOverlay}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div
              style={{
                width: 72,
                height: 72,
                margin: '0 auto 20px',
                borderRadius: '50%',
                border: `3px solid rgba(201,169,110,0.35)`,
                borderTopColor: GOLD,
                animation: 'spin 1.1s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 20, color: GOLD, marginBottom: 8 }}>Aatmabodha</div>
            <p style={{ color: '#ccc', fontSize: 15, marginBottom: 20 }}>Reading the chart…</p>
            <div style={{ height: 6, background: '#2a2a38', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
              <div
                style={{
                  height: '100%',
                  width: `${((progressIdx + 1) / 3) * 100}%`,
                  background: `linear-gradient(90deg, ${GOLD}, #8b6914)`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            {sectionLabels.map((label, i) => (
              <div key={label} style={{ fontSize: 12, color: i <= progressIdx ? '#86efac' : '#666', marginBottom: 6 }}>
                {label} {i < progressIdx ? '✓' : i === progressIdx ? '⟳' : '…'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const miniBtn: CSSProperties = {
  background: '#1a1a2e',
  color: GOLD,
  border: `1px solid ${BORDER}`,
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 11,
  cursor: 'pointer',
};

const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  zIndex: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const modalCard: CSSProperties = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  maxWidth: 480,
  width: '100%',
  padding: 24,
  boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
};

const primaryBtn: CSSProperties = {
  marginTop: 12,
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: GOLD,
  color: '#111',
  fontWeight: 700,
  cursor: 'pointer',
  width: '100%',
};

const ghostBtn: CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  background: 'transparent',
  color: '#ccc',
  cursor: 'pointer',
};

const inputStyle: CSSProperties = {
  width: '100%',
  marginBottom: 12,
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: '#0a0a10',
  color: '#eee',
  fontSize: 13,
};

const labelStyle: CSSProperties = { display: 'block', fontSize: 11, color: MUTED, marginBottom: 4 };

const fullOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 90,
  background: 'rgba(6,8,18,0.92)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(6px)',
};
