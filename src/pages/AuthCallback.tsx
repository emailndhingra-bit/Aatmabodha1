import { useEffect } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      void (async () => {
        try {
          const r = await fetch(`${BACKEND}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.ok) {
            const user = await r.json();
            localStorage.setItem('auth_user', JSON.stringify(user));
          }
        } catch {
          /* ignore — main app can refetch */
        } finally {
          window.location.href = '/';
        }
      })();
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0B0c15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#fff' }}>Logging you in...</p>
    </div>
  );
}
