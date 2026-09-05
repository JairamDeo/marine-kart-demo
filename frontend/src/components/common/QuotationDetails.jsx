function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function isGoaState(state) {
  return /^goa$/i.test(String(state || '').trim());
}

/** Build GST display rows from saved quotation (+ optional address for legacy quotes). */
export function quotationGstRows(quotation, address) {
  if (!quotation) return [];
  const gstAmount = Number(quotation.gstAmount) || 0;
  if (gstAmount <= 0) return [];

  const mode =
    quotation.gstMode ||
    (isGoaState(address?.state) ? 'full' : 'split');

  if (mode === 'split') {
    const cgst =
      quotation.cgstAmount != null
        ? Number(quotation.cgstAmount)
        : Math.round((gstAmount / 2) * 100) / 100;
    const sgst =
      quotation.sgstAmount != null
        ? Number(quotation.sgstAmount)
        : quotation.igstAmount != null
          ? Number(quotation.igstAmount)
          : Math.round((gstAmount - cgst) * 100) / 100;
    return [
      { label: 'CGST', value: cgst },
      { label: 'SGST', value: sgst },
    ];
  }

  return [{ label: 'GST', value: gstAmount }];
}

export function QuotationTotalsBreakdown({ quotation, address, compact = false }) {
  if (!quotation) return null;
  const itemsGross =
    Number(quotation.itemsSubtotal || 0) + Number(quotation.discountTotal || 0);
  const rowClass = compact
    ? 'flex justify-between text-[12px] text-gray-600'
    : 'flex justify-between text-gray-600';
  const gstRows = quotationGstRows(quotation, address);

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
      {gstRows.map((row) => (
        <div key={row.label} className={rowClass}>
          <span>{row.label}</span>
          <span className="font-medium text-gray-900">{money(row.value)}</span>
        </div>
      ))}
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
