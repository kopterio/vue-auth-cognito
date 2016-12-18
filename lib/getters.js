export function user(state) { return state.user || null; }
export function username(state) { return state.user ? null : state.user.getUsername(); }
