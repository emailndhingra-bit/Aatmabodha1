import { useCallback, useEffect, useState, type CSSProperties } from 'react';

const BACKEND =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL) ||
  'https://aatmabodha1-backend.onrender.com';

const DEFAULT_ADMIN_EMAILS = 'emailndhingra@gmail.com,amol.xlri@gmail.com';

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: { VITE_ADMIN_EMAILS?: string } }).env?.VITE_ADMIN_EMAILS) ||
    DEFAULT_ADMIN_EMAILS;
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .includes(email.trim());
}

const GOLD = '#c9a96e';
const BG = '#0a0a0f';
const CARD = '#12121a';
const BORDER = '#2a2a38';

type SessionRow = {
  id: string;
  label: string;
  industry: string | null;
  stage: string | null;
  team_size: number;
  last_analysed: string | null;
  updatedAt: string;
};

export default function StartupVibeAdmin() {
  const [allowed, setAllowed] = useState(false);
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [fundingStatus, setFundingStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [detail, setDetail] = useState<SessionRow & { people?: unknown[] } | null>(null);
  const [pName, setPName] = useState('');
  const [pDob, setPDob] = useState('');
  const [pTob, setPTob] = useState('');
  const [pCity, setPCity] = useState('');
  const [pLat, setPLat] = useState('');
  const [pLon, setPLon] = useState('');
  const [pTz, setPTz] = useState('');
  const [pRole, setPRole] = useState('');

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;

  useEffect(() => {
    if (!token) {
      window.location.replace('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        const user = r.ok ? await r.json() : null;
        if (cancelled) return;
        if (!user || !isAdminEmail(user.email)) {
          window.location.replace('/');
          return;
        }
        setAllowed(true);
      } catch {
        if (!cancelled) window.location.replace('/');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(`${BACKEND}/api/admin/svc/sessions`, { headers });
      if (r.status === 401) {
        window.location.replace('/login');
        return;
      }
      if (!r.ok) {
        setErr(await r.text());
        return;
      }
      const data = await r.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setErr('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (allowed) void loadSessions();
  }, [allowed, loadSessions]);

  const openWizard = (existing?: SessionRow) => {
    setErr('');
    if (existing) {
      setSessionId(existing.id);
      setLabel(existing.label);
      setIndustry(existing.industry || '');
      setStage(existing.stage || '');
      setFundingStatus('');
      setNotes('');
      setStep(2);
      void refreshDetail(existing.id);
    } else {
      setSessionId(null);
      setLabel('');
      setIndustry('');
      setStage('');
      setFundingStatus('');
      setNotes('');
      setDetail(null);
      setStep(1);
    }
    setView('wizard');
  };

  const refreshDetail = async (id: string) => {
    const r = await fetch(`${BACKEND}/api/admin/svc/sessions/${id}`, { headers });
    if (r.ok) setDetail(await r.json());
  };

  const saveSessionStep1 = async () => {
    setErr('');
    if (!label.trim()) {
      setErr('Label is required');
      return;
    }
    try {
      if (sessionId) {
        setStep(2);
        await refreshDetail(sessionId);
        return;
      }
      const body: Record<string, unknown> = {
        label: label.trim(),
        industry: industry || undefined,
        stage: stage || undefined,
        fundingStatus: fundingStatus || undefined,
        notes: notes.trim() || undefined,
      };
      const r = await fetch(`${BACKEND}/api/admin/svc/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setErr(await r.text());
        return;
      }
      const created = await r.json();
      setSessionId(created.id);
      setDetail(created);
      setStep(2);
      void loadSessions();
    } catch {
      setErr('Save failed');
    }
  };

  const addPerson = async () => {
    if (!sessionId) return;
    setErr('');
    const body: Record<string, unknown> = {
      displayName: pName.trim(),
      dob: pDob,
      tob: pTob,
      pobCity: pCity.trim(),
    };
    if (pLat.trim() && pLon.trim()) {
      body.pobLat = parseFloat(pLat);
      body.pobLon = parseFloat(pLon);
    }
    if (pTz.trim()) body.pobTz = pTz.trim();
    if (pRole.trim()) body.rolePreference = pRole.trim();
    try {
      const r = await fetch(`${BACKEND}/api/admin/svc/sessions/${sessionId}/people`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setErr(await r.text());
        return;
      }
      setPName('');
      setPDob('');
      setPTob('');
      setPCity('');
      setPLat('');
      setPLon('');
      setPTz('');
      setPRole('');
      await refreshDetail(sessionId);
      void loadSessions();
    } catch {
      setErr('Add person failed');
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    const r = await fetch(`${BACKEND}/api/admin/svc/sessions/${id}`, { method: 'DELETE', headers });
    if (r.ok) void loadSessions();
  };

  if (!allowed) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#ddd', padding: 24, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ color: GOLD, margin: 0, fontSize: 22 }}>Startup Vibe Check</h1>
          <a href="/admin" style={{ color: GOLD, textDecoration: 'none', fontSize: 14 }}>
            ← Admin home
          </a>
        </div>
        {/* TODO(accent): confirm deeper amber/gold for admin tools — using shared GOLD for now */}
        {err && (
          <div style={{ background: '#3a1a1a', color: '#ffb4a8', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {err}
          </div>
        )}

        {view === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#888', fontSize: 13 }}>Admin-only · sessions</span>
              <button
                type="button"
                onClick={() => openWizard()}
                style={{
                  background: CARD,
                  color: GOLD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                New session
              </button>
            </div>
            {loading ? (
              <div style={{ color: '#888' }}>Loading…</div>
            ) : sessions.length === 0 ? (
              <div
                style={{
                  border: `1px dashed ${BORDER}`,
                  borderRadius: 12,
                  padding: 40,
                  textAlign: 'center',
                  color: '#666',
                }}
              >
                No sessions yet. Create one to analyse a founder team (Phase 2: analysis).
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Label', 'Industry', 'Stage', 'Team', 'Last analysed', ''].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: '#888', fontWeight: 500 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '10px 8px' }}>{s.label}</td>
                        <td style={{ padding: '10px 8px', color: '#aaa' }}>{s.industry || '—'}</td>
                        <td style={{ padding: '10px 8px', color: '#aaa' }}>{s.stage || '—'}</td>
                        <td style={{ padding: '10px 8px' }}>{s.team_size}</td>
                        <td style={{ padding: '10px 8px', color: '#666' }}>{s.last_analysed ?? '—'}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <button
                            type="button"
                            onClick={() => openWizard(s)}
                            style={{ marginRight: 8, background: 'transparent', color: GOLD, border: 'none', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteSession(s.id)}
                            style={{ background: 'transparent', color: '#f88', border: 'none', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === 'wizard' && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px 0',
                    borderRadius: 8,
                    background: step === n ? '#1a1a3e' : '#0f0f16',
                    color: step === n ? GOLD : '#555',
                    fontWeight: step === n ? 700 : 500,
                    fontSize: 12,
                  }}
                >
                  {n === 1 ? '1 · Session' : n === 2 ? '2 · People' : '3 · Review'}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
                <label style={{ fontSize: 12, color: '#888' }}>
                  Label *
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#111', color: '#eee' }}
                  />
                </label>
                <label style={{ fontSize: 12, color: '#888' }}>
                  Industry
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#111', color: '#eee' }}
                  >
                    <option value="">—</option>
                    {['SaaS', 'D2C', 'Deeptech', 'Services', 'Healthcare', 'Fintech', 'Edtech', 'Other'].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: '#888' }}>
                  Stage
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#111', color: '#eee' }}
                  >
                    <option value="">—</option>
                    {['Idea', 'MVP', 'Launched', 'Scaling', 'Mature'].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: '#888' }}>
                  Funding
                  <select
                    value={fundingStatus}
                    onChange={(e) => setFundingStatus(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#111', color: '#eee' }}
                  >
                    <option value="">—</option>
                    {['Bootstrap', 'Pre-seed', 'Seed', 'Series A+', 'Series B+'].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: '#888' }}>
                  Notes
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#111', color: '#eee' }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setView('list');
                      void loadSessions();
                    }}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: '#888', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveSessionStep1()}
                    style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#1a1a3e', color: GOLD, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ color: '#888', fontSize: 13, marginTop: 0 }}>
                  Add 2–8 people (charts fetched on each add). Phase 3 in the stepper is disabled until analysis ships.
                </p>
                {detail?.people && Array.isArray(detail.people) && detail.people.length > 0 && (
                  <ul style={{ color: '#ccc', fontSize: 13 }}>
                    {(detail.people as { id: string; displayName: string; chartJson: unknown }[]).map((p) => (
                      <li key={p.id}>
                        {p.displayName}
                        {p.chartJson ? ' · chart ok' : ' · chart pending / failed'}
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ display: 'grid', gap: 10, maxWidth: 520, marginBottom: 16 }}>
                  <input placeholder="Display name" value={pName} onChange={(e) => setPName(e.target.value)} style={inp} />
                  <input placeholder="DOB YYYY-MM-DD" value={pDob} onChange={(e) => setPDob(e.target.value)} style={inp} />
                  <input placeholder="TOB HH:mm (required)" value={pTob} onChange={(e) => setPTob(e.target.value)} style={inp} />
                  <input placeholder="City of birth" value={pCity} onChange={(e) => setPCity(e.target.value)} style={inp} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Lat (optional)" value={pLat} onChange={(e) => setPLat(e.target.value)} style={{ ...inp, flex: 1 }} />
                    <input placeholder="Lon (optional)" value={pLon} onChange={(e) => setPLon(e.target.value)} style={{ ...inp, flex: 1 }} />
                  </div>
                  <input placeholder="TZ: Asia/Kolkata or 5.5 (optional if city resolves)" value={pTz} onChange={(e) => setPTz(e.target.value)} style={inp} />
                  <input placeholder="Role preference (optional)" value={pRole} onChange={(e) => setPRole(e.target.value)} style={inp} />
                  <button type="button" onClick={() => void addPerson()} style={{ ...btnPrimary }}>
                    Add person
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(1)} style={btnGhost}>
                    Back
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Available in Phase 2."
                    style={{ ...btnPrimary, opacity: 0.45, cursor: 'not-allowed' }}
                  >
                    Run analysis
                  </button>
                  <span style={{ color: '#666', fontSize: 12 }}>Run analysis — available in Phase 2.</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ color: '#888' }}>
                <p>Review placeholder (Phase 2).</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inp: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: '#111',
  color: '#eee',
  width: '100%',
  boxSizing: 'border-box',
};

const btnPrimary: CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: '#1a1a3e',
  color: GOLD,
  cursor: 'pointer',
  fontWeight: 600,
};

const btnGhost: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: 'transparent',
  color: '#888',
  cursor: 'pointer',
};
