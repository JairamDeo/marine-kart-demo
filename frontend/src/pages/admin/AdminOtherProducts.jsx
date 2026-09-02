import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import DataTable from '../../components/portal/DataTable';
import Modal from '../../components/portal/Modal';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { adminService } from '../../services/admin.service';
import { formatAddressBlock } from '../../utils/address';
import { friendlyError } from '../../utils/toastMsg';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'closed', label: 'Closed' },
];

function customerName(row) {
  const u = row.user;
  if (!u || typeof u !== 'object') return '—';
  return (
    `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.companyName || u.email || '—'
  );
}

function enquiryAddress(row) {
  if (row.deliveryAddress?.line1) return formatAddressBlock(row.deliveryAddress);
  return row.address || '—';
}

function statusPill(status) {
  const map = {
    new: 'bg-amber-50 text-amber-700 ring-amber-200',
    read: 'bg-sky-50 text-sky-700 ring-sky-200',
    closed: 'bg-gray-100 text-gray-600 ring-gray-200',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
        map[status] || map.new
      }`}
    >
      {status || 'new'}
    </span>
  );
}

export default function AdminOtherProducts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.otherProducts({
        status: statusFilter || undefined,
        limit: 100,
      });
      setRows(res.data.data.enquiries || []);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row) => {
    setDetail(row);
    if (row.status === 'new') {
      try {
        await adminService.updateOtherProduct(row._id, { status: 'read' });
        load();
      } catch {
        /* non-blocking */
      }
    }
  };

  const updateStatus = async (status) => {
    if (!detail) return;
    setBusy(true);
    try {
      const res = await adminService.updateOtherProduct(detail._id, { status });
      toast.success('Status updated');
      setDetail(res.data.data.enquiry);
      load();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '—',
    },
    {
      key: 'productName',
      header: 'Product',
      render: (row) => <span className="font-semibold text-navy">{row.productName}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => customerName(row),
    },
    {
      key: 'categoryName',
      header: 'Category',
      render: (row) => row.categoryName || '—',
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (row) => row.quantity || 1,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => statusPill(row.status),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <ActionGroup>
          <ActionIcon label="View" onClick={() => openDetail(row)}>
            <Eye size={16} />
          </ActionIcon>
        </ActionGroup>
      ),
    },
  ];

  const filters = (
    <FilterSelect
      ariaLabel="Status"
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value || 'all'} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </FilterSelect>
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Other Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customer enquiries for products not listed on the website.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        searchKeys={['productName', 'categoryName', 'subcategoryName', 'description']}
        searchPlaceholder="Search enquiries..."
        filters={filters}
        emptyState={
          <div className="text-gray-400">
            <p className="text-base font-medium text-gray-500">No enquiries yet</p>
            <p className="mt-1 text-sm">Customer product-not-listed submissions will appear here.</p>
          </div>
        }
      />

      <Modal
        open={Boolean(detail)}
        title="Product not listed enquiry"
        onClose={() => setDetail(null)}
        wide
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>{statusPill(detail.status)}</div>
              <div className="flex gap-2">
                {['new', 'read', 'closed'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy || detail.status === s}
                    onClick={() => updateStatus(s)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold capitalize text-navy disabled:opacity-40"
                  >
                    Mark {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Product</p>
                <p className="font-semibold text-navy">{detail.productName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Quantity</p>
                <p>{detail.quantity}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Category</p>
                <p>{detail.categoryName || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Sub category
                </p>
                <p>{detail.subcategoryName || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Customer</p>
                <p className="font-medium">{customerName(detail)}</p>
                <p className="text-gray-500">{detail.user?.email || '—'}</p>
                <p className="text-gray-500">
                  {detail.deliveryAddress?.phone || detail.user?.phone || '—'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Address</p>
                <p className="whitespace-pre-wrap text-gray-700">{enquiryAddress(detail)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Description
                </p>
                <p className="whitespace-pre-wrap text-gray-700">{detail.description}</p>
              </div>
            </div>

            {Array.isArray(detail.images) && detail.images.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Reference images
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {detail.images.map((src) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-gray-100"
                    >
                      <img
                        src={src}
                        alt=""
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
