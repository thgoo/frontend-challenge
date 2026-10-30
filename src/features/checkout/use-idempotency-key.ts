import { useState } from 'react';

/** A stable key per scope: retrying the same confirmation reuses it, a new scope gets a new one. */
export function useIdempotencyKey(scope: string | undefined): string {
  const [state, setState] = useState(() => ({ scope, key: crypto.randomUUID() }));
  if (state.scope !== scope) {
    const next = { scope, key: crypto.randomUUID() };
    setState(next);
    return next.key;
  }
  return state.key;
}
