import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

/**
 * Portal shell for Admin / Corporate / Customer My Account.
 * variant: "admin" | "corporate" | "customer" (legacy alias: "dealer" → corporate)
 */
export default function PortalShell({
  title,
  navItems,
  loginPath = '/admin-login',
  variant = 'admin',
  homePath,
}) {
  const [open, setOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isCorporate = variant === 'corporate' || variant === 'dealer';
  const isCustomer = variant === 'customer';
  const isStorePortal = isCorporate || isCustomer;

  const handleLogout = () => {
    logout(isStorePortal ? 'customer' : 'admin');
    toast.success('Logged out successfully');
    navigate(loginPath);
  };

  const activeNav = isCorporate
    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
    : isCustomer
      ? 'bg-[#1a4b8c] text-white shadow-md shadow-[#1a4b8c]/25'
      : 'bg-amber-300/90 text-gray-900 shadow-sm';

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
      open ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
    } ${
      isActive ? activeNav : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const avatarClass = isCorporate
    ? 'bg-teal-100 text-teal-800'
    : isCustomer
      ? 'bg-sky-100 text-navy'
      : 'bg-amber-100 text-amber-800';

  const homeBtn = isCorporate
    ? 'border-teal-100 bg-teal-50/80 text-teal-800 hover:bg-teal-100'
    : isCustomer
      ? 'border-sky-100 bg-sky-50/80 text-navy hover:bg-sky-100'
      : 'border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100';

  const homeHeaderBtn = isCorporate
    ? 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100'
    : 'border-sky-200 bg-sky-50 text-navy hover:bg-sky-100';

  const sidebarToggle = isCorporate
    ? 'text-teal-700 hover:bg-teal-50'
    : isCustomer
      ? 'text-navy hover:bg-sky-50'
      : 'text-[#e11d48] hover:bg-rose-50';

  const portalLabel = isCorporate
    ? 'Corporate account'
    : isCustomer
      ? 'Customer account'
      : 'Admin';

  const headerSub = isCorporate
    ? 'MarineKart Corporate'
    : isCustomer
      ? 'MarineKart Account'
      : 'MarineKart Administration';

  const bg = isCorporate ? 'bg-[#f3f7f8]' : isCustomer ? 'bg-[#f4f7fb]' : 'bg-[#f5f6f8]';

  return (
    <div className={`flex min-h-screen ${bg}`}>
      <aside
        className={`portal-sidebar sticky top-0 flex h-screen shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out ${
          open ? 'w-[240px]' : 'w-[72px]'
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-gray-100 ${
            open ? 'px-3' : 'justify-center px-2'
          }`}
        >
          <div
            className={`overflow-hidden rounded-lg bg-black ${
              open ? 'px-2 py-1' : 'flex h-10 w-10 items-center justify-center p-0.5'
            }`}
          >
            <BrandLogo className={open ? 'h-9 w-auto max-w-[180px]' : 'h-8 w-8 object-contain'} />
          </div>
        </div>

        {open && (
          <div className="border-b border-gray-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {portalLabel}
            </p>
            <p className="truncate text-sm font-semibold text-navy">{title}</p>
          </div>
        )}

        <nav className={`flex-1 space-y-0.5 overflow-y-auto py-4 ${open ? 'px-3' : 'px-2'}`}>
          {homePath ? (
            <Link
              to={homePath}
              className={`group relative mb-2 flex items-center gap-3 rounded-xl border text-[13px] font-semibold transition ${homeBtn} ${
                open ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
              }`}
              title={!open ? 'Back to Home' : undefined}
            >
              <Icon icon="bx:home" width={18} height={18} className="shrink-0" />
              {open && <span className="truncate">Back to Home</span>}
              {!open && (
                <span className="pointer-events-none absolute left-full z-40 ml-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                  Back to Home
                </span>
              )}
            </Link>
          ) : null}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              title={!open ? item.label : undefined}
            >
              {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />}
              {open && <span className="truncate">{item.label}</span>}
              {!open && (
                <span className="pointer-events-none absolute left-full z-40 ml-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {open && (
          <div className="border-t border-gray-100 p-3">
            <div className="rounded-xl bg-gradient-to-br from-[#1a4b8c]/5 to-cyan/10 px-3 py-2.5">
              <p className="truncate text-xs font-semibold text-navy">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition ${sidebarToggle}`}
              aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
              title={open ? 'Collapse menu' : 'Expand menu'}
            >
              <Icon icon="bx:sidebar" width={24} height={24} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="hidden text-xs text-gray-400 sm:block">{headerSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {homePath ? (
              <Link
                to={homePath}
                className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition sm:inline-flex ${homeHeaderBtn}`}
              >
                <Icon icon="bx:home" width={18} height={18} />
                Back to Home
              </Link>
            ) : null}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs capitalize text-gray-400">
                {user?.role === 'dealer' ? 'corporate' : user?.role}
              </p>
            </div>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${avatarClass}`}
            >
              {(user?.firstName?.[0] || 'U').toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <Icon icon="bx:log-out" width={18} height={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main data-scroll-reset className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
