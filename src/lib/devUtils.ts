/**
 * Dev utilities — never affects production behaviour unless explicitly opted in.
 *
 * Usage: append ?devLock=1 to any URL to force the app into post-lock mode.
 * This lets you preview leaderboard / participant / team-detail pages before
 * bracket lock actually happens on June 11.
 *
 * Example: http://localhost:5173/leaderboard?devLock=1
 */

export function isDevLockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('devLock') === '1';
}

/** Returns true if picks are locked, respecting the dev override. */
export function resolvePicksLocked(serverValue: boolean): boolean {
  return serverValue || isDevLockEnabled();
}
