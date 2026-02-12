import React, { useMemo, useState } from 'react';
import { Customer, MonthPoint, Order, PeriodType } from '../types';
import { Card } from '../components/ui/Card';
import { formatIDR } from '../utils/format';
import { getMonthKey, getOrderProfit, getOrderRevenue, MONTH_LABEL_ID } from '../utils/helpers';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { BG, DONE_SET, GRID, INK, JAPAN_RED } from '../utils/constants';

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full ${positive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-700'
        }`}
    >
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}
export function Dashboard({
  orders,
  customers,
}: {
  orders: Order[];
  customers: Customer[];
}) {
  const [period, setPeriod] = useState<PeriodType>('12m');

  /* ========= FILTER ========= */
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const from = new Date();

    if (period === '30d') from.setDate(now.getDate() - 30);
    if (period === '3m') from.setMonth(now.getMonth() - 3);
    if (period === '12m') from.setMonth(now.getMonth() - 12);

    return orders.filter((o: any) => {
      const d = new Date(o?.tanggal);
      return d >= from && d <= now;
    });
  }, [orders, period]);

  /* ========= MONTHLY DATA ========= */
  const monthlyData = useMemo(() => {
    const map = new Map<string, MonthPoint>();

    for (const o of filteredOrders) {
      const key = getMonthKey((o as any).tanggal);
      if (!key) continue;

      if (!map.has(key)) {
        const [y, m] = key.split('-');
        map.set(key, {
          key,
          label: `${MONTH_LABEL_ID[Number(m) - 1]} ${y.slice(2)}`,
          total: 0,
          count: 0,
          profit: 0,
        });
      }

      const pt = map.get(key)!;
      pt.total += getOrderRevenue(o);
      pt.profit += getOrderProfit(o);
      pt.count += 1;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
  }, [filteredOrders]);

  /* ========= KPI ========= */
  const activeOrders = filteredOrders.filter(
    (o: any) => !DONE_SET.has(String(o?.status || ''))
  ).length;

  const totalRevenue = monthlyData.reduce((s, m) => s + m.total, 0);
  const totalProfit = monthlyData.reduce((s, m) => s + m.profit, 0);
  const totalOrders = monthlyData.reduce((s, m) => s + m.count, 0);

  const avgRevenue = totalOrders ? totalRevenue / totalOrders : 0;
  const margin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

  const bestMonth =
    monthlyData.length > 0
      ? monthlyData.reduce((max, m) =>
        m.total > max.total ? m : max
      )
      : null;

  /* ========= GROWTH ========= */
  const half = Math.floor(monthlyData.length / 2);
  const prevRevenue = monthlyData
    .slice(0, half)
    .reduce((s, m) => s + m.total, 0);

  const growth = prevRevenue
    ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
    : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      <div className="relative w-full max-w-[1600px] mx-auto space-y-10 px-4">

        {/* Header + Filter */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">
              Dasbor Utama
            </h1>
            <p className="text-sm text-gray-500">
              Insight bisnis & performa operasional
            </p>
          </div>

          <div className="flex gap-2">
            {[
              { label: '30 Hari', value: '30d' },
              { label: '3 Bulan', value: '3m' },
              { label: '12 Bulan', value: '12m' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as PeriodType)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${period === p.value
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-neutral-300 text-neutral-600'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

          <Card className="p-6 bg-white rounded-3xl shadow-sm">
            <div className="text-sm text-gray-500">Pesanan Aktif</div>
            <div className="text-2xl font-semibold mt-2">
              {activeOrders}
            </div>
          </Card>

          <Card className="p-6 bg-white rounded-3xl shadow-sm">
            <div className="text-sm text-gray-500">Total Pelanggan</div>
            <div className="text-2xl font-semibold mt-2">
              {customers.length}
            </div>
          </Card>

          <Card className="p-6 bg-white rounded-3xl shadow-sm">
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">
                Total Pendapatan
              </div>
              <GrowthBadge value={growth} />
            </div>
            <div className="text-2xl font-semibold mt-2">
              {formatIDR(totalRevenue)}
            </div>
          </Card>

          <Card className="p-6 bg-white rounded-3xl shadow-sm">
            <div className="text-sm text-gray-500">Margin</div>
            <div className="text-2xl font-semibold mt-2">
              {margin.toFixed(1)}%
            </div>
          </Card>

          <Card className="p-6 bg-white rounded-3xl shadow-sm">
            <div className="text-sm text-gray-500">Avg / Order</div>
            <div className="text-2xl font-semibold mt-2">
              {formatIDR(avgRevenue)}
            </div>
          </Card>

          <Card className="p-6 bg-white rounded-3xl shadow-sm border-l-4 border-red-600">
            <div className="text-sm text-gray-500">
              Bulan Terbaik
            </div>
            <div className="text-lg font-semibold mt-2">
              {bestMonth ? bestMonth.label : '-'}
            </div>
            <div className="text-sm text-gray-500">
              {bestMonth ? formatIDR(bestMonth.total) : ''}
            </div>
          </Card>

        </div>

        {/* CHART */}
        <Card className="p-8 bg-white rounded-3xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Grafik Tren Bulanan
          </h2>

          <div className="h-[360px] sm:h-[420px] xl:h-[520px]">

            {/* 📱 MOBILE → LINE */}
            <div className="block md:hidden h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: INK, fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v: number) => formatIDR(v)}
                    tick={{ fill: INK }}
                  />
                  <Tooltip
                    formatter={(value: any) => formatIDR(value as number)}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={JAPAN_RED}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 💻 DESKTOP → BAR DUAL AXIS */}
            <div className="hidden md:block h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 20, right: 40, left: 20, bottom: 10 }}
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: INK }} />
                  <YAxis yAxisId="left" tick={{ fill: INK }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v: number) => formatIDR(v)}
                    tick={{ fill: INK }}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) =>
                      name.includes('Pendapatan')
                        ? formatIDR(value as number)
                        : value
                    }
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    name="Jumlah Pesanan"
                    fill={JAPAN_RED}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="total"
                    name="Pendapatan (Rp)"
                    fill={INK}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </Card>

      </div>
    </div>
  );
}
