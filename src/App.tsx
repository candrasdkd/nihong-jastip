import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

import { Dashboard } from './pages/Dashboard';
import { OrdersPage } from './pages/OrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { LedgerPage } from './pages/LedgerPage';
import { LoginPage } from './pages/LoginPage';

import { Customer, Order } from './types';
import { TabButton } from './components/ui/TabButton';
import { UnitPriceModal } from './components/UnitPriceModal';
import { BottomTabBar } from './components/BottomTabBar';

import logoLight from './assets/nihong.png';

import { listenCustomers } from './services/customersFirebase';
import { subscribeOrders, toExtended } from './services/ordersFirebase';
import { listenAuth, logout } from './services/authFirebase';
import { motion, AnimatePresence } from "framer-motion";
import PurchasesPage from './pages/PurchasesPage';

// helper tanggal
function toInputDate(d: Date) {
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 10);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default function App() {
  const [tab, setTab] = useState<
    'dashboard' | 'orders' | 'customers' | 'purchase' | 'cash'
  >('dashboard');

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [unitPrice, setUnitPrice] = useState<number>(100_000);
  const [showUnitPriceModal, setShowUnitPriceModal] = useState(false);

  // 🔐 AUTH STATE
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 🔐 Listen auth
  useEffect(() => {
    const unsub = listenAuth((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // 🔊 Realtime customers
  useEffect(() => {
    if (!user) return;

    const unsub = listenCustomers((rows) =>
      setCustomers(rows as Customer[])
    );

    return () => unsub();
  }, [user]);

  // 🔊 Realtime orders untuk dashboard
  useEffect(() => {
    if (!user || tab !== 'dashboard') return;

    const now = new Date();

    const from = (() => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 11, 1);
      return startOfMonth(d);
    })();

    const to = endOfMonth(now);

    const unsub = subscribeOrders(
      {
        fromInput: toInputDate(from),
        toInput: toInputDate(to),
        sort: 'desc',
        limit: 1000,
      },
      (rows) => setOrders(rows.map(toExtended) as Order[])
    );

    return () => unsub();
  }, [tab, user]);

  // ⏳ Loading Auth (Replaced)
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
          className="flex flex-col items-center gap-4"
        >
          {/* Container Logo dengan efek breathing */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-20 w-20 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl grid place-items-center overflow-hidden"
          >
            <img
              src={logoLight}
              alt="Logo Nihong"
              className="h-12 w-12 object-contain"
            />
          </motion.div>

          {/* Text Branding */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Nihong Jastip
            </h1>
            <p className="text-sm text-neutral-500 animate-pulse">
              Memuat data...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 🚫 Belum Login
  if (!user) {
    return <LoginPage />;
  }

  // ✅ Sudah Login
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
              <h1 className="text-xl font-semibold group-active:opacity-90">
                Nihong Jastip
              </h1>
              <p className="text-xs text-neutral-500">Panel Admin</p>
            </span>
          </button>

          <div className="flex-1 overflow-x-auto hidden sm:block">
            <nav className="flex gap-2 min-w-max">
              <TabButton current={tab} setTab={setTab} id="dashboard">
                Dashboard
              </TabButton>
              <TabButton current={tab} setTab={setTab} id="orders">
                Pesanan
              </TabButton>
              <TabButton current={tab} setTab={setTab} id="customers">
                Konsumen
              </TabButton>
              <TabButton current={tab} setTab={setTab} id="purchase">
                Pembelian
              </TabButton>
              <TabButton current={tab} setTab={setTab} id="cash">
                Kas
              </TabButton>
            </nav>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="ml-auto text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={user ? "dashboard" : "login"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {tab === 'dashboard' && (
            <Dashboard orders={orders} customers={customers} />
          )}
          {tab === 'orders' && (
            <OrdersPage
              customers={customers}
              orders={orders}
              setOrders={setOrders}
              unitPrice={unitPrice}
            />
          )}
          {tab === 'customers' && <CustomersPage />}
          {tab === 'purchase' && <PurchasesPage />}
          {tab === 'cash' && <LedgerPage />}
        </motion.div>
      </AnimatePresence>


      {showUnitPriceModal && (
        <UnitPriceModal
          unitPrice={unitPrice}
          onClose={() => setShowUnitPriceModal(false)}
          onSave={(newPrice, recalc) => {
            setUnitPrice(newPrice);

            if (recalc) {
              setOrders((prev) =>
                prev.map((o) => ({
                  ...o,
                  totalHarga:
                    Math.ceil(Math.max(0, (o as any).jumlahKg)) *
                    newPrice,
                }))
              );
            }

            setShowUnitPriceModal(false);
          }}
        />
      )}

      <BottomTabBar current={tab} setTab={setTab} />
    </div>
  );
}
