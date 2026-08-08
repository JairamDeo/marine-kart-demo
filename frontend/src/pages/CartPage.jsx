import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartUI } from '../context/CartUIContext';

/** /cart URL opens the slide-over drawer and returns to home. */
export default function CartPage() {
  const { openCart } = useCartUI();
  const navigate = useNavigate();

  useEffect(() => {
    openCart();
    navigate('/', { replace: true });
  }, [openCart, navigate]);

  return null;
}
