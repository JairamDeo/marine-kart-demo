import { Icon } from '@iconify/react';

const VARIANTS = {
  view: 'bg-violet-50 text-violet-600 hover:bg-violet-100 hover:shadow-violet-200/60',
  edit: 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:shadow-sky-200/60',
  delete: 'bg-rose-50 text-rose-500 hover:bg-rose-100 hover:shadow-rose-200/60',
  default: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
};

const ICONS = {
  view: 'bx:show',
  edit: 'bx:edit-alt',
  delete: 'bx:trash',
};

/**
 * Compact animated action button for admin/dealer tables.
 */
export default function ActionIcon({
  variant = 'default',
  icon,
  title,
  onClick,
  className = '',
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`group flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
        VARIANTS[variant] || VARIANTS.default
      } ${className}`}
    >
      <Icon
        icon={icon || ICONS[variant] || 'bx:dots-horizontal-rounded'}
        width={18}
        height={18}
        className="transition-transform duration-200 group-hover:scale-110"
      />
    </button>
  );
}

export function ActionGroup({ children }) {
  return <div className="flex items-center gap-1.5">{children}</div>;
}
