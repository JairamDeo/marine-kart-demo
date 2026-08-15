import { Link } from 'react-router-dom';
import { Eye, Heart, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { productImageUrl } from '../../utils/productImage';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';
import { wishlistService } from '../../services/wishlist.service';
import { friendlyError } from '../../utils/toastMsg';

/** Horizontal list-row product (same actions as card, different layout). */
export default function ProductListItem({ product }) {
  const { isAuthenticated, refreshWishlist, addToCart, requireLogin, wishlistIds } = useAuth();
  const { openCart } = useCartUI();
  const img = productImageUrl(product, 240);
  const productId = String(product.id || product._id || '');
  const inWishlist = productId && wishlistIds?.includes(productId);
  const outOfStock = product.stockStatus === 'out_of_stock' || product.inStock === false;

  const handleAdd = async () => {
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    try {
      await addToCart(product, 1);
      toast.success('Added to cart');
      openCart();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not add to cart'));
    }
  };

  const toggleWish = async () => {
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
    <article className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-stretch">
      <Link
        to={`/product/${product.slug}`}
        className="group relative mx-auto flex h-36 w-full max-w-[160px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 sm:mx-0 sm:h-40 sm:w-40"
      >
        <img
          src={img}
          alt={product.productId || product.name}
          className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded bg-navy text-white opacity-0 shadow transition group-hover:opacity-100">
          <Eye size={14} />
        </span>
      </Link>

      <div className="min-w-0 flex-1 text-center sm:border-r sm:border-gray-100 sm:pr-5 sm:text-left">
        <p className="text-[11px] font-medium uppercase tracking-wide text-cyan">
          {product.category?.name || 'Marine'}
        </p>
        <Link
          to={`/product/${product.slug}`}
          className="mt-1 block text-base font-bold uppercase leading-snug text-gray-900 transition hover:text-navy"
        >
          {product.subcategory?.name
            ? `${product.subcategory.name} - ${product.productId || product.name}`
            : product.productId || product.name}
        </Link>
      </div>

      <div className="flex w-full shrink-0 flex-col items-center justify-center gap-2 sm:w-44 sm:items-stretch">
        <p className="text-xs text-gray-500">
          Availability:{' '}
          <span className={`font-semibold ${outOfStock ? 'text-rose-500' : 'text-cyan'}`}>
            {outOfStock ? 'Out Of Stock' : 'Available In Stock'}
          </span>
        </p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="inline-flex items-center justify-center gap-2 rounded bg-[#1a4b8c] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#143a6e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart size={14} />
          Ask For Price
        </button>
        <button
          type="button"
          onClick={toggleWish}
          className={`inline-flex items-center justify-center gap-2 text-xs font-semibold transition ${
            inWishlist ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'
          }`}
        >
          <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} />
          {inWishlist ? 'In Wishlist' : 'Add To Wishlist'}
        </button>
      </div>
    </article>
  );
}
