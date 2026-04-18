/**
 * Oracle / Gemini user preferences stored in localStorage (`userContext`).
 * Shared by App (onboarding) and ChatInterface (runtime).
 */

export const USER_CONTEXT_KEY = 'userContext';

export type AstroExperienceLevel = 'beginner' | 'moderate' | 'advanced';

export type OracleUserContextPayload = {
  setupDone: boolean;
  preferredLanguage: string;
  presentCity: string;
  whySeeking?: string;
  focusAreas?: string[];
  astroLevel?: AstroExperienceLevel;
};

const DEFAULT_ORACLE_USER: OracleUserContextPayload = {
  setupDone: false,
  preferredLanguage: 'Hinglish',
  presentCity: '',
  whySeeking: '',
  focusAreas: [],
  astroLevel: 'moderate',
};

function normalizePayload(p: Partial<OracleUserContextPayload>): OracleUserContextPayload {
  const focusAreas = Array.isArray(p.focusAreas)
    ? p.focusAreas.filter((x): x is string => typeof x === 'string')
    : [];
  const astro =
    p.astroLevel === 'beginner' || p.astroLevel === 'moderate' || p.astroLevel === 'advanced'
      ? p.astroLevel
      : 'moderate';
  return {
    setupDone: !!p.setupDone,
    preferredLanguage: typeof p.preferredLanguage === 'string' && p.preferredLanguage.trim()
      ? p.preferredLanguage.trim()
      : DEFAULT_ORACLE_USER.preferredLanguage,
    presentCity: typeof p.presentCity === 'string' ? p.presentCity : '',
    whySeeking: typeof p.whySeeking === 'string' ? p.whySeeking : '',
    focusAreas,
    astroLevel: astro,
  };
}

/** Full merged object for onboarding form defaults (does not require setupDone). */
export function readOracleUserContextForm(): OracleUserContextPayload {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_ORACLE_USER };
  try {
    const raw = localStorage.getItem(USER_CONTEXT_KEY);
    if (!raw) return { ...DEFAULT_ORACLE_USER };
    const p = JSON.parse(raw) as Partial<OracleUserContextPayload>;
    return normalizePayload({ ...DEFAULT_ORACLE_USER, ...p });
  } catch {
    return { ...DEFAULT_ORACLE_USER };
  }
}

/** Returns context only when Oracle setup is complete (chat unlocked). */
export function readOracleUserContext(): OracleUserContextPayload | null {
  const full = readOracleUserContextForm();
  if (full.setupDone && full.preferredLanguage) return full;
  return null;
}

export function writeOracleUserContext(payload: OracleUserContextPayload): void {
  try {
    localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(normalizePayload(payload)));
  } catch (e) {
    console.warn('Could not persist user context', e);
  }
}

export function mergeOracleUserContext(partial: Partial<OracleUserContextPayload> | Record<string, unknown>): void {
  const cur = readOracleUserContextForm();
  writeOracleUserContext(normalizePayload({ ...cur, ...(partial as Partial<OracleUserContextPayload>) }));
}

/** Instructions appended to oracle steering based on experience level. */
export function getAstroLevelOracleHint(level: AstroExperienceLevel | undefined): string {
  switch (level) {
    case 'beginner':
      return (
        'USER_ASTRO_LEVEL: beginner — Use ALL citations in appendix format. ' +
        'Zero jargon in body. Every technical term explained in plain language. ' +
        'Pretend user has never heard of planets, dashas or houses. ' +
        'Respond with zero astrology jargon in the narrative; put heavy technical data in appendix only.'
      );
    case 'advanced':
      return (
        'USER_ASTRO_LEVEL: advanced — No appendix citations required unless clarity needs it. ' +
        'All technical terms may appear in body. Full depth — Shadbala, Vimshottari, Chalit, KP, D-charts are welcome. ' +
        'Treat user as a fellow student of Jyotish.'
      );
    case 'moderate':
    default:
      return (
        'USER_ASTRO_LEVEL: moderate — Mix human language with some in-body astrology terms. ' +
        'Use appendix for heavy tabular data. Explain unusual terms inline. ' +
        'Dasha, nakshatra, lagna can be used naturally.'
      );
  }
}
