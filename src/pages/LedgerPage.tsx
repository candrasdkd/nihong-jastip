// src/pages/LedgerPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { formatIDR } from '../utils/format';
import {
    fetchLedger,
    subscribeLedger,
    createLedgerEntry,
    updateLedgerEntry,
    deleteLedgerEntry,
    type LedgerEntry,
    type LedgerUpsert,
} from '../services/ledgerFirebase';
import { LedgerFormModal } from '../components/LedgerFormModal';
import { formatAndAddYear } from '../utils/helpers';
import { BG } from '../utils/constants';

// ===== Helper Functions =====
function toInputDate(d: Date) {
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    return iso.slice(0, 10);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }


// ===== UI Components (New) =====
function TypePill({ type }: { type: 'Masuk' | 'Keluar' }) {
    const cls = type === 'Masuk'
        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20'
        : 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20';
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{type}</span>;
}

// Simple SVG Icons for better UI
const IconIncome = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
);
const IconOutcome = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
);
const IconBalance = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /></svg>
);
const IconPlus = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
const IconFilter = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
);

export function LedgerPage() {
    // ===== Filters =====
    const [q, setQ] = useState('');
    const [typeFilter, setTypeFilter] = useState<'' | 'Masuk' | 'Keluar'>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    const now = useMemo(() => new Date(), []);
    const defaultFrom = useMemo(
        () => toInputDate(startOfMonth(new Date(now.getFullYear() - 5, now.getMonth() - 2, 1))),
        [now]
    );
    const defaultTo = useMemo(() => toInputDate(endOfMonth(now)), [now]);

    const [dateFrom, setDateFrom] = useState<string>(defaultFrom);
    const [dateTo, setDateTo] = useState<string>(defaultTo);

    // ===== Data =====
    const [rows, setRows] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const categories = useMemo(() => {
        const set = new Set<string>();
        rows.forEach(r => r.kategori && set.add(r.kategori));
        return Array.from(set).sort();
    }, [rows]);

    // ===== Local text search =====
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return rows.filter(r => {
            const matchesText = !s || [
                r.keterangan, r.kategori, r.metode, r.catatan, r.tanggal
            ].some(v => String(v ?? '').toLowerCase().includes(s));
            const matchesType = !typeFilter || r.tipe === typeFilter;
            const matchesCategory = !categoryFilter || r.kategori === categoryFilter;
            return matchesText && matchesType && matchesCategory;
        });
    }, [rows, q, typeFilter, categoryFilter]);

    // ===== Summary =====
    const { totalMasuk, totalKeluar, saldo } = useMemo(() => {
        let masuk = 0, keluar = 0;
        for (const r of filtered) {
            if (r.tipe === 'Masuk') masuk += Number(r.jumlah || 0);
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
                    from: dateFrom, to: dateTo, type: typeFilter || undefined,
                    category: categoryFilter || undefined, limit: 500,
                    order: { field: 'tanggal', direction: 'desc' },
                });
                if (!cancelled) setRows(data);
            } finally {
                if (!cancelled) setLoading(false);
            }
            unsub = subscribeLedger({
                from: dateFrom, to: dateTo, type: typeFilter || undefined,
                category: categoryFilter || undefined, limit: 500,
                order: { field: 'tanggal', direction: 'desc' },
            }, (live) => { if (!cancelled) setRows(live); });
        }

        go();
        return () => { cancelled = true; if (unsub) unsub(); };
    }, [dateFrom, dateTo, typeFilter, categoryFilter]);

    // ===== CRUD modal state =====
    const [showForm, setShowForm] = useState<{ open: boolean; editing?: LedgerEntry | null }>({ open: false, editing: null });

    async function handleDelete(id: string) {
        if (!confirm('Hapus transaksi ini?')) return;
        await deleteLedgerEntry(id);
    }
    async function handleSubmitForm(val: LedgerUpsert) {
        if (showForm.editing?.id) {
            await updateLedgerEntry(showForm.editing.id, val);
        } else {
            await createLedgerEntry(val);
        }
    }

    // ===== Filter modal state =====
    const [showFilter, setShowFilter] = useState(false);
    const filterCount = useMemo(() => {
        let n = 0;
        if (typeFilter) n++;
        if (categoryFilter) n++;
        if (dateFrom !== defaultFrom) n++;
        if (dateTo !== defaultTo) n++;
        return n;
    }, [typeFilter, categoryFilter, dateFrom, dateTo, defaultFrom, defaultTo]);

    function handleResetFilters() {
        setTypeFilter('');
        setCategoryFilter('');
        setDateFrom(defaultFrom);
        setDateTo(defaultTo);
    }

    return (
        <div
            className="relative min-h-screen p-4 sm:p-6 lg:p-8"
            style={{
                backgroundColor: BG,
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '4px 4px',
            }}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <header>
                    <h1 className="text-3xl font-bold text-slate-800">Buku Kas Digital</h1>
                    <p className="text-sm text-slate-500 mt-1">Catat dan kelola semua transaksi keuangan Anda di satu tempat.</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Card className="p-5 flex items-center gap-5 bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <IconIncome className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">Total Masuk</div>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{formatIDR(totalMasuk)}</div>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-5 bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <IconOutcome className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">Total Keluar</div>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{formatIDR(totalKeluar)}</div>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-5 bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <IconBalance className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">Saldo Akhir</div>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{formatIDR(saldo)}</div>
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <Card className="bg-white p-4 sm:p-6 shadow-sm">
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
                        <Input
                            placeholder="Cari transaksi..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full sm:w-auto sm:min-w-[300px] lg:min-w-[400px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <div className="flex items-center gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilter(true)}
                                className="flex items-center gap-1.5"
                            >
                                <IconFilter className="w-4 h-4" />
                                <span>Filter</span>
                                {filterCount > 0 && (
                                    <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">
                                        {filterCount}
                                    </span>
                                )}
                            </Button>
                            {/* ===== MODIFIED: Button is now hidden on small screens ===== */}
                            <Button
                                onClick={() => setShowForm({ open: true, editing: null })}
                                variant='navy'
                                className="hover:bg-slate-900 text-white hidden sm:flex items-center gap-1.5"
                            >
                                <IconPlus className="w-4 h-4" />
                                <span>Catat Transaksi</span>
                            </Button>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="overflow-x-auto hidden sm:block">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left">
                                <tr className="text-slate-600">
                                    {['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah', 'Aksi'].map(h => (
                                        <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>
                                )}
                                {!loading && filtered.map((r) => (
                                    <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatAndAddYear(r.tanggal)}</td>
                                        <td className="px-4 py-3 text-slate-800 font-medium max-w-[300px] truncate" title={r.keterangan}>{r.keterangan || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.kategori || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap"><TypePill type={r.tipe} /></td>
                                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${r.tipe === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatIDR(Number(r.jumlah || 0))}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowForm({ open: true, editing: r })}
                                                >
                                                    Edit
                                                </Button>
                                                <Button variant="danger-ghost" onClick={() => handleDelete(r.id)}>Hapus</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Tidak ada data transaksi yang cocok.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                        {loading && <p className="text-center text-sm text-slate-500 py-8">Memuat data...</p>}
                        {!loading && filtered.map((r) => (
                            <Card key={r.id} className={`p-4 border-l-4 ${r.tipe === 'Masuk' ? 'border-emerald-500' : 'border-red-500'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">{r.keterangan || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{formatAndAddYear(r.tanggal)}</p>
                                    </div>
                                    <p className={`font-bold text-lg whitespace-nowrap ${r.tipe === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatIDR(Number(r.jumlah || 0))}
                                    </p>
                                </div>
                                {(r.kategori || r.metode) && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs">
                                        {r.kategori && <span className="inline-flex items-center gap-1.5"><strong className="font-medium text-slate-500">Kategori:</strong> {r.kategori}</span>}
                                        {r.metode && <span className="inline-flex items-center gap-1.5"><strong className="font-medium text-slate-500">Metode:</strong> {r.metode}</span>}
                                    </div>
                                )}
                                <div className="mt-3 flex gap-2">
                                    <Button variant="ghost" onClick={() => setShowForm({ open: true, editing: r })}>
                                        Edit
                                    </Button>
                                    <Button variant="danger-ghost" onClick={() => handleDelete(r.id)}>
                                        Hapus
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        {!loading && filtered.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Tidak ada data transaksi.</p>}
                    </div>
                </Card>
            </div>


            {/* Filter Modal */}
            {showFilter && (
                <FilterModal
                    initial={{ type: typeFilter, category: categoryFilter, from: dateFrom, to: dateTo }}
                    defaults={{ from: defaultFrom, to: defaultTo, categories }}
                    onApply={(p) => { setTypeFilter(p.type); setCategoryFilter(p.category); setDateFrom(p.from); setDateTo(p.to); setShowFilter(false); }}
                    onReset={() => { handleResetFilters(); setShowFilter(false); }}
                    onClose={() => setShowFilter(false)}
                />
            )}

            {/* Create/Edit Modal */}
            {showForm.open && (
                <LedgerFormModal
                    initial={showForm.editing ?? undefined}
                    onClose={() => setShowForm({ open: false, editing: null })}
                    onSubmit={handleSubmitForm}
                />
            )}

            {/* ===== NEW: Floating Action Button for Mobile ===== */}
            <Button
                onClick={() => setShowForm({ open: true, editing: null })}
                className="sm:hidden fixed bottom-20 right-6 z-40 bg-slate-800 hover:bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                aria-label="Catat Transaksi Baru"
            >
                <IconPlus className="w-6 h-6" />
            </Button>
        </div>
    );
}


/* =========================================================
   Filter Modal (Refined styles to match new theme)
========================================================= */
function FilterModal({
    initial, defaults, onApply, onReset, onClose,
}: {
    initial: { type: '' | 'Masuk' | 'Keluar'; category: string; from: string; to: string };
    defaults: { from: string; to: string; categories: string[] };
    onApply: (p: { type: '' | 'Masuk' | 'Keluar'; category: string; from: string; to: string }) => void;
    onReset: () => void;
    onClose: () => void;
}) {
    const [localType, setLocalType] = useState<'' | 'Masuk' | 'Keluar'>(initial.type || '');
    const [localCategory, setLocalCategory] = useState<string>(initial.category || '');
    const [localFrom, setLocalFrom] = useState<string>(initial.from || defaults.from);
    const [localTo, setLocalTo] = useState<string>(initial.to || defaults.to);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prev; }; }, []);
    useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [onClose]);
    useEffect(() => { const onClick = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose(); }; document.addEventListener('mousedown', onClick); return () => document.removeEventListener('mousedown', onClick); }, [onClose]);

    return (
        <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div ref={panelRef} className="relative w-full sm:w-[480px] max-w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/10 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-slate-800">Filter Transaksi</div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Tutup">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tipe</label>
                        <Select value={localType} onChange={(e) => setLocalType((e.target as HTMLSelectElement).value as any)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                            <option value="">Semua Tipe</option>
                            <option value="Masuk">Masuk</option>
                            <option value="Keluar">Keluar</option>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Kategori</label>
                        <Select value={localCategory} onChange={(e) => setLocalCategory((e.target as HTMLSelectElement).value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                            <option value="">Semua Kategori</option>
                            {defaults.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Dari Tanggal</label>
                        <Input type="date" value={localFrom} onChange={(e) => setLocalFrom((e.target as HTMLInputElement).value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Sampai Tanggal</label>
                        <Input type="date" value={localTo} onChange={(e) => setLocalTo((e.target as HTMLInputElement).value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2">
                    <Button variant="ghost" onClick={onReset}>Reset Filter</Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Batal</Button>
                        <Button onClick={() => onApply({ type: localType, category: localCategory, from: localFrom, to: localTo })} className="bg-slate-800 hover:bg-slate-900 text-white">Terapkan</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}