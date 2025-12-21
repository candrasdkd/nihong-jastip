// App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { OrdersPage } from './pages/OrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { LedgerPage } from './pages/LedgerPage';
import { Customer, Order } from './types';
import { TabButton } from './components/ui/TabButton';
import { UnitPriceModal } from './components/UnitPriceModal';
import { BottomTabBar } from './components/BottomTabBar';

// ⬇️ Logo
import logoLight from './assets/nihong.png';

// ⬇️ Firestore listeners
import { listenCustomers } from './services/customersFirebase';
import { subscribeOrders, toExtended } from './services/ordersFirebase';

// ⬇️ helper tanggal
function toInputDate(d: Date) {
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 10);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'orders' | 'customers' | 'calculator' | 'cash'>('dashboard');

  // ⬇️ BUKAN localStorage lagi — murni state
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [unitPrice, setUnitPrice] = useState<number>(100_000);
  const [showUnitPriceModal, setShowUnitPriceModal] = useState(false);

  // 🔊 Realtime customers (global, dipakai di Orders + Customers + Dashboard)
  useEffect(() => {
    const unsub = listenCustomers((rows) => setCustomers(rows as Customer[]));
    return () => unsub();
  }, []);

  // 🔊 Realtime orders khusus saat di Dashboard (biar grafik ada data tanpa harus buka tab Orders)
  useEffect(() => {
    if (tab !== 'dashboard') return;

    const now = new Date();
    const from = (() => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 11, 1); // 12 bulan terakhir (termasuk bulan ini)
      return startOfMonth(d);
    })();
    const to = endOfMonth(now);

    const unsub = subscribeOrders(
      {
        fromInput: toInputDate(from),
        toInput: toInputDate(to),
        sort: 'desc',
        limit: 1000, // sesuaikan kebutuhan dashboard
      },
      (rows) => setOrders(rows.map(toExtended) as Order[])
    );

    return () => unsub();
  }, [tab]);


  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-neutral-950/70 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            className="flex items-center gap-3 flex-shrink-0 group"
            onClick={() => setTab('dashboard')}
            title="Kembali ke Dashboard"
          >
            <span className="h-9 w-9 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 grid place-items-center">
              <img
                src={logoLight}
                alt="Logo Nihong"
                className="h-7 w-7 object-contain dark:hidden"
                loading="eager"
                decoding="async"
              />
            </span>

            <span className="text-left">
              <h1 className="text-xl font-semibold group-active:opacity-90">Nihong Jastip</h1>
              <p className="text-xs text-neutral-500">Panel Admin</p>
            </span>
          </button>

          {/* Nav header disembunyikan di mobile */}
          <div className="flex-1 overflow-x-auto hidden sm:block">
            <nav className="flex gap-2 min-w-max">
              <TabButton current={tab} setTab={setTab} id="dashboard">Dashboard</TabButton>
              <TabButton current={tab} setTab={setTab} id="orders">Pesanan</TabButton>
              <TabButton current={tab} setTab={setTab} id="customers">Konsumen</TabButton>
              <TabButton current={tab} setTab={setTab} id="cash">Kas</TabButton>
            </nav>
          </div>
        </div>
      </header>

      {/* Tambah padding bawah agar tidak ketutup bottom tab di mobile */}
      <main className="max-w-7xl mx-auto pb-20 sm:pb-0">
        {tab === 'dashboard' && <Dashboard orders={orders} customers={customers} />}
        {/* Saat tab Orders dibuka, komponen OrdersPage yang akan subscribe + push setOrders sesuai filter */}
        {tab === 'orders' && <OrdersPage customers={customers} orders={orders} setOrders={setOrders} unitPrice={unitPrice} />}
        {tab === 'customers' && <CustomersPage />}
        {tab === 'cash' && <LedgerPage />}
      </main>

      {showUnitPriceModal && (
        <UnitPriceModal
          unitPrice={unitPrice}
          onClose={() => setShowUnitPriceModal(false)}
          onSave={(newPrice, recalc) => {
            setUnitPrice(newPrice);
            if (recalc) {
              // hanya ubah tampilan total harga di state lokal (tidak mengubah Firestore)
              setOrders((prev) =>
                prev.map((o) => ({ ...o, totalHarga: Math.ceil(Math.max(0, (o as any).jumlahKg)) * newPrice }))
              );
            }
            setShowUnitPriceModal(false);
          }}
        />
      )}

      {/* Bottom tab khusus mobile */}
      <BottomTabBar current={tab} setTab={setTab} />
    </div>
  );
}
