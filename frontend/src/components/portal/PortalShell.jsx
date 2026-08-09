import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

/**
 * Portal shell for Admin / Corporate / Customer My Account.
 * variant: "admin" | "corporate" | "customer" (legacy alias: "dealer" → corporate)
 * Corporate uses the same navy/cyan visual language as customer.
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
  const isAdmin = !isStorePortal;

  const handleLogout = () => {
    logout(isStorePortal ? 'customer' : 'admin');
    toast.success('Logged out successfully');
    navigate(loginPath);
  };

  const activeNav = isAdmin
    ? 'bg-amber-300/90 text-gray-900 shadow-sm'
    : 'bg-[#1a4b8c] text-white shadow-md shadow-[#1a4b8c]/25';

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
      open ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
    } ${
      isActive ? activeNav : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const avatarClass = isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-navy';

  const homeBtn = isAdmin
    ? 'border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100'
    : 'border-sky-100 bg-sky-50/80 text-navy hover:bg-sky-100';

  const sidebarToggle = isAdmin
    ? 'text-[#e11d48] hover:bg-rose-50'
    : 'text-navy hover:bg-sky-50';

  const bg = isAdmin ? 'bg-[#f5f6f8]' : 'bg-[#f4f7fb]';

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
          <Link
            to={homePath || '/'}
            className={`overflow-hidden rounded-lg bg-black transition hover:opacity-90 ${
              open ? 'px-2 py-1' : 'flex h-10 w-10 items-center justify-center p-0.5'
            }`}
            title="Back to Home"
          >
            <BrandLogo className={open ? 'h-9 w-auto max-w-[180px]' : 'h-8 w-8 object-contain'} />
          </Link>
        </div>

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

        <div className={`border-t border-gray-100 p-3 ${open ? '' : 'px-2'}`}>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 ${
              open ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
            }`}
            title={!open ? 'Logout' : undefined}
          >
            <Icon icon="bx:log-out" width={18} height={18} className="shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
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
            {title ? <p className="text-sm font-semibold text-gray-800">{title}</p> : null}
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </header>

        <main data-scroll-reset className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
