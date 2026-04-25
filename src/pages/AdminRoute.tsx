import { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';
const DEFAULT_ADMIN_EMAILS = 'emailndhingra@gmail.com,amol.xlri@gmail.com';

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = import.meta.env.VITE_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS;
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .includes(email.trim());
}

/** Only allowlisted admins may load /admin; everyone else is redirected home with no message. */
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
  }, []);

  if (!allowed) return null;
  return <AdminDashboard />;
}
