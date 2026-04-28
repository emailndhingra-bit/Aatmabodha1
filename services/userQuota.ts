/**
 * Client-side quota helpers aligned with backend `UsersService.getEffectiveQuota`:
 * effective cap = custom_quota if set, else 60; custom_quota === 0 means unlimited.
 */

export function getBackendBaseUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || 'https://aatmabodha1-backend.onrender.com';
}

export function getAuthTokenFromStorage(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('auth_token') || localStorage.getItem('token');
}

/** Mirrors backend `UsersService.getEffectiveQuota` (users.custom_quota + default 60). */
export function getEffectiveQuotaCap(u: Record<string, unknown> | null | undefined): number {
  if (u == null || typeof u !== 'object') return 60;
  const custom = u.customQuota ?? u.custom_quota;
  if (custom != null && custom !== '') {
    const n = typeof custom === 'number' ? custom : Number(custom);
    return Number.isFinite(n) ? n : 60;
  }
  const cur = u.current_quota;
  if (cur != null && cur !== '') {
    const n = typeof cur === 'number' ? cur : Number(cur);
    return Number.isFinite(n) ? n : 60;
  }
  return 60;
}

export function getQuestionsUsedCount(u: Record<string, unknown> | null | undefined): number {
  if (u == null || typeof u !== 'object') return 0;
  const raw = u.questionsUsed ?? u.questions_used;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function computeQuotaRemainingFromUser(
  u: Record<string, unknown> | null | undefined
): number | 'Unlimited' {
  const cap = getEffectiveQuotaCap(u);
  if (cap === 0) return 'Unlimited';
  const used = getQuestionsUsedCount(u);
  return Math.max(0, cap - used);
}

export async function fetchAuthMeUser(): Promise<Record<string, unknown> | null> {
  const token = getAuthTokenFromStorage();
  if (!token) return null;
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
