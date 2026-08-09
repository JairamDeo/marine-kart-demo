import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';

/**
 * Split auth layout — marine-themed panel + form.
 * Uses exact MarineKart logo (no separate logo text).
 */
export default function AuthSplitLayout({
  title,
  subtitle,
  children,
  footerLinks = [],
}) {
  const panel = 'from-[#1a4b8c] via-[#143a6e] to-[#0f172a]';

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <aside
        className={`relative hidden w-[46%] overflow-hidden bg-gradient-to-br ${panel} lg:flex lg:flex-col lg:justify-between lg:p-12`}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan/10" />
        <div className="pointer-events-none absolute bottom-24 right-10 h-40 w-40 rounded-full border border-white/10" />

        <div>
          <div className="mb-8 inline-flex rounded-2xl bg-black p-3 shadow-lg">
            <BrandLogo className="h-16 w-auto" />
          </div>
          <h1 className="mt-2 max-w-md text-4xl font-bold leading-tight text-white">{title}</h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">{subtitle}</p>
        </div>

        <ul className="relative z-10 space-y-4 text-sm text-white/80">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan" />
            Premium marine hardware & steering systems
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan" />
            Login to view prices · Corporate pricing support
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan" />
            Fast delivery across serviceable regions
          </li>
        </ul>
      </aside>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="portal-fade-in w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 inline-flex rounded-xl bg-black p-2">
              <BrandLogo className="h-12 w-auto" />
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            {children}
          </div>

          {footerLinks.length > 0 && (
            <p className="mt-6 text-center text-xs text-gray-400">
              {footerLinks.map((link, i) => (
                <span key={link.to}>
                  {i > 0 && <span className="mx-2">·</span>}
                  <Link to={link.to} className="cursor-pointer hover:text-gray-700 hover:underline">
                    {link.label}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
