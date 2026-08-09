import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function splitTableCells(line) {
  return String(line || '')
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.replace(/\*\*/g, '').trim());
}

function isTableSeparator(line) {
  return /^\|?[\s:-]+\|[\s|:-]*\|?$/.test(line) || /^[\s|:-]+$/.test(line);
}

/**
 * Convert GFM tables into key/value rows (modern vertical layout).
 * - Wide header + one data row → each column becomes a SpecRow
 * - 2-column tables → left = key, right = value
 * - Multi-row tables → each cell as "Header: value"
 */
function extractTables(lines) {
  const rows = [];
  const consumed = new Set();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.includes('|')) {
      i += 1;
      continue;
    }

    const block = [line];
    let j = i + 1;
    while (j < lines.length && lines[j].includes('|')) {
      block.push(lines[j]);
      j += 1;
    }

    if (block.length >= 2 && isTableSeparator(block[1])) {
      const headers = splitTableCells(block[0]);
      const dataLines = block.slice(2).filter((l) => !isTableSeparator(l));

      if (headers.length >= 2 && dataLines.length === 1) {
        const values = splitTableCells(dataLines[0]);
        headers.forEach((key, idx) => {
          if (key && values[idx]) rows.push({ key, value: values[idx] });
        });
      } else if (headers.length === 2) {
        dataLines.forEach((dl) => {
          const cells = splitTableCells(dl);
          if (cells[0] && cells[1]) rows.push({ key: cells[0], value: cells[1] });
        });
      } else {
        dataLines.forEach((dl) => {
          const cells = splitTableCells(dl);
          headers.forEach((key, idx) => {
            if (key && cells[idx]) rows.push({ key, value: cells[idx] });
          });
        });
      }

      for (let k = i; k < j; k += 1) consumed.add(k);
      i = j;
      continue;
    }

    i += 1;
  }

  return { rows, consumed };
}

/**
 * Parse markdown specs like:
 *   **Product Id:** MKMS-20
 *   - Cable length: 20 ft
 *   | Part Number | Category |
 * into structured rows + feature bullets for a modern layout.
 */
function parseSpecMarkdown(content) {
  const rows = [];
  const features = [];
  const leftover = [];

  const lines = String(content || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const { rows: tableRows, consumed } = extractTables(lines);
  rows.push(...tableRows);

  for (let i = 0; i < lines.length; i += 1) {
    if (consumed.has(i)) continue;
    const line = lines[i];

    const kv =
      line.match(/^\*\*(.+?):\*\*\s*(.+)$/) ||
      line.match(/^\*\*(.+?)\*\*:\s*(.+)$/) ||
      line.match(/^([^:|*]+):\s*(.+)$/);

    const bullet = line.match(/^[-*]\s+(.+)$/);

    if (kv && !bullet) {
      const key = kv[1].replace(/\*\*/g, '').trim();
      const value = kv[2].replace(/\*\*/g, '').trim();
      if (key && value) {
        rows.push({ key, value });
        continue;
      }
    }

    if (bullet) {
      features.push(bullet[1].replace(/\*\*/g, '').trim());
      continue;
    }

    leftover.push(line);
  }

  return { rows, features, leftover: leftover.join('\n\n') };
}

function SpecRow({ label, value, index }) {
  return (
    <div
      className={`grid grid-cols-1 gap-1 px-4 py-3.5 sm:grid-cols-[minmax(140px,34%)_1fr] sm:items-center sm:gap-4 ${
        index % 2 === 0 ? 'bg-sky-50/70' : 'bg-white'
      }`}
    >
      <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1a4b8c]/80">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-800 sm:text-[15px]">{value}</dd>
    </div>
  );
}

function SpecSheet({ rows, features, leftover, className = '' }) {
  return (
    <div className={className}>
      <dl className="overflow-hidden rounded-2xl border border-sky-100/80 shadow-sm ring-1 ring-[#1a4b8c]/5">
        <div className="flex items-center gap-2 border-b border-sky-100 bg-gradient-to-r from-[#1a4b8c] to-[#1e5a9e] px-4 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#78c6d4]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
            Technical details
          </span>
        </div>
        {rows.map((row, i) => (
          <SpecRow key={`${row.key}-${i}`} label={row.key} value={row.value} index={i} />
        ))}
      </dl>

      {features.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {features.map((f, i) => (
            <li
              key={`${f}-${i}`}
              className="flex items-start gap-2.5 rounded-xl border border-cyan/20 bg-gradient-to-br from-cyan/10 to-white px-3.5 py-2.5 text-sm text-slate-700"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1a4b8c] text-[10px] font-bold text-white">
                ✓
              </span>
              <span className="leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {leftover ? (
        <div className="mk-markdown mk-markdown--rich mt-4 max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div className="overflow-hidden rounded-2xl border border-sky-100">{children}</div>
              ),
            }}
          >
            {leftover}
          </ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Attractive product specification renderer.
 * Tables + **Key:** Value markdown all render as modern vertical specs.
 */
export default function MarkdownContent({ content, className = '' }) {
  if (!content?.trim()) return null;

  const { rows, features, leftover } = parseSpecMarkdown(content);

  if (rows.length > 0 || features.length > 0) {
    return (
      <SpecSheet rows={rows} features={features} leftover={leftover} className={className} />
    );
  }

  // Free-form markdown — still avoid old wide HTML tables by converting on render
  return (
    <div className={`mk-markdown mk-markdown--rich max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => {
            // Flatten simple tables into SpecSheet when possible is hard here;
            // hide classic table chrome and use card rows via CSS override class
            return (
              <div className="mk-spec-table-modern overflow-hidden rounded-2xl border border-sky-100 shadow-sm">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
