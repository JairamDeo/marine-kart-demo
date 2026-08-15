import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

/**
 * Portal shell for Admin / Corporate / Customer My Account.
 * Mobile: off-canvas sidebar + backdrop. Desktop (lg+): sticky collapsible rail.
 */
export default function PortalShell({
  title,
  navItems,
  loginPath = '/admin-login',
  variant = 'admin',
  homePath,
}) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isCorporate = variant === 'corporate' || variant === 'dealer';
  const isCustomer = variant === 'customer';
  const isStorePortal = isCorporate || isCustomer;
  const isAdmin = !isStorePortal;

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout(isStorePortal ? 'customer' : 'admin');
    toast.success('Logged out successfully');
    navigate(loginPath);
  };

  const activeNav = isAdmin
    ? 'bg-amber-300/90 text-gray-900 shadow-sm'
    : 'bg-[#1a4b8c] text-white shadow-md shadow-[#1a4b8c]/25';

  const linkClass = (expanded) =>
    ({ isActive }) =>
      `group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
        expanded ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
      } ${isActive ? activeNav : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;

  const avatarClass = isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-navy';

  const homeBtn = isAdmin
    ? 'border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100'
    : 'border-sky-100 bg-sky-50/80 text-navy hover:bg-sky-100';

  const sidebarToggle = isAdmin
    ? 'text-[#e11d48] hover:bg-rose-50'
    : 'text-navy hover:bg-sky-50';

  const bg = isAdmin ? 'bg-[#f5f6f8]' : 'bg-[#f4f7fb]';

  const renderSidebar = (expanded, onNavClick) => (
    <>
      <div
        className={`flex h-14 shrink-0 items-center border-b border-gray-100 sm:h-16 ${
          expanded ? 'px-3' : 'justify-center px-2'
        }`}
      >
        <Link
          to={homePath || '/'}
          onClick={onNavClick}
          className={`overflow-hidden transition hover:opacity-90 ${
            expanded ? '' : 'flex h-10 w-10 items-center justify-center'
          }`}
          title="Back to Home"
        >
          <BrandLogo
            className={expanded ? 'h-12 w-auto max-w-[200px] sm:h-14 sm:max-w-[220px]' : 'h-10 w-10 object-contain'}
          />
        </Link>
      </div>

      <nav className={`flex-1 space-y-0.5 overflow-y-auto overscroll-contain py-3 sm:py-4 ${expanded ? 'px-3' : 'px-2'}`}>
        {homePath ? (
          <Link
            to={homePath}
            onClick={onNavClick}
            className={`group relative mb-2 flex items-center gap-3 rounded-xl border text-[13px] font-semibold transition ${homeBtn} ${
              expanded ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
            }`}
            title={!expanded ? 'Back to Home' : undefined}
          >
            <Icon icon="bx:home" width={18} height={18} className="shrink-0" />
            {expanded && <span className="truncate">Back to Home</span>}
            {!expanded && (
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
            onClick={onNavClick}
            className={linkClass(expanded)}
            title={!expanded ? item.label : undefined}
          >
            {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />}
            {expanded && <span className="truncate">{item.label}</span>}
            {!expanded && (
              <span className="pointer-events-none absolute left-full z-40 ml-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-gray-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${expanded ? '' : 'px-2'}`}>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 ${
            expanded ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
          }`}
          title={!expanded ? 'Logout' : undefined}
        >
          <Icon icon="bx:log-out" width={18} height={18} className="shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className={`flex h-[100dvh] max-h-[100dvh] overflow-hidden ${bg}`}>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />

      {/* Mobile off-canvas sidebar */}
      <aside
        className={`portal-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,260px)] flex-col border-r border-gray-100 bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-2 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Close menu"
        >
          <Icon icon="bx:x" width={22} height={22} />
        </button>
        {renderSidebar(true, () => setMobileOpen(false))}
      </aside>

      {/* Desktop sidebar — full height of viewport shell */}
      <aside
        className={`portal-sidebar z-20 hidden h-full shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out lg:flex ${
          desktopOpen ? 'w-[240px]' : 'w-[72px]'
        }`}
      >
        {renderSidebar(desktopOpen)}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-100/80 bg-white/95 px-3 backdrop-blur-md sm:h-16 sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) {
                  setDesktopOpen((v) => !v);
                } else {
                  setMobileOpen((v) => !v);
                }
              }}
              className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition ${sidebarToggle}`}
              aria-label="Toggle menu"
              title="Toggle menu"
            >
              <Icon icon="bx:sidebar" width={24} height={24} />
            </button>
            {title ? (
              <p className="max-w-[42vw] truncate text-sm font-semibold text-gray-800 sm:max-w-none">
                {title}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right min-[480px]:block">
              <p className="max-w-[140px] truncate text-sm font-semibold text-gray-800 sm:max-w-[200px]">
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

        <main
          data-scroll-reset
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-3 sm:p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
