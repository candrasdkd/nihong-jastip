// src/pages/LedgerPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card } from "../components/ui/Card";
import { formatIDR } from "../utils/format";
import {
  fetchLedger,
  subscribeLedger,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  type LedgerEntry,
  type LedgerUpsert,
} from "../services/ledgerFirebase";
import { LedgerFormModal } from "../components/LedgerFormModal";
import { formatAndAddYear } from "../utils/helpers";
import { BG } from "../utils/constants";

// ===== Helper Functions =====
function toInputDate(d: Date) {
  const iso = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000,
  ).toISOString();
  return iso.slice(0, 10);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// ===== Icons (Lucide Style) =====
const Icons = {
  TrendingUp: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  TrendingDown: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  Wallet: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Search: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Filter: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Plus: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  Edit: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  ArrowUpRight: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  ArrowDownLeft: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="17" y1="7" x2="7" y2="17" />
      <polyline points="17 17 7 17 7 7" />
    </svg>
  ),
  X: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Empty: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
};

// ===== Sub Components =====

function StatCard({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: "income" | "expense" | "balance";
}) {
  const config = {
    income: {
      icon: Icons.TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    expense: {
      icon: Icons.TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    balance: {
      icon: Icons.Wallet,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={`p-5 rounded-2xl bg-white border ${config.border} shadow-sm flex flex-col justify-between transition-all hover:shadow-md`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${config.bg} ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div>
        <span className="text-2xl font-bold text-slate-800 tracking-tight">
          {formatIDR(value)}
        </span>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: "Masuk" | "Keluar" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        type === "Masuk"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200"
      }`}
    >
      {type === "Masuk" ? "Pemasukan" : "Pengeluaran"}
    </span>
  );
}

export function LedgerPage() {
  // ===== Filters =====
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "Masuk" | "Keluar">("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const now = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(
    () =>
      toInputDate(
        startOfMonth(new Date(now.getFullYear() - 5, now.getMonth() - 2, 1)),
      ),
    [now],
  );
  const defaultTo = useMemo(() => toInputDate(endOfMonth(now)), [now]);

  const [dateFrom, setDateFrom] = useState<string>(defaultFrom);
  const [dateTo, setDateTo] = useState<string>(defaultTo);

  // ===== Data =====
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.kategori && set.add(r.kategori));
    return Array.from(set).sort();
  }, [rows]);

  // ===== Local text search =====
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesText =
        !s ||
        [r.keterangan, r.kategori, r.metode, r.catatan, r.tanggal].some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(s),
        );
      const matchesType = !typeFilter || r.tipe === typeFilter;
      const matchesCategory = !categoryFilter || r.kategori === categoryFilter;
      return matchesText && matchesType && matchesCategory;
    });
  }, [rows, q, typeFilter, categoryFilter]);

  // ===== Summary =====
  const { totalMasuk, totalKeluar, saldo } = useMemo(() => {
    let masuk = 0,
      keluar = 0;
    for (const r of filtered) {
      if (r.tipe === "Masuk") masuk += Number(r.jumlah || 0);
      else keluar += Number(r.jumlah || 0);
    }
    return { totalMasuk: masuk, totalKeluar: keluar, saldo: masuk - keluar };
  }, [filtered]);

  // ===== Fetch + Realtime =====
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    async function go() {
      setLoading(true);
      try {
        const data = await fetchLedger({
          from: dateFrom,
          to: dateTo,
          type: typeFilter || undefined,
          category: categoryFilter || undefined,
          limit: 500,
          order: { field: "tanggal", direction: "desc" },
        });
        if (!cancelled) setRows(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
      unsub = subscribeLedger(
        {
          from: dateFrom,
          to: dateTo,
          type: typeFilter || undefined,
          category: categoryFilter || undefined,
          limit: 500,
          order: { field: "tanggal", direction: "desc" },
        },
        (live) => {
          if (!cancelled) setRows(live);
        },
      );
    }

    go();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [dateFrom, dateTo, typeFilter, categoryFilter]);

  // ===== CRUD modal state =====
  const [showForm, setShowForm] = useState<{
    open: boolean;
    editing?: LedgerEntry | null;
  }>({ open: false, editing: null });
  const [showFilter, setShowFilter] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini permanen?")) return;
    await deleteLedgerEntry(id);
  }

  async function handleSubmitForm(val: LedgerUpsert) {
    if (showForm.editing?.id) await updateLedgerEntry(showForm.editing.id, val);
    else await createLedgerEntry(val);
  }

  const filterCount = [
    typeFilter,
    categoryFilter,
    dateFrom !== defaultFrom,
    dateTo !== defaultTo,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Buku Kas
              </h1>
              <p className="text-sm text-slate-500 hidden sm:block">
                Kelola arus kas harian Anda
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Icons.Search className="w-4 h-4" />
                </div>
                <Input
                  placeholder="Cari transaksi..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus:bg-white rounded-lg transition-all"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilter(true)}
                className={`relative ${filterCount > 0 ? "border-indigo-500 text-indigo-600 bg-indigo-50" : ""}`}
              >
                <Icons.Filter className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Filter</span>
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                )}
              </Button>
              <Button
                onClick={() => setShowForm({ open: true, editing: null })}
                className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
              >
                <Icons.Plus className="w-4 h-4" />
                <span>Tambah Baru</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Pemasukan" value={totalMasuk} type="income" />
          <StatCard label="Pengeluaran" value={totalKeluar} type="expense" />
          <StatCard label="Sisa Saldo" value={saldo} type="balance" />
        </div>

        {/* Content Area */}
        <Card className="bg-white shadow-sm border border-slate-200 overflow-hidden rounded-xl">
          {loading && (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-3"></div>
              Memuat data transaksi...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Icons.Empty className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                Tidak ada transaksi
              </h3>
              <p className="text-sm mt-1 max-w-xs mx-auto">
                Coba ubah filter pencarian Anda atau tambahkan transaksi baru.
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          {!loading && filtered.length > 0 && (
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    {[
                      "Tanggal",
                      "Keterangan",
                      "Kategori",
                      "Status",
                      "Nominal",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${i === 4 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {formatAndAddYear(r.tanggal)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 line-clamp-1">
                          {r.keterangan || "Tanpa keterangan"}
                        </div>
                        {r.metode && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {r.metode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {r.kategori ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                            {r.kategori}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TypeBadge type={r.tipe} />
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono ${r.tipe === "Masuk" ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {r.tipe === "Masuk" ? "+" : "-"}
                        {formatIDR(Number(r.jumlah || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              setShowForm({ open: true, editing: r })
                            }
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Icons.Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile List View (Refined) */}
          {/* Mobile List View (Refined & Fixed) */}
          {!loading && filtered.length > 0 && (
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="p-4 active:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Area Klik untuk Edit (Kiri & Tengah) */}
                    <div
                      className="flex-1 flex items-start gap-3 cursor-pointer"
                      onClick={() => setShowForm({ open: true, editing: r })}
                    >
                      {/* Icon Status */}
                      <div
                        className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          r.tipe === "Masuk"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {r.tipe === "Masuk" ? (
                          <Icons.ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <Icons.ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      {/* Detail Transaksi */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1 break-all">
                          {r.keterangan || "Transaksi Tanpa Nama"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <span
                            className={`text-sm font-bold ${r.tipe === "Masuk" ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {r.tipe === "Keluar" && "-"}
                            {formatIDR(Number(r.jumlah || 0))}
                          </span>
                          <span className="text-xs text-slate-300">|</span>
                          <span className="text-xs text-slate-500">
                            {formatAndAddYear(r.tanggal)}
                          </span>
                        </div>
                        {r.kategori && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {r.kategori}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tombol Hapus (Kanan) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Mencegah modal edit terbuka
                        handleDelete(r.id);
                      }}
                      className="p-2 -mr-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      aria-label="Hapus transaksi"
                    >
                      <Icons.Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <FilterModal
          initial={{
            type: typeFilter,
            category: categoryFilter,
            from: dateFrom,
            to: dateTo,
          }}
          defaults={{ from: defaultFrom, to: defaultTo, categories }}
          onApply={(p) => {
            setTypeFilter(p.type);
            setCategoryFilter(p.category);
            setDateFrom(p.from);
            setDateTo(p.to);
            setShowFilter(false);
          }}
          onReset={() => {
            setTypeFilter("");
            setCategoryFilter("");
            setDateFrom(defaultFrom);
            setDateTo(defaultTo);
            setShowFilter(false);
          }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* Form Modal */}
      {showForm.open && (
        <LedgerFormModal
          initial={showForm.editing ?? undefined}
          onClose={() => setShowForm({ open: false, editing: null })}
          onSubmit={handleSubmitForm}
        />
      )}

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setShowForm({ open: true, editing: null })}
        className="sm:hidden fixed bottom-20 right-6 h-14 w-14 bg-slate-900 text-white rounded-full shadow-xl shadow-slate-900/30 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Icons.Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ===== Filter Modal Component (Clean Dialog Style) =====
function FilterModal({ initial, defaults, onApply, onReset, onClose }: any) {
  const [local, setLocal] = useState(initial);

  // Close on click outside
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[400px] bg-white rounded-2xl shadow-2xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Filter Transaksi</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tipe Transaksi
            </label>
            <Select
              value={local.type}
              onChange={(e) =>
                setLocal({ ...local, type: (e.target as any).value })
              }
              className="w-full"
            >
              <option value="">Semua</option>
              <option value="Masuk">Pemasukan</option>
              <option value="Keluar">Pengeluaran</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Kategori
            </label>
            <Select
              value={local.category}
              onChange={(e) =>
                setLocal({ ...local, category: (e.target as any).value })
              }
              className="w-full"
            >
              <option value="">Semua Kategori</option>
              {defaults.categories.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Dari
              </label>
              <Input
                type="date"
                value={local.from}
                onChange={(e) => setLocal({ ...local, from: e.target.value })}
                className="w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sampai
              </label>
              <Input
                type="date"
                value={local.to}
                onChange={(e) => setLocal({ ...local, to: e.target.value })}
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex gap-3">
          <Button variant="ghost" onClick={onReset} className="flex-1">
            Reset
          </Button>
          <Button
            onClick={() => onApply(local)}
            className="flex-[2] bg-slate-900 text-white hover:bg-slate-800"
          >
            Terapkan Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
