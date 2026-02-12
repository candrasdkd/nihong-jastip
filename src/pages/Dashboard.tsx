import React, { useMemo, useState, useEffect } from 'react';
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
  Legend,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { DONE_SET, INK, JAPAN_RED } from '../utils/constants';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Wallet,
  Activity,
  ArrowRight,
  LayoutDashboard,
  AppWindow,
  Settings,  
} from 'lucide-react';

// --- KOMPONEN BANTUAN (UI KECIL) ---

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${positive
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-rose-50 text-rose-700 border-rose-100'
      }`}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, trend }: any) {
  return (
    <Card className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500">
          <Icon size={20} />
        </div>
        {trend !== undefined && <GrowthBadge value={trend} />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl text-sm z-50">
        <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 capitalize">{entry.name}:</span>
            <span className="font-medium ml-auto">
              {entry.name.includes('Pendapatan') || entry.name.includes('Profit')
                ? formatIDR(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- BAGIAN 1: TAMPILAN DASHBOARD ---

function DashboardView({
  orders,
  customers,
  switchToApp, // Prop untuk pindah tab dan buka fitur tertentu
  onSeeAllOrders, // Prop untuk tombol "Lihat Semua"
}: {
  orders: Order[];
  customers: Customer[];
  switchToApp: (feature?: string) => void;
  onSeeAllOrders: () => void;
}) {
  const [period, setPeriod] = useState<PeriodType>('12m');

  const { monthlyData, kpi, recentOrders } = useMemo(() => {
    // ... (Logika data sama seperti sebelumnya) ...
    const now = new Date();
    const from = new Date();
    if (period === '30d') from.setDate(now.getDate() - 30);
    if (period === '3m') from.setMonth(now.getMonth() - 3);
    if (period === '12m') from.setMonth(now.getMonth() - 12);

    const _filtered = orders
      .filter((o: any) => { const d = new Date(o?.tanggal); return d >= from && d <= now; })
      .sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    const map = new Map<string, MonthPoint>();
    for (const o of _filtered) {
      const key = getMonthKey((o as any).tanggal);
      if (!key) continue;
      if (!map.has(key)) {
        const [y, m] = key.split('-');
        map.set(key, { key, label: `${MONTH_LABEL_ID[Number(m) - 1]} ${y.slice(2)}`, total: 0, count: 0, profit: 0 });
      }
      const pt = map.get(key)!;
      pt.total += getOrderRevenue(o);
      pt.profit += getOrderProfit(o);
      pt.count += 1;
    }

    const _monthly = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    const activeCount = _filtered.filter((o: any) => !DONE_SET.has(String(o?.status || ''))).length;
    const revenue = _monthly.reduce((s, m) => s + m.total, 0);
    const profit = _monthly.reduce((s, m) => s + m.profit, 0);
    const count = _monthly.reduce((s, m) => s + m.count, 0);
    const lastMonthRev = _monthly.length ? _monthly[_monthly.length - 1].total : 0;
    const avgRev = count ? revenue / _monthly.length : 0;
    const trendRev = avgRev ? ((lastMonthRev - avgRev) / avgRev) * 100 : 0;

    return { monthlyData: _monthly, recentOrders: _filtered.slice(0, 5), kpi: { activeOrders: activeCount, revenue, profit, totalOrders: count, margin: revenue ? (profit / revenue) * 100 : 0, growth: trendRev } };
  }, [orders, period]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Overview Bisnis</h2>
          <p className="text-slate-500 mt-1">Ringkasan performa {period === '30d' ? '30 Hari Terakhir' : period === '3m' ? 'Triwulan Ini' : 'Tahun Ini'}.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
          {[
            { label: '30 Hari', value: '30d' },
            { label: '3 Bulan', value: '3m' },
            { label: '1 Tahun', value: '12m' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as PeriodType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Pendapatan" value={formatIDR(kpi.revenue)} subValue="Kotor sebelum biaya" icon={Wallet} trend={kpi.growth} />
        <StatCard label="Total Profit" value={formatIDR(kpi.profit)} subValue={`Margin: ${kpi.margin.toFixed(1)}%`} icon={TrendingUp} />
        <StatCard label="Pesanan Aktif" value={kpi.activeOrders} subValue="Perlu diproses" icon={Activity} />
        <StatCard label="Total Pelanggan" value={customers.length} subValue={`Dari ${kpi.totalOrders} total pesanan`} icon={Users} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Analisis Pendapatan</h2>
              <p className="text-sm text-slate-500">Omzet vs Volume Pesanan</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={INK} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={INK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(v) => formatIDR(v)} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Area yAxisId="left" type="monotone" dataKey="total" name="Pendapatan" stroke={INK} strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                <Line yAxisId="right" type="monotone" dataKey="count" name="Jumlah Pesanan" stroke={JAPAN_RED} strokeWidth={3} dot={{ r: 4, fill: 'white', strokeWidth: 2, stroke: JAPAN_RED }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="h-[500px]">
          <Card className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Pesanan Terbaru</h2>

              {/* TOMBOL LIHAT SEMUA -> PINDAH KE MENU RIWAYAT */}
              <button
                onClick={onSeeAllOrders}
                className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
              >
                Lihat Semua <ArrowRight size={14} />
              </button>

            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              {recentOrders.map((order: any, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700 text-sm">{order.namaPelanggan || 'Pelanggan Umum'}</div>
                      <div className="text-xs text-slate-400">{new Date(order.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 text-sm">{formatIDR(getOrderRevenue(order))}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${DONE_SET.has(order.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- BAGIAN 2: TAMPILAN APLIKASI (MENU CARD GRID) ---

function ApplicationView({ setActiveFeature }: { setActiveFeature: (value: string) => void; }) {

  // --- MAIN MENU GRID ---
  const FEATURES = [
    { id: 'generator', title: 'Generator Story', desc: 'Buat story IG otomatis.', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Menu Aplikasi</h2>
        <p className="text-slate-500">Pilih fitur yang ingin Anda gunakan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveFeature(feature.id)}
            className="flex flex-col text-left p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-200`}>
              <feature.icon size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-500">
              {feature.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );



}

// --- BAGIAN UTAMA (WRAPPER) ---

type TabType = 'dashboard' | 'application';

export function Dashboard({ orders, customers, onSeeAllOrders, setActiveFeature }: { orders: Order[]; customers: Customer[], onSeeAllOrders: () => void; setActiveFeature: (value: string) => void; }) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // State tambahan untuk mengontrol fitur mana yang dibuka saat tab Aplikasi aktif
  const [appFeature, setAppFeature] = useState<string | null>(null);

  const handleSwitchToApp = (feature: string = 'orders') => {
    setAppFeature(feature); // Set fitur spesifik (misal: 'orders')
    setActiveTab('application'); // Pindah tab
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'application') {
      setAppFeature(null); // Reset ke menu utama jika user klik tab manual
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* NAVIGASI TAB */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-md transform scale-105'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={() => handleTabChange('application')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeTab === 'application'
                ? 'bg-slate-900 text-white shadow-md transform scale-105'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <AppWindow size={18} />
              Aplikasi
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {activeTab === 'dashboard' ? (
          <DashboardView
            orders={orders}
            customers={customers}
            switchToApp={handleSwitchToApp}
            onSeeAllOrders={onSeeAllOrders}
          />
        ) : (
          <ApplicationView
            setActiveFeature={setActiveFeature}
          />
        )}

      </div>
    </div>
  );
}