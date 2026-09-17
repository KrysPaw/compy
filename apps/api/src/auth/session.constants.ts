export const SESSION_COOKIE_NAME = 'compy_session';

/** Guest and registered sessions last 400 days (browser-ish max). */
export const SESSION_TTL_MS = 400 * 24 * 60 * 60 * 1000;

export type Principal = {
  id: number;
  kind: 'guest' | 'registered';
};
