/**
 * Lightweight env validation for ConfigModule.
 * SARVAM_API_KEY is optional at boot — Sarvam TTS endpoints fail at runtime if missing.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const SARVAM_API_KEY = typeof config.SARVAM_API_KEY === 'string' ? config.SARVAM_API_KEY : '';
  return {
    ...config,
    SARVAM_API_KEY,
  };
}
