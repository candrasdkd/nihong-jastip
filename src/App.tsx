import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from "framer-motion";

// Pages
import { Dashboard } from './pages/Dashboard';
import { OrdersPage } from './pages/OrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { LedgerPage } from './pages/LedgerPage';
import { LoginPage } from './pages/LoginPage';
import PurchasesPage from './pages/PurchasesPage';

// Components
import { TabButton } from './components/ui/TabButton';
import { UnitPriceModal } from './components/UnitPriceModal';
import { BottomTabBar } from './components/BottomTabBar';
import { InstallPrompt } from './components/InstallPrompt';

// Assets & Services
import logoLight from './assets/logo-admin.png';
import { Customer, Order, TabId } from './types';
import { listenCustomers } from './services/customersFirebase';
import { subscribeOrders, toExtended } from './services/ordersFirebase';
import { listenAuth, logout } from './services/authFirebase';
import { endOfMonth, startOfMonth, toInputDate } from './utils/helpers';
import StoryGeneratorDynamic from './pages/StoryGeneratorPage';
import { LogoutModal } from './components/ModalLogout';
// Icon Sederhana
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);


export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [unitPrice, setUnitPrice] = useState<number>(100_000);

  // Modal States
  const [showUnitPriceModal, setShowUnitPriceModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
    const unsub = listenCustomers((rows) => setCustomers(rows as Customer[]));
    return () => unsub();
  }, [user]);

  // 🔊 Realtime orders
  useEffect(() => {
    if (!user || (tab !== 'home' && tab !== 'orders')) return;

    const now = new Date();
    const from = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1));
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

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
  };

  // ⏳ Loading Screen
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-indigo-500/20"
            />
            <div className="relative h-24 w-24 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-2xl grid place-items-center overflow-hidden p-1">
              <img src={logoLight} alt="Logo" className="h-full w-full object-cover rounded-full" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Nihong Jastip</h1>
            <p className="text-sm text-neutral-500 animate-pulse font-medium">Memuat data...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">


      {/* Background Pattern */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.4] dark:opacity-[0.05]"></div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200/80 dark:border-neutral-800/80 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo Brand */}
          <button
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setTab('home')}
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="h-10 w-10 rounded-full overflow-hidden border-2 border-white dark:border-neutral-800 shadow-sm bg-indigo-50 dark:bg-neutral-900 grid place-items-center relative z-10"
            >
              <img src={logoLight} alt="Logo" className="h-full w-full object-cover" />
            </motion.div>
            <div className="text-left hidden xs:block">
              <h1 className="text-lg font-bold leading-none tracking-tight text-neutral-900 dark:text-white">Nihong Jastip</h1>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">Admin Dashboard</p>
            </div>
          </button>

          {/* Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {(['home', 'orders', 'customers', 'purchase', 'cash'] as const).map((t) => (
              <TabButton key={t} current={tab} setTab={setTab} id={t}>
                {t === 'cash' ? 'Kas' : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabButton>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 pl-3 pr-1 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <div className="flex flex-col items-end mr-1">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 leading-none">
                  {user.displayName || "Admin"}
                </span>
                <span className="text-[10px] text-neutral-400 leading-none mt-1 max-w-[100px] truncate">
                  {user.email}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 grid place-items-center text-white text-xs font-bold shadow-inner">
                {user.email?.[0].toUpperCase() || "A"}
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                title="Keluar"
                className="h-8 w-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogoutIcon />
              </button>
            </div>

            {/* Mobile Logout Trigger */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="sm:hidden p-2 text-neutral-500 hover:text-red-500"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </header>

      {/* ISI KONTEN UTAMA */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'home' &&
              <Dashboard
                orders={orders}
                customers={customers}
                onSeeAllOrders={() => setTab('orders')}
                setActiveFeature={(value: string) => setTab(value)}
              />}
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
            {tab === 'generator' && <StoryGeneratorDynamic />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MODAL HARGA & LOGOUT */}
      <AnimatePresence>
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
                    totalHarga: Math.ceil(Math.max(0, (o as any).jumlahKg || 0)) * newPrice,
                  }))
                );
              }
              setShowUnitPriceModal(false);
            }}
          />
        )}

        {showLogoutModal && (
          <LogoutModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleLogoutConfirm}
          />
        )}
      </AnimatePresence>

      {/* NAVBAR MOBILE */}
      <BottomTabBar current={tab} setTab={setTab} />
      <InstallPrompt />
    </div>
  );
}