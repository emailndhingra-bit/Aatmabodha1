import { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, name };
      
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      if (isLogin && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        setError('Registration successful! Awaiting admin approval.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0c15',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#120f26',
        border: '1px solid #4f46e5',
        borderRadius: '1rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ color: '#fbbf24', fontFamily: 'Cinzel, serif', textAlign: 'center', marginBottom: '0.5rem' }}>
          Divine Intelligence
        </h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem', fontSize: '14px' }}>
          Jyotish Intelligence System
        </p>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#fff',
            color: '#333',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <img src="https://www.google.com/favicon.ico" width="18" height="18" />
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem' }}>— or —</div>

        <div style={{ display: 'flex', marginBottom: '1rem', gap: '0.5rem' }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1, padding: '0.5rem',
              background: isLogin ? '#4f46e5' : 'transparent',
              color: '#fff', border: '1px solid #4f46e5',
              borderRadius: '0.5rem', cursor: 'pointer'
            }}
          >Login</button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1, padding: '0.5rem',
              background: !isLogin ? '#4f46e5' : 'transparent',
              color: '#fff', border: '1px solid #4f46e5',
              borderRadius: '0.5rem', cursor: 'pointer'
            }}
          >Register</button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem',
                background: '#1e1b4b', color: '#fff',
                border: '1px solid #4f46e5', borderRadius: '0.5rem',
                marginBottom: '0.75rem', boxSizing: 'border-box'
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem',
              background: '#1e1b4b', color: '#fff',
              border: '1px solid #4f46e5', borderRadius: '0.5rem',
              marginBottom: '0.75rem', boxSizing: 'border-box'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem',
              background: '#1e1b4b', color: '#fff',
              border: '1px solid #4f46e5', borderRadius: '0.5rem',
              marginBottom: '1rem', boxSizing: 'border-box'
            }}
          />
          {error && (
            <p style={{ color: error.includes('successful') ? '#4ade80' : '#f87171', marginBottom: '1rem', fontSize: '14px' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.75rem',
              background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
