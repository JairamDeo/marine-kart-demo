import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartUIContext = createContext(null);

export function CartUIProvider({ children }) {
  const { cart } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [step, setStep] = useState('cart'); // cart | checkout | success
  const [successOrder, setSuccessOrder] = useState(null);

  const hasItems = (cart?.items?.length || 0) > 0;
  const drawerOpen = cartOpen || wishlistOpen;

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const openCart = useCallback(() => {
    setWishlistOpen(false);
    setStep('cart');
    setSuccessOrder(null);
    setCartOpen(true);
  }, []);

  /** Opens checkout only when cart has items; otherwise opens empty cart. */
  const openCheckout = useCallback(() => {
    setWishlistOpen(false);
    const count = cart?.items?.length || 0;
    if (count <= 0) {
      toast.error('Your cart is empty. Add items before checkout.');
      setStep('cart');
      setSuccessOrder(null);
      setCartOpen(true);
      return;
    }
    setStep('checkout');
    setCartOpen(true);
  }, [cart?.items?.length]);

  const closeCart = useCallback(() => {
    setCartOpen(false);
    setTimeout(() => {
      setStep('cart');
      setSuccessOrder(null);
    }, 280);
  }, []);

  const openWishlist = useCallback(() => {
    setCartOpen(false);
    setStep('cart');
    setSuccessOrder(null);
    setWishlistOpen(true);
  }, []);

  const closeWishlist = useCallback(() => {
    setWishlistOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setWishlistOpen(false);
    setCartOpen((v) => {
      if (v) {
        setTimeout(() => {
          setStep('cart');
          setSuccessOrder(null);
        }, 280);
      } else {
        setStep('cart');
      }
      return !v;
    });
  }, []);

  const goToCartStep = useCallback(() => setStep('cart'), []);

  const goToCheckoutStep = useCallback(() => {
    const count = cart?.items?.length || 0;
    if (count <= 0) {
      toast.error('Your cart is empty. Add items before checkout.');
      setStep('cart');
      return;
    }
    setStep('checkout');
  }, [cart?.items?.length]);

  const goToSuccessStep = useCallback((order) => {
    setSuccessOrder(order || null);
    setStep('success');
  }, []);

  const successOrderId = successOrder?._id || successOrder?.id || null;

  const value = useMemo(
    () => ({
      cartOpen,
      wishlistOpen,
      step,
      successOrder,
      successOrderId,
      hasItems,
      openCart,
      openCheckout,
      closeCart,
      openWishlist,
      closeWishlist,
      toggleCart,
      goToCartStep,
      goToCheckoutStep,
      goToSuccessStep,
      setStep,
    }),
    [
      cartOpen,
      wishlistOpen,
      step,
      successOrder,
      successOrderId,
      hasItems,
      openCart,
      openCheckout,
      closeCart,
      openWishlist,
      closeWishlist,
      toggleCart,
      goToCartStep,
      goToCheckoutStep,
      goToSuccessStep,
    ]
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error('useCartUI must be used within CartUIProvider');
  return ctx;
}
