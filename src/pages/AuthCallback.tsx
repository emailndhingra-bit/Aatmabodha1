import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      window.location.href = '/';
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
