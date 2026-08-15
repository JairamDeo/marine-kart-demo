import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, ShoppingBag, ShoppingCart, Trash2, X } from 'lucide-react';
import { wishlistService } from '../../services/wishlist.service';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';
import { productImageUrl } from '../../utils/productImage';
import { friendlyError } from '../../utils/toastMsg';

export default function WishlistDrawer() {
  const {
    isAuthenticated,
    requireLogin,
    refreshWishlist,
    addToCart,
    wishlistCount,
  } = useAuth();
  const { wishlistOpen, closeWishlist, openCart } = useCartUI();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await wishlistService.get();
      setProducts(res.data.data.products || []);
      await refreshWishlist();
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshWishlist]);

  useEffect(() => {
    if (!wishlistOpen) return;
    if (!isAuthenticated) {
      closeWishlist();
      requireLogin('Please login first to view your wishlist.', '/login', '/');
      return;
    }
    load();
  }, [wishlistOpen, isAuthenticated, load, closeWishlist, requireLogin]);

  const removeItem = async (productId) => {
    setBusyId(productId);
    try {
      await wishlistService.toggle(productId);
      setProducts((prev) => prev.filter((p) => String(p.id || p._id) !== String(productId)));
      await refreshWishlist();
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error(friendlyError(err, 'Could not remove item'));
    } finally {
      setBusyId(null);
    }
  };

  const moveToCart = async (product) => {
    const productId = product.id || product._id;
    setBusyId(productId);
    try {
      await addToCart(product, 1);
      await wishlistService.toggle(productId);
      setProducts((prev) => prev.filter((p) => String(p.id || p._id) !== String(productId)));
      await refreshWishlist();
      toast.success('Moved to cart');
      closeWishlist();
      openCart();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not move to cart'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-black/35 backdrop-blur-[1px] transition-opacity duration-300 ${
          wishlistOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={wishlistOpen ? closeWishlist : undefined}
        aria-hidden={!wishlistOpen}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[95] flex w-full max-w-[420px] flex-col bg-[#f7f8fa] shadow-2xl transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom)] ${
          wishlistOpen
            ? 'pointer-events-auto translate-x-0'
            : 'pointer-events-none translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        aria-hidden={!wishlistOpen}
      >
        <div className="flex items-center gap-2 border-b border-gray-200/80 bg-white px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Heart size={18} fill="currentColor" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900">My Wishlist</h2>
            <p className="text-[11px] text-gray-400">
              {wishlistCount} saved item{wishlistCount === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeWishlist}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-400">
                <Heart size={36} />
              </div>
              <p className="text-lg font-bold text-gray-900">Your wishlist is empty</p>
              <p className="mt-1 text-sm text-gray-500">Tap the heart on any product to save it.</p>
              <button
                type="button"
                onClick={closeWishlist}
                className="mt-6 rounded-2xl bg-[#1a4b8c] px-6 py-3 text-sm font-semibold text-white"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-3 p-4">
              {products.map((product) => {
                const id = product.id || product._id;
                const busy = String(busyId) === String(id);
                return (
                  <li
                    key={id}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="flex gap-3 p-3.5">
                      <Link
                        to={`/product/${product.slug}`}
                        onClick={closeWishlist}
                        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f4f7fa]"
                      >
                        <img
                          src={productImageUrl(product, 160)}
                          alt={product.name}
                          className="h-full w-full object-contain p-1.5"
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/product/${product.slug}`}
                          onClick={closeWishlist}
                          className="line-clamp-2 text-[13px] font-bold text-gray-900"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {product.category?.name || 'Marine'}
                        </p>
                        <div className="mt-1.5">
                          <span className="text-xs font-semibold text-cyan">Ask for price</span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => moveToCart(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a4b8c] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#143a6e] disabled:opacity-50"
                          >
                            <ShoppingCart size={13} />
                            Move to cart
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => removeItem(id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {products.length > 0 && !loading && (
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => {
                closeWishlist();
                openCart();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-navy/15 bg-[#f3f8fb] py-3 text-sm font-bold text-navy transition hover:bg-[#e8f4f8]"
            >
              <ShoppingBag size={16} />
              Open cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
