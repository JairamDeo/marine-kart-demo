import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ShoppingBag,
  Clock,
  Truck,
  Users,
  Package,
} from 'lucide-react';
import StatCard from '../../components/portal/StatCard';
import { adminService } from '../../services/admin.service';

const DONUT = ['#ef4444', '#84cc16', '#eab308', '#3b82f6', '#94a3b8'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminService.dashboard();
        if (!cancelled) setData(res.data.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
        Could not load dashboard. Please refresh or check that the backend is running.
      </div>
    );
  }

  const { overview, charts } = data;

  const topStats = [
    { label: 'Total Orders', value: overview.totalOrders, icon: ShoppingBag, tone: 'blue' },
    { label: 'Enquiry Received', value: overview.pendingOrders, icon: Clock, tone: 'orange' },
    { label: 'Order Received', value: overview.completedOrders, icon: Truck, tone: 'green' },
    { label: 'Customers', value: overview.registeredCustomers, icon: Users, tone: 'slate' },
  ];

  const secondary = [
    { label: 'Products', value: overview.products, icon: Package, tone: 'blue' },
  ];

  const statusData = (charts?.orderStatusChart || []).filter((d) => d.value > 0);
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">Store overview</p>
        </div>
        <p className="rounded-xl bg-white px-3 py-2 text-xs text-gray-500 shadow-sm ring-1 ring-gray-100">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 50} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {secondary.map((s, i) => (
          <StatCard key={s.label} {...s} delay={200 + i * 40} />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <h2 className="text-base font-bold text-gray-900">Orders by Status</h2>
        <p className="mt-0.5 text-sm text-gray-400">How your enquiries and orders are progressing</p>

        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <div className="h-52 w-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.length ? statusData : [{ name: 'None', value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={4}
                  stroke="#fff"
                  strokeWidth={3}
                >
                  {(statusData.length ? statusData : [{ name: 'None', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={statusData.length ? DONUT[i % DONUT.length] : '#e5e7eb'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="w-full space-y-2.5">
            {(statusData.length ? statusData : []).map((item, i) => (
              <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: DONUT[i % DONUT.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-gray-800">
                  {item.value}{' '}
                  <span className="font-normal text-gray-400">
                    ({Math.round((item.value / statusTotal) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
            {!statusData.length && (
              <li className="text-sm text-gray-400">No orders yet — place a test enquiry to see data.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
