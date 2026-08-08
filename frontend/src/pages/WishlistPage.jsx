import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartUI } from '../context/CartUIContext';

/** /wishlist opens the wishlist drawer and returns to home. */
export default function WishlistPage() {
  const { isAuthenticated, requireLogin } = useAuth();
  const { openWishlist } = useCartUI();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      requireLogin('Please login first to view your wishlist.', '/login', '/');
      navigate('/', { replace: true });
      return;
    }
    openWishlist();
    navigate('/', { replace: true });
  }, [isAuthenticated, openWishlist, navigate, requireLogin]);

  return null;
}
