export default function PendingApproval() {
  return (
    <div style={{ minHeight: '100vh', background: '#0B0c15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#120f26', border: '1px solid #4f46e5', borderRadius: '1rem', padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#fbbf24', fontFamily: 'Cinzel, serif' }}>⏳ Awaiting Approval</h1>
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
          Your account is pending admin approval. You will be notified once approved.
        </p>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
