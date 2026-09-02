import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Phone, ChevronDown, ChevronRight } from 'lucide-react';
import { SITE } from '../../constants/config';

/**
 * All Categories mega-menu:
 * left = categories, right = subcategories of hovered category (panel stays open).
 */
export default function Navbar({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const [activeCatId, setActiveCatId] = useState(null);
  const panelRef = useRef(null);

  const activeCat =
    categories.find((c) => String(c._id || c.id) === String(activeCatId)) || categories[0] || null;
  const subs = activeCat?.children || [];

  useEffect(() => {
    if (!open) return undefined;
    if (!activeCatId && categories[0]) {
      setActiveCatId(categories[0]._id || categories[0].id);
    }
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, activeCatId, categories]);

  const linkClass = ({ isActive }) =>
    `px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition lg:px-3.5 lg:py-2.5 lg:text-[13px] ${
      isActive ? 'text-cyan' : 'text-white hover:text-cyan'
    }`;

  return (
    <div className="bg-[#143a6e]">
      <div className="container-mk flex items-center gap-1">
        <div className="relative min-w-0" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 bg-[#78c6d4] px-2.5 py-2.5 text-[11px] font-bold uppercase text-white transition hover:bg-[#5bb5c6] sm:gap-2 sm:px-4 sm:py-3 sm:text-sm lg:py-2.5"
            aria-expanded={open}
          >
            <Menu size={16} className="shrink-0 sm:hidden" />
            <Menu size={18} className="hidden shrink-0 sm:block" />
            <span className="truncate">
              <span className="xs:hidden">Categories</span>
              <span className="hidden xs:inline">All Categories</span>
            </span>
            <ChevronDown size={14} className={`shrink-0 transition sm:hidden ${open ? 'rotate-180' : ''}`} />
            <ChevronDown size={16} className={`hidden shrink-0 transition sm:block ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute left-0 z-50 mt-0 flex w-[min(94vw,640px)] max-h-[min(75vh,560px)] flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl sm:flex-row">
              <div className="w-full shrink-0 border-b border-gray-100 sm:w-[46%] sm:min-w-[180px] sm:border-b-0 sm:border-r">
                <div className="bg-[#143a6e] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white sm:px-4 sm:py-2.5 sm:text-xs">
                  Categories
                </div>
                <ul className="max-h-[28vh] overflow-auto py-1 text-sm sm:max-h-[70vh]">
                  {categories.map((cat) => {
                    const id = cat._id || cat.id;
                    const isActive = String(activeCatId) === String(id);
                    return (
                      <li key={id}>
                        <div
                          className={`flex items-stretch ${
                            isActive ? 'bg-[#eef6f9]' : 'hover:bg-[#f8fafc]'
                          }`}
                          onMouseEnter={() => setActiveCatId(id)}
                          onClick={() => setActiveCatId(id)}
                        >
                          <Link
                            to={`/category/${cat.slug}`}
                            onClick={() => setOpen(false)}
                            className={`flex flex-1 items-center justify-between px-3 py-2.5 font-medium transition sm:px-4 ${
                              isActive ? 'text-navy' : 'text-gray-700'
                            }`}
                          >
                            <span className="line-clamp-1 text-[13px] sm:text-sm">{cat.name}</span>
                            {cat.children?.length > 0 && (
                              <ChevronRight size={16} className="shrink-0 text-gray-400" />
                            )}
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                  {categories.length === 0 && (
                    <li className="px-4 py-6 text-center text-xs text-gray-400">No categories</li>
                  )}
                </ul>
              </div>

              <div className="min-h-0 min-w-0 flex-1 bg-[#fafbfc]">
                <ul className="max-h-[36vh] overflow-auto py-1 text-sm sm:max-h-[70vh]">
                  {subs.map((sub) => (
                    <li key={sub._id || sub.id}>
                      <Link
                        to={`/category/${activeCat.slug}?subcategory=${sub._id || sub.id}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2.5 text-[13px] text-gray-600 transition hover:bg-white hover:text-navy sm:px-4 sm:text-sm"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                  {activeCat && subs.length === 0 && (
                    <li className="px-4 py-8 text-center text-xs text-gray-400">
                      No subcategories — click the category to browse products.
                    </li>
                  )}
                  {!activeCat && (
                    <li className="px-4 py-8 text-center text-xs text-gray-400">
                      Select a category
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        <nav className="hidden flex-1 items-center md:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/shop" className={linkClass}>
            Shop
          </NavLink>
          <NavLink to="/about-us" className={linkClass}>
            About Us
          </NavLink>
          <NavLink to="/contact-us" className={linkClass}>
            Contact Us
          </NavLink>
          <NavLink to="/product-not-listed" className={linkClass}>
            Product Not Listed
          </NavLink>
        </nav>

        <div className="ml-auto hidden items-center gap-2 py-2.5 text-sm text-white min-[400px]:flex lg:py-2">
          <Phone size={14} className="shrink-0 text-cyan sm:hidden" />
          <Phone size={16} className="hidden shrink-0 text-cyan sm:block" />
          <span className="truncate text-xs sm:text-sm">
            <span className="hidden sm:inline">Call us: </span>
            <span className="font-medium">{SITE.phone}</span>
          </span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto overscroll-x-contain border-t border-white/10 px-3 py-2 scrollbar-thin md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { to: '/', label: 'Home' },
          { to: '/shop', label: 'Shop' },
          { to: '/about-us', label: 'About Us' },
          { to: '/contact-us', label: 'Contact Us' },
          { to: '/product-not-listed', label: 'Product Not Listed' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase text-white/90 transition hover:bg-white/10 hover:text-cyan"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
