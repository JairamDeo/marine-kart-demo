import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { cartService } from '../services/cart.service';
import { wishlistService } from '../services/wishlist.service';
import {
  AUTH_KEYS,
  clearSession,
  loadAllSessions,
  migrateLegacySession,
  portalFromPath,
  portalFromRole,
  writeSession,
} from '../utils/authSession';
import {
  clearGuestCart,
  formatGuestCart,
  guestAddItem,
  guestCartPayloadForMerge,
  guestRemoveItem,
  guestUpdateItem,
} from '../utils/guestCart';
import { friendlyError } from '../utils/toastMsg';
import { enablePushNotifications } from '../utils/pushNotifications';

const AuthContext = createContext(null);

migrateLegacySession();

const CUSTOMER_TOKEN_KEY = AUTH_KEYS.customer.token;

export function AuthProvider({ children }) {
  const location = useLocation();
  const portal = portalFromPath(location.pathname);

  const [sessions, setSessions] = useState(() => loadAllSessions());
  const [cart, setCart] = useState(() =>
    loadAllSessions().customer.token ? null : formatGuestCart()
  );
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginModal, setLoginModal] = useState({
    open: false,
    message: '',
    redirectTo: '/login',
    from: '/cart',
  });
  const mergeLockRef = useRef(false);

  const active = sessions[portal] || { user: null, token: null };
  const user = active.user;
  const token = active.token;
  const customerToken = sessions.customer?.token || null;

  const syncSessions = useCallback(() => {
    setSessions(loadAllSessions());
  }, []);

  const persistPortal = useCallback((rolePortal, nextUser, nextToken) => {
    writeSession(rolePortal, nextUser, nextToken);
    setSessions(loadAllSessions());
  }, []);

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem(CUSTOMER_TOKEN_KEY)) {
      setCart(formatGuestCart());
      return;
    }
    try {
      const { data } = await cartService.get();
      setCart(data.data.cart);
    } catch {
      setCart(formatGuestCart());
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!localStorage.getItem(CUSTOMER_TOKEN_KEY)) {
      setWishlistCount(0);
      setWishlistIds([]);
      return;
    }
    try {
      const { data } = await wishlistService.get();
      const products = data.data.products || [];
      setWishlistCount(products.length);
      setWishlistIds(products.map((p) => String(p.id || p._id)));
    } catch {
      setWishlistCount(0);
      setWishlistIds([]);
    }
  }, []);

  const mergeGuestIntoServer = useCallback(async () => {
    const guestItems = guestCartPayloadForMerge();
    if (!guestItems.length) {
      await refreshCart();
      return;
    }
    // Prevent duplicate merge/toast when login + session boot both fire
    if (mergeLockRef.current) {
      return;
    }
    mergeLockRef.current = true;
    try {
      const { data } = await cartService.merge(guestItems);
      clearGuestCart();
      setCart(data.data.cart);
      const warnings = data.data.warnings || [];
      if (warnings.length) {
        warnings.slice(0, 2).forEach((w) => toast(w, { icon: 'ℹ️' }));
      } else {
        toast.success('Your cart items were saved to your account');
      }
    } catch (err) {
      toast.error(friendlyError(err, 'Could not merge guest cart'));
      await refreshCart();
    } finally {
      mergeLockRef.current = false;
    }
  }, [refreshCart]);

  // Validate the session for the current portal only (correct JWT on each request via path).
  useEffect(() => {
    let cancelled = false;
    const portalToken = sessions[portal]?.token;

    const boot = async () => {
      if (!portalToken) {
        if (!cancelled) {
          if (portal === 'customer') setCart(formatGuestCart());
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await authService.me(portalToken);
        if (cancelled) return;
        const nextUser = data.data.user;
        const expectedPortal = portalFromRole(nextUser.role);
        if (expectedPortal !== portal) {
          clearSession(portal);
          syncSessions();
          if (portal === 'customer') setCart(formatGuestCart());
          return;
        }
        persistPortal(portal, nextUser, portalToken);
        if (portal === 'customer') {
          await mergeGuestIntoServer();
          await refreshWishlist();
        }
        enablePushNotifications().catch(() => {});
      } catch {
        if (!cancelled) {
          clearSession(portal);
          syncSessions();
          if (portal === 'customer') {
            setCart(formatGuestCart());
            setWishlistCount(0);
            setWishlistIds([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-validate when portal or its token changes
  }, [portal, sessions[portal]?.token]);

  const login = async (email, password, options = {}) => {
    const { expectedRole } = options;
    const accountType =
      expectedRole === 'dealer' ? 'corporate' : expectedRole || 'customer';
    try {
      const { data } = await authService.login({
        email,
        password,
        accountType,
        expectedRole: accountType,
      });
      const loggedIn = data.data.user;
      const nextToken = data.data.token;
      const actualRole = loggedIn.role === 'dealer' ? 'corporate' : loggedIn.role;
      const rolePortal = portalFromRole(actualRole);

      if (expectedRole) {
        const expected = expectedRole === 'dealer' ? 'corporate' : expectedRole;
        if (actualRole !== expected) {
          const err = new Error('Wrong portal for this account');
          err.code = 'WRONG_PORTAL';
          err.actualRole = actualRole;
          throw err;
        }
      }

      persistPortal(rolePortal, { ...loggedIn, role: actualRole }, nextToken);

      if (rolePortal === 'customer') {
        await mergeGuestIntoServer();
        await refreshWishlist();
      }
      enablePushNotifications().catch(() => {});

      return { ...loggedIn, role: actualRole };
    } catch (err) {
      const payload = err.data || err.response?.data?.data;
      if (payload?.code === 'EMAIL_NOT_VERIFIED' || payload?.needsVerification) {
        const e = new Error(err.message || 'Account not verified');
        e.code = 'EMAIL_NOT_VERIFIED';
        e.email = payload?.email || email;
        e.accountType = payload?.accountType || accountType;
        throw e;
      }
      if (payload?.code === 'PENDING_APPROVAL' || payload?.needsApproval) {
        const e = new Error(err.message || 'Awaiting admin approval');
        e.code = 'PENDING_APPROVAL';
        e.email = payload?.email || email;
        e.accountType = payload?.accountType || accountType;
        throw e;
      }
      if (payload?.code === 'ACCOUNT_REJECTED') {
        const e = new Error(err.message || 'Registration was not approved');
        e.code = 'ACCOUNT_REJECTED';
        throw e;
      }
      throw err;
    }
  };

  const register = async (payload) => {
    const { data } = await authService.register(payload);
    if (data.data?.needsVerification) {
      return {
        needsVerification: true,
        email: data.data.email,
        accountType: data.data.accountType || payload.accountType || 'customer',
        message: data.message,
      };
    }
    const loggedIn = data.data.user;
    const nextToken = data.data.token;
    if (loggedIn && nextToken) {
      persistPortal('customer', loggedIn, nextToken);
      await mergeGuestIntoServer();
      await refreshWishlist();
    }
    return loggedIn;
  };

  const completeEmailVerification = async (nextUser, nextToken) => {
    const actualRole = nextUser.role === 'dealer' ? 'corporate' : nextUser.role;
    const rolePortal = portalFromRole(actualRole);
    persistPortal(rolePortal, { ...nextUser, role: actualRole }, nextToken);
    if (rolePortal === 'customer') {
      await mergeGuestIntoServer();
      await refreshWishlist();
    }
    enablePushNotifications().catch(() => {});
    return { ...nextUser, role: actualRole };
  };

  /** Clears only the current portal's JWT (or a specific portal if passed). */
  const logout = (rolePortal = portal) => {
    const previous = sessions[rolePortal]?.user || null;
    clearSession(rolePortal);
    syncSessions();
    if (rolePortal === 'customer') {
      setCart(formatGuestCart());
      setWishlistCount(0);
      setWishlistIds([]);
    }
    return previous;
  };

  const applyUser = useCallback(
    (nextUser) => {
      const rolePortal = portalFromRole(nextUser?.role || portal);
      const existingToken = sessions[rolePortal]?.token || token;
      persistPortal(rolePortal, nextUser, existingToken);
    },
    [portal, sessions, token, persistPortal]
  );

  const requireLogin = useCallback(
    (message = 'Please login first to continue.', redirectTo = '/login', from = '/cart') => {
      setLoginModal({ open: true, message, redirectTo, from });
    },
    []
  );

  const closeLoginModal = useCallback(() => {
    setLoginModal((m) => ({ ...m, open: false }));
  }, []);

  const addToCart = useCallback(async (product, quantity = 1) => {
    const productId = product.id || product._id;
    const qty = Math.max(1, Number(quantity) || 1);

    if (!localStorage.getItem(CUSTOMER_TOKEN_KEY)) {
      const result = guestAddItem(product, qty);
      setCart(result.cart);
      if (!result.ok) throw new Error(result.message);
      return result.cart;
    }

    const { data } = await cartService.addItem({ productId, quantity: qty });
    setCart(data.data.cart);
    return data.data.cart;
  }, []);

  const updateCartQuantity = useCallback(async (productId, quantity) => {
    if (!localStorage.getItem(CUSTOMER_TOKEN_KEY)) {
      const result = guestUpdateItem(productId, quantity);
      setCart(result.cart);
      if (!result.ok) throw new Error(result.message);
      return result.cart;
    }
    const { data } = await cartService.updateItem({ productId, quantity });
    setCart(data.data.cart);
    return data.data.cart;
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    if (!localStorage.getItem(CUSTOMER_TOKEN_KEY)) {
      const result = guestRemoveItem(productId);
      setCart(result.cart);
      return result.cart;
    }
    const { data } = await cartService.removeItem(productId);
    setCart(data.data.cart);
    return data.data.cart;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      portal,
      sessions,
      loading,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === 'admin',
      isCustomerAuthenticated: Boolean(sessions.customer?.user && sessions.customer?.token),
      cart,
      wishlistCount,
      wishlistIds,
      login,
      register,
      completeEmailVerification,
      logout,
      applyUser,
      refreshCart,
      refreshWishlist,
      setWishlistCount,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      requireLogin,
      closeLoginModal,
      loginModal,
      customerToken,
    }),
    [
      user,
      token,
      portal,
      sessions,
      loading,
      cart,
      wishlistCount,
      wishlistIds,
      refreshCart,
      refreshWishlist,
      applyUser,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      requireLogin,
      closeLoginModal,
      loginModal,
      customerToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
