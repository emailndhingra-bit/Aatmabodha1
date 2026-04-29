/**
 * Oracle rules version for Gemini cache keys — must match
 * `ORACLE_RULES_VERSION` in `services/oracleRules.ts` at repo root.
 * Kept under backend/src so Nest `rootDir` stays `./src` and `nest build`
 * emits `dist/main.js` (Render runs `node dist/main.js`).
 */
export const ORACLE_RULES_VERSION = 'V5.6.4.1';
