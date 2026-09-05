import { Link } from 'react-router-dom';
import { Eye, Heart, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { productImageUrl } from '../../utils/productImage';
import { formatProductTitle } from '../../utils/productTitle';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';
import { wishlistService } from '../../services/wishlist.service';
import { friendlyError } from '../../utils/toastMsg';

export default function ProductCard({ product }) {
  const { isAuthenticated, refreshWishlist, addToCart, requireLogin, wishlistIds } = useAuth();
  const { openCart } = useCartUI();
  const img = productImageUrl(product);
  const productId = String(product.id || product._id || '');
  const inWishlist = productId && wishlistIds?.includes(productId);
  const line2 = formatProductTitle(product);
  const title = product.productId || product.name;
  const outOfStock = product.stockStatus === 'out_of_stock' || product.inStock === false;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    try {
      // Fire request; optimistic cart update opens drawer immediately
      const pending = addToCart(product, 1);
      toast.success('Added to cart');
      openCart();
      await pending;
    } catch (err) {
      toast.error(friendlyError(err, 'Could not add to cart'));
    }
  };

  const toggleWish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      requireLogin('Please login first to save items to your wishlist.', '/login');
      return;
    }
    try {
      const { data } = await wishlistService.toggle(productId);
      await refreshWishlist();
      toast.success(
        data.message || (data.data?.added ? 'Added to wishlist' : 'Removed from wishlist')
      );
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update wishlist'));
    }
  };

  return (
    <div className="product-card-store group flex h-full flex-col overflow-hidden rounded-xl bg-white p-2 ring-1 ring-gray-100 transition sm:p-3">
      <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-gray-50 sm:mb-3">
        <Link to={`/product/${product.slug}`} className="absolute inset-0 block">
          <img
            src={img}
            alt={title}
            className="h-full w-full object-contain p-1.5 transition duration-500 group-hover:scale-110 sm:p-2"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <button
          type="button"
          onClick={toggleWish}
          className={`absolute right-1.5 top-1.5 z-10 rounded-full bg-white/95 p-1.5 shadow-md transition hover:scale-110 sm:right-2 sm:top-2 ${
            inWishlist ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
        <Link
          to={`/product/${product.slug}`}
          className="absolute inset-0 z-[5] flex items-center justify-center bg-navy/0 opacity-0 transition hover:bg-navy/10 group-hover:opacity-100"
          aria-label={`View ${title}`}
          tabIndex={-1}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded bg-navy text-white shadow-lg">
            <Eye size={16} />
          </span>
        </Link>
      </div>

      <Link to={`/product/${product.slug}`}>
        <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-wide text-cyan">
          {product.category?.name || 'Marine Product'}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold text-navy transition group-hover:text-[#143a6e]">
          {line2}
        </h3>
      </Link>

      <div className="mt-auto pt-2 sm:pt-3">
        <p
          className={`mb-2 text-[11px] font-semibold ${
            outOfStock ? 'text-rose-500' : 'text-emerald-600'
          }`}
        >
          {outOfStock ? 'Out Of Stock' : 'Available In Stock'}
        </p>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-[#78c6d4] px-1.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#5bb5c6] disabled:cursor-not-allowed disabled:opacity-50 xs:gap-1.5 xs:px-2 xs:text-[11px] sm:gap-1.5 sm:px-3 sm:text-xs"
        >
          <ShoppingCart size={13} className="shrink-0 sm:hidden" />
          <ShoppingCart size={14} className="hidden shrink-0 sm:block" />
          <span className="whitespace-nowrap">Ask For Price</span>
        </button>
      </div>
    </div>
  );
}
