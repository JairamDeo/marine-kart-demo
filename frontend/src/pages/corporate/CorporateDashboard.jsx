import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';
import { orderService } from '../../services/order.service';
import { formatOrderStatus } from '../../utils/orderStatusShared';

export default function CorporateDashboard() {
  const { user, wishlistCount } = useAuth();
  const { openWishlist, openCart } = useCartUI();
  const [orderCount, setOrderCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService
      .getMyOrders({ limit: 20 })
      .then((res) => {
        const list = res.data.data.orders || [];
        setOrderCount(res.data.data.pagination?.total ?? list.length);
        setRecentOrders(list.slice(0, 4));
      })
      .catch(() => {
        setOrderCount(0);
        setRecentOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    );
  }

  const stats = [
    {
      label: 'My Orders',
      value: orderCount,
      icon: ShoppingBag,
      tone: 'bg-sky-50 text-sky-600',
      to: '/account/orders',
    },
    {
      label: 'Wishlist',
      value: wishlistCount,
      icon: Heart,
      tone: 'bg-rose-50 text-rose-500',
      onClick: openWishlist,
    },
    {
      label: 'My Profile',
      value: 'Profile',
      icon: UserCircle,
      tone: 'bg-indigo-50 text-indigo-600',
      to: '/account/profile',
    },
  ];

  return (
    <div className="space-y-7">
      <div className="portal-fade-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a4b8c] via-[#1e5a9e] to-[#0f172a] p-7 text-white shadow-xl sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan/20 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan">
            <Sparkles size={12} />
            My account
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
            Track orders, update your profile, and continue shopping from your console.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/account/orders"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold !text-[#1a4b8c] shadow-lg transition hover:bg-sky-50"
            >
              View orders
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Open cart
            </button>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => {
          const className =
            'portal-fade-in group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';
          const inner = (
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.tone} transition group-hover:scale-105`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {s.label}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          );

          if (s.onClick) {
            return (
              <button
                key={s.label}
                type="button"
                onClick={s.onClick}
                className={`${className} cursor-pointer`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={s.label}
              to={s.to}
              className={className}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-navy">Recent orders</h3>
          <Link to="/account/orders" className="text-xs font-semibold text-navy hover:underline">
            See all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <ShoppingBag className="mb-2 text-gray-300" size={36} />
            <p className="text-sm font-medium text-gray-500">No orders yet</p>
            <Link to="/shop" className="mt-3 text-sm font-semibold text-navy hover:underline">
              Browse shop →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentOrders.map((o) => (
              <li
                key={o._id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-navy">
                  {formatOrderStatus(o.orderStatus, { forCustomer: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
