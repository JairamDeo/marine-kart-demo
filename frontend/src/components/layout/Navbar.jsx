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
    `px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition ${
      isActive ? 'text-cyan' : 'text-white hover:text-cyan'
    }`;

  return (
    <div className="bg-[#143a6e]">
      <div className="container-mk flex items-center gap-1">
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 bg-[#78c6d4] px-4 py-3.5 text-sm font-bold uppercase text-white transition hover:bg-[#5bb5c6]"
            aria-expanded={open}
          >
            <Menu size={18} />
            All Categories
            <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div
              className="absolute left-0 z-50 mt-0 flex w-[min(92vw,640px)] overflow-hidden border border-gray-200 bg-white shadow-2xl"
              onMouseLeave={() => {
                /* keep panel open until click-outside; only reset hover highlight softly */
              }}
            >
              <div className="w-[46%] min-w-[200px] border-r border-gray-100">
                <div className="bg-[#143a6e] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">
                  Categories
                </div>
                <ul className="max-h-[70vh] overflow-auto py-1 text-sm">
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
                        >
                          <Link
                            to={`/category/${cat.slug}`}
                            onClick={() => setOpen(false)}
                            className={`flex flex-1 items-center justify-between px-4 py-2.5 font-medium transition ${
                              isActive ? 'text-navy' : 'text-gray-700'
                            }`}
                          >
                            <span className="line-clamp-1">{cat.name}</span>
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

              <div className="min-w-0 flex-1 bg-[#fafbfc]">
                <div className="border-b border-gray-100 bg-white px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan">
                    Subcategories
                  </p>
                  <p className="truncate text-sm font-bold text-navy">
                    {activeCat?.name || 'Select a category'}
                  </p>
                </div>
                <ul className="max-h-[70vh] overflow-auto py-1 text-sm">
                  {activeCat && (
                    <li>
                      <Link
                        to={`/category/${activeCat.slug}`}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 font-semibold text-navy hover:bg-white"
                      >
                        View all in {activeCat.name}
                      </Link>
                    </li>
                  )}
                  {subs.map((sub) => (
                    <li key={sub._id || sub.id}>
                      <Link
                        to={`/category/${activeCat.slug}?subcategory=${sub._id || sub.id}`}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 text-gray-600 transition hover:bg-white hover:text-navy"
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
        </nav>

        <div className="ml-auto flex items-center gap-2 py-3.5 text-sm text-white">
          <Phone size={16} className="text-cyan" />
          <span>
            Call us: <span className="font-medium">{SITE.phone}</span>
          </span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
        {[
          { to: '/', label: 'Home' },
          { to: '/shop', label: 'Shop' },
          { to: '/about-us', label: 'About Us' },
          { to: '/contact-us', label: 'Contact Us' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="whitespace-nowrap px-3 py-1.5 text-xs font-semibold uppercase text-white/90 transition hover:text-cyan"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
