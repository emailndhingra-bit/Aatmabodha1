const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';

const getToken = () => localStorage.getItem('auth_token');

export const getMyProfiles = async () => {
  const token = getToken();
  if (!token) return [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/profiles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
};

export const saveProfile = async (profileData: {
  name: string;
  gender?: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}) => {
  const token = getToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${BACKEND_URL}/api/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save profile');
  return data;
};

export const deleteProfile = async (profileId: string) => {
  const token = getToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${BACKEND_URL}/api/profiles/${profileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete profile');
  return true;
};
