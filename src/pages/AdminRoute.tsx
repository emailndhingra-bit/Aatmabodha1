import { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';
const ADMIN_EMAIL = 'emailndhingra@gmail.com';

/** Only the configured admin may load /admin; everyone else is redirected home with no message. */
export default function AdminRoute() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.replace('/');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = r.ok ? await r.json() : null;
        if (cancelled) return;
        if (!user || user.email !== ADMIN_EMAIL) {
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
  }, []);

  if (!allowed) return null;
  return <AdminDashboard />;
}
