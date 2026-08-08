import { useEffect, useState } from 'react';

const ICON_TONES = {
  blue: 'bg-sky-50 text-sky-500',
  amber: 'bg-amber-50 text-amber-500',
  green: 'bg-emerald-50 text-emerald-500',
  rose: 'bg-rose-50 text-rose-500',
  slate: 'bg-slate-100 text-slate-500',
  orange: 'bg-orange-50 text-orange-500',
};

/**
 * White metric card — pastel icon circle (reference-style, not rainbow fills).
 */
export default function StatCard({ label, value, icon: Icon, tone = 'blue', delay = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ICON_TONES[tone] || ICON_TONES.blue}`}
          >
            <Icon className="h-5 w-5 stroke-[1.75]" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-400">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-gray-900">{value ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}
