import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';
import BrandLogo from '../common/BrandLogo';
import HeaderProductSearch from './HeaderProductSearch';

export default function MainHeader() {
  const { isAuthenticated, wishlistCount, cart } = useAuth();
  const { openCart, openWishlist } = useCartUI();
  const navigate = useNavigate();

  const cartCount = cart?.itemCount || 0;

  return (
    <div className="bg-[#1a4b8c] py-3 sm:py-4 lg:py-3.5">
      <div className="container-mk grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2.5 sm:grid-cols-[auto_1fr_auto] sm:gap-4 lg:grid-cols-[1fr_minmax(280px,640px)_1fr] lg:gap-5">
        <Link to="/" className="col-start-1 row-start-1 shrink-0 justify-self-start">
          <BrandLogo className="h-14 w-auto max-w-[180px] sm:h-[72px] sm:max-w-none md:h-20 lg:h-[88px]" />
        </Link>

        <div className="col-span-2 row-start-2 w-full min-w-0 justify-self-stretch sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:max-w-none lg:justify-self-center">
          <HeaderProductSearch />
        </div>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-1.5 justify-self-end sm:col-start-3 sm:gap-2.5 lg:col-start-3 lg:justify-self-end">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              openWishlist();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded bg-[#78c6d4] text-white transition hover:bg-[#5bb5c6] sm:h-11 sm:w-11"
            title="Wishlist"
          >
            <Heart size={18} fill="currentColor" className="sm:hidden" />
            <Heart size={20} fill="currentColor" className="hidden sm:block" />
            <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-0.5 text-[9px] font-bold text-[#1a4b8c] shadow sm:-left-1.5 sm:-top-1.5 sm:h-5 sm:min-w-5 sm:px-1 sm:text-[10px]">
              {wishlistCount}
            </span>
          </button>

          <button
            type="button"
            onClick={openCart}
            className="relative flex h-9 w-9 items-center justify-center rounded bg-[#78c6d4] text-white transition hover:bg-[#5bb5c6] sm:h-11 sm:w-11"
            title="Shopping Cart"
          >
            <ShoppingBag size={18} className="sm:hidden" />
            <ShoppingBag size={20} className="hidden sm:block" />
            <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-0.5 text-[9px] font-bold text-[#1a4b8c] shadow sm:-left-1.5 sm:-top-1.5 sm:h-5 sm:min-w-5 sm:px-1 sm:text-[10px]">
              {cartCount}
            </span>
          </button>

          {isAuthenticated ? (
            <Link
              to="/account"
              className="flex items-center gap-1 rounded bg-[#78c6d4] px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-[#5bb5c6] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <span className="whitespace-nowrap">
                <span className="sm:hidden">Account</span>
                <span className="hidden sm:inline">My Account</span>
              </span>
              <ChevronDown size={14} className="hidden sm:block" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 rounded bg-[#78c6d4] px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-[#5bb5c6] sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm"
            >
              <span className="whitespace-nowrap">Login</span>
              <ChevronDown size={14} className="hidden sm:block" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
