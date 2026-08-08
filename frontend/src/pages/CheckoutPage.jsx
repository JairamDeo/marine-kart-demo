import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartUI } from '../context/CartUIContext';

/** /checkout opens in-drawer checkout — no separate page. */
export default function CheckoutPage() {
  const { isAuthenticated, requireLogin, cart } = useAuth();
  const { openCart, openCheckout } = useCartUI();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      openCart();
      requireLogin(
        'Please login first to checkout. Your cart items will merge into your account after you sign in.',
        '/login',
        '/'
      );
    } else if (cart?.items?.length) {
      openCheckout();
    } else {
      openCart();
    }
    navigate('/', { replace: true });
  }, [isAuthenticated, requireLogin, openCart, openCheckout, cart?.items?.length, navigate]);

  return null;
}
