import { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

/**
 * Parse CSV or Excel (.xlsx / .xls) into array of row objects (header keys lowercased).
 */
export async function parseSpreadsheetFile(file) {
  const name = file.name.toLowerCase();
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
  const isCsv = name.endsWith('.csv') || name.endsWith('.txt');

  if (!isExcel && !isCsv) {
    throw new Error('Please upload a .csv or .xlsx file.');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return rows.map((row) => {
    const out = {};
    Object.entries(row).forEach(([k, v]) => {
      out[String(k).trim().toLowerCase().replace(/\s+/g, '')] = typeof v === 'string' ? v.trim() : v;
    });
    return out;
  });
}

function escapeCsvValue(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsvFromRows(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(',')),
  ];
  return lines.join('\n');
}

/**
 * Bulk upload panel — Excel / CSV file picker + short format instructions.
 */
export default function BulkUploadPanel({
  instructions,
  exampleHeaders,
  onParsed,
  busy = false,
  sampleCsvRows,
  sampleFileName = 'sample.csv',
}) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseSpreadsheetFile(file);
      if (!rows.length) {
        toast.error('The file has no data rows.');
        return;
      }
      setFileName(file.name);
      onParsed?.(rows, file);
    } catch (err) {
      toast.error(err.message || 'Could not read that file.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const downloadSample = () => {
    if (!sampleCsvRows?.length) return;
    const csv = buildCsvFromRows(sampleCsvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sampleFileName || 'sample.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[13px] leading-relaxed text-gray-700">
        <p className="font-semibold text-gray-900">File format</p>
        <p className="mt-1">{instructions}</p>
        <p className="mt-2 font-mono text-[12px] text-gray-600">
          Headers: {exampleHeaders}
        </p>
        {sampleCsvRows?.length > 0 && (
          <button
            type="button"
            onClick={downloadSample}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
          >
            <Icon icon="bx:download" width={16} height={16} />
            Download sample CSV
          </button>
        )}
      </div>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#fafafa] px-4 py-8 transition hover:border-amber-300 hover:bg-amber-50/30"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Icon icon="bx:file" className="mb-2 h-10 w-10 text-amber-500" />
        <p className="text-sm font-semibold text-gray-800">
          {fileName || 'Choose Excel (.xlsx) or CSV (.csv)'}
        </p>
        <p className="mt-1 text-xs text-gray-400">First sheet / first row = column headers</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={onFile}
          disabled={busy}
        />
      </div>
    </div>
  );
}
