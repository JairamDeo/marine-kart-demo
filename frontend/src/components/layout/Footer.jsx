import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../../constants/config';
import { ArrowUp } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';

export default function Footer() {
  const [atTop, setAtTop] = useState(true);
  const { isAuthenticated, requireLogin } = useAuth();
  const { openCart, openWishlist } = useCartUI();

  useEffect(() => {
    const update = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      // Near top → point down; otherwise (incl. bottom) → point up
      setAtTop(max < 40 ? true : y < Math.min(120, max * 0.15));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const onScrollJump = () => {
    if (atTop) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onWishlistClick = () => {
    if (!isAuthenticated) {
      requireLogin('Please login first to view your wishlist.', '/login', '/');
      return;
    }
    openWishlist();
  };

  return (
    <footer>
      <div className="bg-navy text-white">
        <div className="container-mk flex flex-col gap-10 py-10 sm:py-12 lg:flex-row lg:gap-12 lg:py-8">
          {/* Left — brand (30%) */}
          <div className="w-full shrink-0 lg:w-[30%]">
            <Link to="/" className="mb-5 inline-block">
              <BrandLogo className="h-[84px] w-auto sm:h-[92px]" />
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-white/70 pr-4">
              Your trusted partner for quality marine accessories and engine spare parts. Serving fishermen, vessel owners, and shipping companies across India and beyond.
            </p>
          </div>

          {/* Right — 3 equal columns (70%) */}
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 lg:w-[70%] lg:gap-8">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link to="/about-us" className="hover:text-cyan">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/shop?newArrival=true" className="hover:text-cyan">
                    New products
                  </Link>
                </li>
                <li>
                  <Link to="/shop?bestSeller=true" className="hover:text-cyan">
                    Best sales
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-cyan">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Customer Service</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link to="/account" className="hover:text-cyan">
                    My Account
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={openCart} className="hover:text-cyan">
                    Shopping Cart
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onWishlistClick} className="hover:text-cyan">
                    Wish List
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-cyan"
                    onClick={(e) => e.preventDefault()}
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <Link to="/contact-us" className="hover:text-cyan">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/product-not-listed" className="hover:text-cyan">
                    Request a Product
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Contact Info</h3>
              <p className="mb-2 text-sm text-white/80">
                Hotline Free 24/24:
                <br />
                <strong className="text-lg text-cyan">{SITE.phone}</strong>
              </p>
              <p className="text-sm text-white/70">{SITE.address}</p>
              <p className="mt-1 text-sm text-cyan">{SITE.email}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-white/50">
            <span>© {new Date().getFullYear()} MarineKart. All rights reserved.</span>
            <a
              href="https://www.goldleafpro.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 uppercase transition hover:text-cyan"
              aria-label="Goldleaf Production"
            >
              <img
                src="/goldleaf-icon.webp"
                alt=""
                className="h-3 w-auto shrink-0 object-contain"
                width={12}
                height={12}
              />
              <span>
                Goldleaf Production
              </span>
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onScrollJump}
        className="fixed bottom-5 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-cyan text-white shadow-lg transition hover:bg-cyan-dark hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-11 sm:w-11 mb-[env(safe-area-inset-bottom)]"
        aria-label={atTop ? 'Scroll to bottom' : 'Scroll to top'}
        title={atTop ? 'Scroll to bottom' : 'Scroll to top'}
      >
        <ArrowUp
          size={18}
          className={`transition-transform duration-500 ease-out ${atTop ? 'rotate-180' : 'rotate-0'
            }`}
        />
      </button>
    </footer>
  );
}
