import React, { useMemo } from 'react';
import { Customer, Order } from '../types';
import { Card } from '../components/ui/Card';
import { formatIDR } from '../utils/format';
import { MONTH_LABEL_ID } from '../utils/helpers';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend,
} from 'recharts';

// --- Palet Warna Baru ---
const ORANGE = '#f97316';    // tailwind orange-500
const SLATE_800 = '#1e293b'; // tailwind slate-800
const GRID = 'rgba(100, 116, 139, 0.1)'; // slate-500 with opacity

// --- Tipe & Helper Internal ---
type MonthPoint = { key: string; label: string; total: number; count: number; profit: number; };
const DONE_SET = new Set(['Selesai', 'Sudah Diterima', 'Dibatalkan']);

// --- Ikon SVG Baru ---
const IconClipboardList = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>);
const IconUsers = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
const IconTrendingUp = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>);
const IconWallet = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15" /></svg>);


/** Ambil revenue per order */
function getOrderRevenue(o: any): number {
  const v = Number(o?.totalPembayaran ?? o?.totalHarga ?? 0);
  return Number.isFinite(v) ? v : 0;
}
/** Ambil profit per order */
function getOrderProfit(o: any): number {
  const v = Number(o?.totalKeuntungan ?? o?.profit ?? 0);
  return Number.isFinite(v) ? v : 0;
}
/** Ambil key bulan "YYYY-MM" dari string tanggal */
function getMonthKeyFromTanggal(tanggal?: string): string | null {
  if (!tanggal || typeof tanggal !== 'string') return null;
  const norm = tanggal.replace(/\//g, '-');
  const m = norm.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}
/** Konversi key "YYYY-MM" → {y, mIdx} */
function keyToYM(key: string) {
  const [yy, mm] = key.split('-').map(n => parseInt(n, 10));
  return { y: yy, mIdx: mm - 1 };
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
  // 1) Kalkulasi data untuk grafik & KPI
  const { monthlyData, periodLabel } = useMemo(() => {
    const monthMap = new Map<string, MonthPoint>();
    if (orders.length === 0) return { monthlyData: [], periodLabel: 'Tidak ada data' };

    const keys: string[] = [];
    for (const o of orders) {
      const k = getMonthKeyFromTanggal((o as any).tanggal);
      if (!k) continue;
      if (!monthMap.has(k)) {
        const { y, mIdx } = keyToYM(k);
        monthMap.set(k, { key: k, label: monthLabel(y, mIdx), total: 0, count: 0, profit: 0 });
        keys.push(k);
      }
      const pt = monthMap.get(k)!;
      pt.total += getOrderRevenue(o);
      pt.profit += getOrderProfit(o);
      pt.count += 1;
    }
    if (keys.length === 0) return { monthlyData: [], periodLabel: 'Tidak ada data' };

    keys.sort();
    const firstKey = keys[0];
    const lastKey = keys[keys.length - 1];

    // Isi bulan yang kosong agar grafik kontinyu
    const series: MonthPoint[] = [];
    let { y, mIdx } = keyToYM(firstKey);
    const end = keyToYM(lastKey);

    while (true) {
      const k = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
      const label = monthLabel(y, mIdx);
      series.push(monthMap.get(k) ?? { key: k, label, total: 0, count: 0, profit: 0 });
      if (y === end.y && mIdx === end.mIdx) break;
      ({ y, mIdx } = incMonth(y, mIdx));
    }

    const period = `${series[0].label} – ${series[series.length - 1].label}`;
    return { monthlyData: series, periodLabel: period };
  }, [orders]);

  // 2) Hitung KPI utama
  const activeOrders = useMemo(() => orders.filter((o: any) => !DONE_SET.has(String(o?.status || ''))).length, [orders]);
  const totalRevenue = useMemo(() => monthlyData.reduce((s, m) => s + m.total, 0), [monthlyData]);
  const totalProfit = useMemo(() => monthlyData.reduce((s, m) => s + m.profit, 0), [monthlyData]);

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold text-slate-800">Dasbor Utama</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan performa bisnis Anda secara keseluruhan.</p>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 flex items-center gap-5 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center shrink-0"><IconClipboardList className="w-6 h-6 text-sky-600" /></div>
            <div>
              <div className="text-sm text-slate-500">Pesanan Aktif</div>
              <p className="text-2xl font-bold text-slate-800 mt-1">{activeOrders}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-5 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center shrink-0"><IconUsers className="w-6 h-6 text-violet-600" /></div>
            <div>
              <div className="text-sm text-slate-500">Total Pelanggan</div>
              <p className="text-2xl font-bold text-slate-800 mt-1">{customers.length}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-5 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><IconTrendingUp className="w-6 h-6 text-orange-600" /></div>
            <div>
              <div className="text-sm text-slate-500">Total Pendapatan</div>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatIDR(totalRevenue)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-5 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><IconWallet className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <div className="text-sm text-slate-500">Total Keuntungan</div>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatIDR(totalProfit)}</p>
            </div>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-4 sm:p-6 bg-white shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Grafik Tren Bulanan</h2>
            <p className="text-sm text-slate-500">{periodLabel}</p>
          </header>

          <div className="h-80 -ml-4">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Tidak ada data transaksi untuk ditampilkan dalam grafik.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: SLATE_800, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis yAxisId="left" tick={{ fill: SLATE_800, fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: SLATE_800, fontSize: 12 }} tickFormatter={(v: number) => formatIDR(v)} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any, name: string) => (name.includes('Pendapatan') || name.includes('Keuntungan') ? formatIDR(value as number) : value)}
                    contentStyle={{ background: 'white', border: `1px solid ${GRID}`, borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: SLATE_800, fontWeight: 600, marginBottom: '0.5rem' }}
                    itemStyle={{ color: SLATE_800, paddingTop: '0.25rem', paddingBottom: '0.25rem' }}
                  />
                  <Legend wrapperStyle={{ color: SLATE_800, paddingTop: '1rem' }} />
                  <Bar yAxisId="left" dataKey="count" name="Jumlah Pesanan" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar yAxisId="right" dataKey="total" name="Pendapatan (Rp)" fill={SLATE_800} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}