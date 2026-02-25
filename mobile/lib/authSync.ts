/**
 * Callback fired when any API request returns 401.
 * AuthContext registers here to clear auth state and stay in sync with the api module.
 */
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export function triggerUnauthorized() {
  onUnauthorized?.();
}
