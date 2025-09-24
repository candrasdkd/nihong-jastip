import React, { useMemo } from 'react';
import { Customer, Order } from '../types';
import { Card } from '../components/ui/Card';
import { formatIDR } from '../utils/format';
import { MONTH_LABEL_ID } from '../utils/helpers';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend,
} from 'recharts';

const ORANGE = '#f97316'; // tailwind orange-500
const NAVY = '#0a2342';
const NAVY_DARK = '#081a31';
const GRID = 'rgba(10,35,66,0.08)';

type MonthPoint = { key: string; label: string; total: number; count: number; profit: number; };

const DONE_SET = new Set(['Selesai', 'Sudah Diterima', 'Dibatalkan']);

/** Ambil revenue per order, mendukung beberapa skema field */
function getOrderRevenue(o: any): number {
  // Prioritas: totalPembayaran → totalHarga → 0
  const v = Number(o?.totalPembayaran ?? o?.totalHarga ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function getOrderProfit(o: any): number {
  const v = Number(o?.totalKeuntungan ?? o?.profit ?? 0);
  return Number.isFinite(v) ? v : 0;
}

/** Ambil key bulan "YYYY-MM" dari string tanggal */
function getMonthKeyFromTanggal(tanggal?: string): string | null {
  if (!tanggal || typeof tanggal !== 'string') return null;
  // Asumsi format "YYYY-MM-DD" atau "YYYY/MM/DD" → ambil 7 karakter pertama yang relevan
  const norm = tanggal.replace(/\//g, '-');
  const m = norm.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** Konversi key "YYYY-MM" → {y, mIdx} */
function keyToYM(key: string) {
  const [yy, mm] = key.split('-').map(n => parseInt(n, 10));
  return { y: yy, mIdx: mm - 1 }; // 0..11
}

/** Inkrement bulan */
function incMonth(y: number, mIdx: number) {
  let ny = y, nm = mIdx + 1;
  if (nm > 11) { ny = y + 1; nm = 0; }
  return { y: ny, mIdx: nm };
}

/** Label "MMM YY" Indonesia pendek */
function monthLabel(y: number, mIdx: number) {
  return `${MONTH_LABEL_ID[mIdx]} ${String(y).slice(2)}`;
}

export function Dashboard({ orders, customers }: { orders: Order[]; customers: Customer[]; }) {
  // 1) Hitung range bulan berdasar data yang ada
  const { monthlyData, periodLabel } = useMemo(() => {
    const keys: string[] = [];
    const monthMap = new Map<string, MonthPoint>();

    for (const o of orders) {
      const k = getMonthKeyFromTanggal((o as any).tanggal);
      if (!k) continue;
      const rev = getOrderRevenue(o);
      if (!monthMap.has(k)) {
        const { y, mIdx } = keyToYM(k);
        monthMap.set(k, { key: k, label: monthLabel(y, mIdx), total: 0, count: 0, profit: 0 });
        keys.push(k);
      }
      const pt = monthMap.get(k)!;
      pt.total += rev;
      pt.profit += getOrderProfit(o);
      pt.count += 1;
    }

    if (keys.length === 0) {
      return { monthlyData: [] as MonthPoint[], periodLabel: '—' };
    }

    // sort ascending
    keys.sort();
    const first = keys[0];
    const last = keys[keys.length - 1];

    // Fill gap bulan di antara min..max agar grafik kontinyu
    const series: MonthPoint[] = [];
    let { y, mIdx } = keyToYM(first);
    const end = keyToYM(last);
    // loop termasuk bulan terakhir
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const k = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
      const label = monthLabel(y, mIdx);
      const base = monthMap.get(k) ?? { key: k, label, total: 0, count: 0, profit: 0 };
      // pastikan label konsisten (kalau base dari map pun aman)
      base.label = label;
      series.push(base);
      if (y === end.y && mIdx === end.mIdx) break;
      ({ y, mIdx } = incMonth(y, mIdx));
    }

    const periodLabel = `${series[0].label} – ${series[series.length - 1].label}`;
    return { monthlyData: series, periodLabel };
  }, [orders]);

  // 2) KPI
  const active = useMemo(
    () => orders.filter((o: any) => !DONE_SET.has(String(o?.status || ''))).length,
    [orders]
  );
  const totalRevenue = useMemo(
    () => monthlyData.reduce((s, m) => s + m.total, 0),
    [monthlyData]
  );

  const totalProfit = useMemo(
    () => monthlyData.reduce((s, m) => s + m.profit, 0),
    [monthlyData]
  );
  const totalCount = useMemo(
    () => monthlyData.reduce((s, m) => s + m.count, 0),
    [monthlyData]
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
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
          <p className="text-sm text-neutral-500">Jumlah Transaksi</p>
          <p className="text-3xl font-bold mt-1 text-[color:var(--navy,#0a2342)]">
            {formatIDR(totalRevenue)}
          </p>
        </Card>
        <Card className="p-5 bg-white border border-[#0a2342]/10">
          <p className="text-sm text-neutral-500">Total Keuntungan</p>
          <p className="text-3xl font-bold mt-1 text-[color:var(--navy,#0a2342)]">
            {formatIDR(totalProfit)}
          </p>
        </Card>
        <Card className="p-5 bg-white border border-[#0a2342]/10">
          <p className="text-sm text-neutral-500">Pesanan (periode)</p>
          <p className="text-3xl font-bold mt-1 text-[color:var(--navy,#0a2342)]">
            {totalCount}
          </p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-5 bg-white border border-[#0a2342]/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[color:var(--navy,#0a2342)]">
            Grafik Tren Bulanan ({periodLabel})
          </h2>
        </div>

        {monthlyData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-neutral-500 text-sm">
            Tidak ada data untuk ditampilkan.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                barCategoryGap={16}
              >
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="label" tick={{ fill: NAVY }} />
                {/* Dual axis: kiri untuk count, kanan untuk pendapatan (IDR) */}
                <YAxis yAxisId="left" tick={{ fill: NAVY }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: NAVY }}
                  tickFormatter={(v: number) => formatIDR(v).replace(/^Rp\s?/, '')}
                  width={80}
                />
                <Tooltip
                  formatter={(v: any, name) => (name === 'Pendapatan' ? formatIDR(v as number) : v)}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid rgba(10,35,66,0.15)',
                    borderRadius: 12,
                  }}
                  itemStyle={{ color: NAVY }}
                  labelStyle={{ color: NAVY_DARK, fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ color: NAVY, paddingTop: 8 }} />
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
                  name="Pendapatan"
                  fill={NAVY}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
