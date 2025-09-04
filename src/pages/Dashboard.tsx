import React, { useMemo } from 'react';
import { Customer, Order } from '../types';
import { Card } from '../components/ui/Card';
import { formatIDR } from '../utils/format';
import { MONTH_LABEL_ID, monthKey } from '../utils/helpers';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend,
} from 'recharts';

const ORANGE = '#f97316'; // tailwind orange-500
const NAVY = '#0a2342';
const NAVY_DARK = '#081a31';
const GRID = 'rgba(10,35,66,0.08)';

export function Dashboard({ orders, customers }: { orders: Order[]; customers: Customer[]; }) {
  const monthlyData = useMemo(() => {
    const points: { key: string; label: string; total: number; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      const label = `${MONTH_LABEL_ID[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      points.push({ key, label, total: 0, count: 0 });
    }
    orders.forEach((o) => {
      const k = o.tanggal.slice(0, 7);
      const idx = points.findIndex((p) => p.key === k);
      if (idx >= 0) {
        points[idx].total += o.totalHarga;
        points[idx].count += 1;
      }
    });
    return points;
  }, [orders]);

  const active = orders.filter((o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length;

  return (
    <div className="space-y-6">
      {/* Stat cards: putih + aksen navy tipis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-[#0a2342]/10">
          <p className="text-sm text-neutral-500">Total Pesanan Aktif</p>
          <p className="text-3xl font-bold mt-1 text-[color:var(--navy,#0a2342)]">{active}</p>
        </Card>
        <Card className="p-5 bg-white border border-[#0a2342]/10">
          <p className="text-sm text-neutral-500">Total Pelanggan</p>
          <p className="text-3xl font-bold mt-1 text-[color:var(--navy,#0a2342)]">{customers.length}</p>
        </Card>
        <Card className="p-5 bg-white border border-[#0a2342]/10">
          <p className="text-sm text-neutral-500">Pendapatan (12 bln)</p>
          <p className="text-3xl font-bold mt-1 text-[color:var(--navy,#0a2342)]">
            {formatIDR(monthlyData.reduce((s, m) => s + m.total, 0))}
          </p>
        </Card>
        <Card className="p-5 bg-white border border-[#0a2342]/10">
          <p className="text-sm text-neutral-500">Pesanan (12 bln)</p>
          <p className="text-3xl font-bold mt-1 text-[color:var(--navy,#0a2342)]">
            {monthlyData.reduce((s, m) => s + m.count, 0)}
          </p>
        </Card>
      </div>

      {/* Chart: putih + bar orange/navy + axis navy, grid halus */}
      <Card className="p-5 bg-white border border-[#0a2342]/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[color:var(--navy,#0a2342)]">
            Grafik Tren Bulanan (12 bulan)
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              barCategoryGap={16}
            >
              <CartesianGrid stroke={GRID} />
              <XAxis dataKey="label" tick={{ fill: NAVY }} />
              {/* Dual axis: kiri untuk count, kanan untuk total (IDR) */}
              <YAxis yAxisId="left" tick={{ fill: NAVY }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: NAVY }}
                tickFormatter={(v: number) => formatIDR(v).replace(/^Rp\s?/, '')}
                width={80}
              />
              <Tooltip
                formatter={(v: any, name) => (name === 'Total Harga' ? formatIDR(v as number) : v)}
                contentStyle={{
                  background: '#fff',
                  border: '1px solid rgba(10,35,66,0.15)',
                  borderRadius: 12,
                }}
                itemStyle={{ color: NAVY }}
                labelStyle={{ color: NAVY_DARK, fontWeight: 600 }}
              />
              <Legend
                wrapperStyle={{ color: NAVY, paddingTop: 8 }}
              />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="Jumlah Pesanan"
                fill={ORANGE}
                radius={[6, 6, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                yAxisId="right"
                dataKey="total"
                name="Total Harga"
                fill={NAVY}
                radius={[6, 6, 0, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
