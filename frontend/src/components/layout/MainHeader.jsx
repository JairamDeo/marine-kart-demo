import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';
import BrandLogo from '../common/BrandLogo';
import HeaderProductSearch from './HeaderProductSearch';

export default function MainHeader({ categories = [] }) {
  const { isAuthenticated, wishlistCount, cart } = useAuth();
  const { openCart, openWishlist } = useCartUI();
  const navigate = useNavigate();

  const cartCount = cart?.itemCount || 0;

  return (
    <div className="bg-[#1a4b8c] py-4">
      <div className="container-mk flex flex-col items-center gap-4 lg:flex-row lg:gap-6">
        <Link to="/" className="shrink-0">
          <BrandLogo className="h-14 w-auto sm:h-16" />
        </Link>

        <HeaderProductSearch categories={categories} />

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              openWishlist();
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded bg-[#78c6d4] text-white transition hover:bg-[#5bb5c6]"
            title="Wishlist"
          >
            <Heart size={20} fill="currentColor" />
            <span className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#1a4b8c] shadow">
              {wishlistCount}
            </span>
          </button>

          <button
            type="button"
            onClick={openCart}
            className="relative flex h-11 w-11 items-center justify-center rounded bg-[#78c6d4] text-white transition hover:bg-[#5bb5c6]"
            title="Shopping Cart"
          >
            <ShoppingBag size={20} />
            <span className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#1a4b8c] shadow">
              {cartCount}
            </span>
          </button>

          {isAuthenticated ? (
            <Link
              to="/account"
              className="flex items-center gap-2 rounded bg-[#78c6d4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5bb5c6]"
            >
              <span className="whitespace-nowrap">My Account</span>
              <ChevronDown size={14} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded bg-[#78c6d4] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5bb5c6]"
            >
              <span className="whitespace-nowrap">Login</span>
              <ChevronDown size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
