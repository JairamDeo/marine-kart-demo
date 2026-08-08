import {
  Truck,
  HandCoins,
  MessagesSquare,
  BadgeCheck,
  PackageCheck,
} from 'lucide-react';

const FEATURES = [
  { icon: Truck, title: 'Fast Delivery', hint: 'Reliable dispatch' },
  { icon: PackageCheck, title: 'Easy Ordering', hint: 'Place & track orders' },
  { icon: HandCoins, title: 'Competitive Price', hint: 'Fair marine rates' },
  { icon: MessagesSquare, title: '24/7 Support', hint: 'Always available' },
  { icon: BadgeCheck, title: 'Quality Assurance', hint: 'Trusted parts' },
];

export default function FeatureBar({ variant = 'light' }) {
  const dark = variant === 'dark';

  return (
    <div
      className={
        dark
          ? 'bg-navy text-white'
          : 'border-y border-gray-100 bg-white text-gray-700'
      }
      data-aos={dark ? undefined : 'fade-up'}
    >
      <div className="container-mk grid grid-cols-2 gap-3 py-6 sm:grid-cols-3 lg:grid-cols-5">
        {FEATURES.map(({ icon: Icon, title, hint }, i) => (
          <div
            key={title}
            className={`feature-item flex items-center gap-3 rounded-xl px-2 py-2 ${
              dark ? 'hover:bg-white/5' : 'hover:bg-cyan/5'
            }`}
            data-aos={dark ? undefined : 'zoom-in'}
            data-aos-delay={i * 70}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                dark
                  ? 'bg-white/10 text-cyan'
                  : 'bg-cyan/15 text-navy group-hover:bg-cyan group-hover:text-white'
              }`}
            >
              <Icon size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className={`text-[11px] ${dark ? 'text-white/50' : 'text-gray-400'}`}>{hint}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
