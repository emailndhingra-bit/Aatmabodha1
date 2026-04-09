import { useEffect, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('auth_token');

  const fetchUsers = async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const approveUser = async (id: string) => {
    await fetch(`${BACKEND_URL}/api/auth/admin/approve/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchUsers();
  };

  const rejectUser = async (id: string) => {
    await fetch(`${BACKEND_URL}/api/auth/admin/reject/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchUsers();
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0B0c15', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#fbbf24', fontFamily: 'Cinzel, serif', marginBottom: '2rem' }}>Admin Dashboard</h1>
      {loading ? (
        <p style={{ color: '#fff' }}>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#120f26' }}>
              <th style={{ color: '#94a3b8', padding: '1rem', textAlign: 'left' }}>Name</th>
              <th style={{ color: '#94a3b8', padding: '1rem', textAlign: 'left' }}>Email</th>
              <th style={{ color: '#94a3b8', padding: '1rem', textAlign: 'left' }}>Status</th>
              <th style={{ color: '#94a3b8', padding: '1rem', textAlign: 'left' }}>Questions</th>
              <th style={{ color: '#94a3b8', padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #1e1b4b' }}>
                <td style={{ color: '#fff', padding: '1rem' }}>{user.name || '-'}</td>
                <td style={{ color: '#fff', padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    background: user.status === 'approved' ? '#166534' : user.status === 'rejected' ? '#7f1d1d' : '#92400e',
                    color: '#fff'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ color: '#fff', padding: '1rem' }}>{user.questionsUsed}/{user.questionsLimit}</td>
                <td style={{ padding: '1rem' }}>
                  {user.status === 'pending' && (
                    <>
                      <button onClick={() => approveUser(user.id)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', background: '#166534', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                        Approve
                      </button>
                      <button onClick={() => rejectUser(user.id)} style={{ padding: '0.25rem 0.75rem', background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
