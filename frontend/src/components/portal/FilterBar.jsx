import { Icon } from '@iconify/react';

/** Compact select — whole control is clickable; chevron is decorative only */
export function FilterSelect({ value, onChange, children, className = '', ariaLabel }) {
  return (
    <label
      className={`relative inline-block h-10 shrink-0 cursor-pointer max-[479px]:w-full ${className}`}
    >
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        className="box-border h-full w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-9 text-[13px] font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 z-0 flex w-8 items-center justify-center text-gray-400"
        aria-hidden
      >
        <Icon icon="bx:chevron-down" width={16} height={16} className="pointer-events-none" />
      </span>
    </label>
  );
}

/** Search field with non-overlapping icon */
export function SearchField({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full min-w-0 max-w-none shrink-0 sm:min-w-[180px] sm:max-w-[240px] sm:w-[220px]">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-gray-400">
        <Icon icon="bx:search" width={18} height={18} />
      </span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="box-border h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-[13px] text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
      />
    </div>
  );
}
