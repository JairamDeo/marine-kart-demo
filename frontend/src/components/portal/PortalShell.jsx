import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

/** Portal chrome (sidebar + header) — MarineKart navy for admin, customer & corporate */
const CHROME = '#1a4b8c';

/**
 * Portal shell for Admin / Corporate / Customer My Account.
 * Mobile: off-canvas sidebar + drawer. Desktop (lg+): sticky collapsible rail.
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

  const linkClass = (expanded) =>
    ({ isActive }) =>
      `group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
        expanded ? 'px-3.5 py-2.5' : 'justify-center px-0 py-2.5'
      } ${
        isActive
          ? 'bg-white text-[#1a4b8c] shadow-md shadow-black/10'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`;

  const renderSidebar = (expanded, onNavClick) => (
    <>
      <div
        className={`flex h-14 shrink-0 items-center border-b border-white/15 sm:h-16 ${
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
            className={
              expanded
                ? 'h-10 w-auto max-w-[180px] sm:h-11 sm:max-w-[200px]'
                : 'h-8 w-8 object-contain'
            }
          />
        </Link>
      </div>

      <nav
        className={`flex-1 space-y-0.5 overflow-y-auto overscroll-contain py-3 sm:py-4 ${
          expanded ? 'px-3' : 'px-2'
        }`}
      >
        {homePath ? (
          <Link
            to={homePath}
            onClick={onNavClick}
            className={`group relative mb-2 flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 text-[13px] font-semibold text-white transition hover:bg-white/20 ${
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

      <div
        className={`shrink-0 border-t border-white/15 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          expanded ? '' : 'px-2'
        }`}
      >
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/25 text-[13px] font-semibold text-white/90 transition hover:border-rose-300/50 hover:bg-rose-500/20 hover:text-white ${
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
    <div className="flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f4f7fb]">
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
        className={`portal-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,260px)] flex-col shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: CHROME }}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-2 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Close menu"
        >
          <Icon icon="bx:x" width={22} height={22} />
        </button>
        {renderSidebar(true, () => setMobileOpen(false))}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`portal-sidebar z-20 hidden h-full shrink-0 flex-col transition-all duration-300 ease-in-out lg:flex ${
          desktopOpen ? 'w-[240px]' : 'w-[72px]'
        }`}
        style={{ backgroundColor: CHROME }}
      >
        {renderSidebar(desktopOpen)}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 shadow-md sm:h-16 sm:px-4 md:px-6"
          style={{ backgroundColor: CHROME }}
        >
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
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white transition hover:bg-white/15"
              aria-label="Toggle menu"
              title="Toggle menu"
            >
              <Icon icon="bx:sidebar" width={24} height={24} />
            </button>
            {title ? (
              <p className="max-w-[42vw] truncate text-sm font-semibold text-white sm:max-w-none">
                {title}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right min-[480px]:block">
              <p className="max-w-[140px] truncate text-sm font-semibold text-white sm:max-w-[200px]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs capitalize text-white/65">
                {user?.role === 'dealer' ? 'corporate' : user?.role}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-1 ring-white/30">
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
