function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function QuotationTotalsBreakdown({ quotation, compact = false }) {
  if (!quotation) return null;
  const itemsGross =
    Number(quotation.itemsSubtotal || 0) + Number(quotation.discountTotal || 0);
  const rowClass = compact
    ? 'flex justify-between text-[12px] text-gray-600'
    : 'flex justify-between text-gray-600';

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5 text-sm'}>
      <div className={rowClass}>
        <span>Items subtotal</span>
        <span className="font-medium text-gray-900">{money(itemsGross)}</span>
      </div>
      {Number(quotation.discountTotal) > 0 && (
        <div className={rowClass}>
          <span>Discount</span>
          <span className="font-medium text-gray-900">{money(quotation.discountTotal)}</span>
        </div>
      )}
      {Number(quotation.courierCharges) > 0 && (
        <div className={rowClass}>
          <span>Courier</span>
          <span className="font-medium text-gray-900">{money(quotation.courierCharges)}</span>
        </div>
      )}
      {Number(quotation.otherCharges) > 0 && (
        <div className={rowClass}>
          <span>Other charges</span>
          <span className="font-medium text-gray-900">{money(quotation.otherCharges)}</span>
        </div>
      )}
      <div className={rowClass}>
        <span>GST ({quotation.gstPercent || 0}%)</span>
        <span className="font-medium text-gray-900">{money(quotation.gstAmount)}</span>
      </div>
      <div
        className={`flex items-center justify-between border-t border-gray-100 pt-2 ${
          compact ? 'text-sm' : ''
        }`}
      >
        <span className="font-bold text-gray-900">Grand total</span>
        <span className={`font-bold text-navy ${compact ? 'text-base' : 'text-base'}`}>
          {money(quotation.grandTotal)}
        </span>
      </div>
    </div>
  );
}

export function QuotationTermsList({ terms = [] }) {
  const rows = (terms || []).filter((t) => t?.label || t?.value);
  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="bg-gradient-to-r from-[#0b2c5f] to-[#1a4b8c] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          Terms & conditions
        </p>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        {rows.map((term, idx) => (
          <div key={`${term.label}-${idx}`} className="rounded-lg bg-[#f5f9fc] px-2.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {term.label || 'Term'}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-navy">{term.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
