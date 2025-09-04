// App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { OrdersPage } from './pages/OrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { CalculatorCard } from './pages/CalculatorCard';
import { Customer, Order } from './types';
import { STORAGE_KEYS } from './utils/helpers';
import { useLocalStorage } from './utils/storage';
import { ensureSeed } from './data/seed';
import { formatIDR } from './utils/format';
import { Button } from './components/ui/Button';
import { TabButton } from './components/ui/TabButton';
import { UnitPriceModal } from './components/UnitPriceModal';
import { BottomTabBar } from './components/BottomTabBar'; // ⬅️ new

// ⬇️ Tambahan import logo
import logoLight from './assets/nihong.png';

export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'orders' | 'customers' | 'calculator'>('dashboard');
  const [orders, setOrders] = useLocalStorage<Order[]>(STORAGE_KEYS.orders, []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>(STORAGE_KEYS.customers, []);
  const [unitPrice, setUnitPrice] = useLocalStorage<number>(STORAGE_KEYS.unitPrice, 100_000);
  const [showUnitPriceModal, setShowUnitPriceModal] = useState(false);

  useEffect(() => {
    if (orders.length === 0 && customers.length === 0) {
      ensureSeed(setOrders, setCustomers, unitPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMemo(() => orders.filter((o) => o.status !== 'Selesai' && o.status !== 'Dibatalkan'), [orders]);

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
              <TabButton current={tab} setTab={setTab} id="calculator">Kalkulator</TabButton>
            </nav>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:inline text-xs text-neutral-600 dark:text-neutral-300">
              Harga/kg: <b>{formatIDR(unitPrice)}</b> <span className="text-[10px]">(pembulatan ke atas)</span>
            </span>
            <Button variant="ghost" onClick={() => setShowUnitPriceModal(true)}>Ubah Harga</Button>
          </div>
        </div>
      </header>

      {/* Tambah padding bawah agar tidak ketutup bottom tab di mobile */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-0">
        {tab === 'dashboard' && <Dashboard orders={orders} customers={customers} />}
        {tab === 'orders' && <OrdersPage orders={orders} setOrders={setOrders} customers={customers} unitPrice={unitPrice} />}
        {tab === 'customers' && <CustomersPage customers={customers} setCustomers={setCustomers} />}
        {tab === 'calculator' && <CalculatorCard unitPrice={unitPrice} openUnitPrice={() => setShowUnitPriceModal(true)} />}
        <p className="text-xs text-neutral-500 mt-8">*Data disimpan di <span className="font-semibold">localStorage</span>. Untuk produksi, sambungkan ke API/DB.</p>
      </main>

      {showUnitPriceModal && (
        <UnitPriceModal
          unitPrice={unitPrice}
          onClose={() => setShowUnitPriceModal(false)}
          onSave={(newPrice, recalc) => {
            setUnitPrice(newPrice);
            if (recalc) {
              setOrders((prev) => prev.map((o) => ({ ...o, totalHarga: Math.ceil(Math.max(0, o.jumlahKg)) * newPrice })));
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
