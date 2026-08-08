import { Link } from 'react-router-dom';
import { SITE } from '../../constants/config';
import { ArrowUp } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const { isAuthenticated, requireLogin } = useAuth();
  const { openCart, openWishlist } = useCartUI();

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
        <div className="container-mk grid gap-10 py-12 md:grid-cols-3">
          <div>
            <Link to="/" className="mb-5 inline-flex rounded-xl bg-black px-2.5 py-2">
              <BrandLogo className="h-12 w-auto" />
            </Link>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Contact Info</h3>
            <p className="mb-2 text-sm text-white/80">
              Hotline Free 24/24:
              <br />
              <strong className="text-lg text-cyan">{SITE.phone}</strong>
            </p>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              We are a team of designers and developers that create high quality HTML Template,
              Woocommerce, Shopify Theme.
            </p>
            <p className="text-sm text-white/70">{SITE.address}</p>
            <p className="text-sm text-cyan">{SITE.email}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Information</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link to="/about-us" className="hover:text-cyan">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/delivery-information" className="hover:text-cyan">
                  Delivery Information
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
                <button
                  type="button"
                  onClick={openCart}
                  className="hover:text-cyan"
                >
                  Shopping Cart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onWishlistClick}
                  className="hover:text-cyan"
                >
                  Wish List
                </button>
              </li>
              <li>
                <Link to="/faq" className="hover:text-cyan">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="hover:text-cyan">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} MarineKart. All rights reserved.
        </div>
      </div>

      <button
        type="button"
        onClick={scrollTop}
        className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-cyan text-white shadow-lg hover:bg-cyan-dark"
        aria-label="Scroll to top"
      >
        <ArrowUp size={18} />
      </button>
    </footer>
  );
}
