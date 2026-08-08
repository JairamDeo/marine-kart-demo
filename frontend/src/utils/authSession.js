/** Separate auth sessions so customer / corporate / admin can coexist in one browser. */

export const AUTH_PORTALS = ['customer', 'admin'];

export const AUTH_KEYS = {
  customer: { token: 'mk_token_customer', user: 'mk_user_customer' },
  admin: { token: 'mk_token_admin', user: 'mk_user_admin' },
  // legacy dealer keys — migrated into customer when role is corporate
  dealer: { token: 'mk_token_dealer', user: 'mk_user_dealer' },
};

/** Legacy single-session keys (migrated once on boot). */
export const LEGACY_TOKEN_KEY = 'mk_token';
export const LEGACY_USER_KEY = 'mk_user';

export function normalizeRole(role) {
  if (role === 'dealer') return 'corporate';
  return role;
}

export function portalFromPath(pathname = '') {
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (path.startsWith('/admin')) return 'admin';
  // Corporate console shares the customer shopping session
  return 'customer';
}

export function portalFromRole(role) {
  const r = normalizeRole(role);
  if (r === 'admin') return 'admin';
  // customer + corporate both use storefront/customer session
  return 'customer';
}

export function readUser(portal) {
  try {
    const raw = localStorage.getItem(AUTH_KEYS[portal]?.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readToken(portal) {
  return localStorage.getItem(AUTH_KEYS[portal]?.token);
}

export function writeSession(portal, user, token) {
  const keys = AUTH_KEYS[portal];
  if (!keys) return;
  if (token) localStorage.setItem(keys.token, token);
  else localStorage.removeItem(keys.token);
  if (user) {
    const safe = { ...user, role: normalizeRole(user.role) };
    localStorage.setItem(keys.user, JSON.stringify(safe));
  } else localStorage.removeItem(keys.user);
}

export function clearSession(portal) {
  writeSession(portal, null, null);
}

export function loadAllSessions() {
  return {
    customer: { user: readUser('customer'), token: readToken('customer') },
    admin: { user: readUser('admin'), token: readToken('admin') },
  };
}

/** One-time migrate old shared / dealer keys into role-specific keys. */
export function migrateLegacySession() {
  try {
    // Migrate dealer portal → customer (corporate)
    const dealerToken = localStorage.getItem(AUTH_KEYS.dealer.token);
    const dealerUserRaw = localStorage.getItem(AUTH_KEYS.dealer.user);
    if (dealerToken && dealerUserRaw && !readToken('customer')) {
      try {
        const u = JSON.parse(dealerUserRaw);
        writeSession('customer', { ...u, role: 'corporate' }, dealerToken);
      } catch {
        /* ignore */
      }
    }
    localStorage.removeItem(AUTH_KEYS.dealer.token);
    localStorage.removeItem(AUTH_KEYS.dealer.user);

    const token = localStorage.getItem(LEGACY_TOKEN_KEY);
    const raw = localStorage.getItem(LEGACY_USER_KEY);
    if (!token && !raw) return;

    let user = null;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }

    if (token && user?.role) {
      const portal = portalFromRole(user.role);
      if (!readToken(portal)) {
        writeSession(portal, user, token);
      }
    }

    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    // ignore migration errors
  }
}

export function getActiveToken(pathname) {
  return readToken(portalFromPath(pathname));
}
