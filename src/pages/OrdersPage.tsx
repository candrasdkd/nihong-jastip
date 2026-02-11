import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Customer, ExtendedOrder, Order } from '../types';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { OrderFormModal } from '../components/OrderFormModal';
import { InvoiceModal } from '../components/InvoiceModal';
import {
  addTipeNominalToAllOrders,
  createOrder,
  deleteOrder,
  fromExtended,
  subscribeOrders,
  toExtended,
  updateOrder,
} from '../services/ordersFirebase';
import { endOfMonth, formatAndAddYear, startOfMonth, toInputDate } from '../utils/helpers';
import { BG, ORDER_STATUSES } from '../utils/constants';


// ===== UI Components (New & Refined) =====

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Belum Membayar': 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20',
    'Pembayaran Selesai': 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20',
    'Sedang Pengiriman': 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20',
    'Sudah Diterima': 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20',
    'Selesai': 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20',
    'Pending': 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20',
    'Diproses': 'bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-600/20',
    'Dibatalkan': 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

// Simple SVG Icons for better UI
const IconPlus = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>);
const IconFilter = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>);
const IconInvoice = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>);
const IconChevronDown = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6" /></svg>);

// ===== Main Page Component =====
export function OrdersPage({ orders, setOrders, customers, unitPrice }: {
  orders: ExtendedOrder[];
  setOrders: (updater: (prev: ExtendedOrder[]) => ExtendedOrder[]) => void;
  customers: Customer[];
  unitPrice: number;
}) {
  // ===== State =====
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | ''>('');
  const now = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => toInputDate(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1))), [now]);
  const defaultTo = useMemo(() => toInputDate(endOfMonth(now)), [now]);
  const [dateFrom, setDateFrom] = useState<string>(defaultFrom);
  const [dateTo, setDateTo] = useState<string>(defaultTo);
  const [editing, setEditing] = useState<ExtendedOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showInvoice, setShowInvoice] = useState<{ show: boolean; order?: ExtendedOrder; itemIds?: string[] }>({ show: false });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  // ===== Memos & Derived State =====
  const selectedOrders = useMemo(() => orders.filter(o => selectedIds.includes(o.id)), [orders, selectedIds]);
  const sameCustomer = selectedOrders.length > 0 && selectedOrders.every(o => o.namaPelanggan === selectedOrders[0]?.namaPelanggan);
  const filterCount = useMemo(() => {
    let n = 0;
    if (statusFilter) n++;
    if (dateFrom !== defaultFrom) n++;
    if (dateTo !== defaultTo) n++;
    return n;
  }, [statusFilter, dateFrom, dateTo, defaultFrom, defaultTo]);

  // ===== Data Fetching & Subscription =====
  useEffect(() => {
    // addTipeNominalToAllOrders('IDR');
    const unsub = subscribeOrders({
      q, status: statusFilter || '', fromInput: dateFrom || '',
      toInput: dateTo || '', limit: 250, sort: 'desc',
    }, (rows) => {
      const ex = rows.map(toExtended);
      const filtered = q ? ex.filter((o) => matchSearch(o, q)) : ex;
      setOrders(() => filtered);
      setSelectedIds((prev) => prev.filter((id) => filtered.some((x) => x.id === id)));
    });
    return () => unsub();
  }, [q, statusFilter, dateFrom, dateTo, setOrders]);

  // ===== Helper Functions =====
  function matchSearch(o: ExtendedOrder, query: string) {
    if (!query) return true;
    const s = query.trim().toLowerCase();
    return [o.no, o.tanggal, o.pengiriman, o.namaBarang, o.kategori, o.namaPelanggan, o.catatan]
      .some((field) => String(field ?? '').toLowerCase().includes(s));
  }

  // ===== Event Handlers =====
  async function handleDelete(id: string) {
    if (!confirm('Hapus pesanan ini?')) return;
    await deleteOrder(id);
  }
  const handleApplyFilters = (payload: { status: string; from: string; to: string }) => {
    setStatusFilter(payload.status || '');
    setDateFrom(payload.from || defaultFrom);
    setDateTo(payload.to || defaultTo);
    setShowFilter(false);
  };
  const handleResetFilters = () => {
    setStatusFilter('');
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
  };
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className="relative min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        backgroundColor: BG,
        backgroundImage:
          'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Pesanan</h1>
          <p className="text-sm text-slate-500 mt-1">Lacak, kelola, dan buat invoice untuk semua pesanan pelanggan.</p>
        </header>

        {/* Main Content Area */}
        <Card className="bg-white p-4 sm:p-6 shadow-sm">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
            <Input
              placeholder="Cari pesanan (no, pelanggan, barang, dll)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[300px] lg:min-w-[400px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFilter(true)} className="flex items-center gap-1.5">
                <IconFilter className="w-4 h-4" />
                <span>Filter</span>
                {filterCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">{filterCount}</span>
                )}
              </Button>
              <Button onClick={() => { if (selectedOrders.length > 0 && !sameCustomer) { alert('Silakan pilih pesanan dari pelanggan yang sama.'); return; } setShowInvoice({ show: true, order: selectedOrders[0], itemIds: selectedIds }); }} className="flex items-center gap-1.5" variant="outline">
                <IconInvoice className="w-4 h-4" />
                <span>Invoice {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
              </Button>
              {/* ===== MODIFIED: Button is now hidden on small screens ===== */}
              <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-slate-800 hover:bg-slate-900 text-white hidden sm:flex items-center gap-1.5">
                <IconPlus className="w-4 h-4" />
                <span>Tambah Pesanan</span>
              </Button>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="text-slate-600">
                  <th className="px-4 py-3 font-semibold w-12"><input type="checkbox" checked={orders.length > 0 && orders.every(o => selectedIds.includes(o.id))} onChange={(e) => setSelectedIds(e.target.checked ? orders.map(o => o.id) : [])} /></th>
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Pelanggan</th>
                  <th className="px-4 py-3 font-semibold">Barang</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Pembayaran</th>
                  <th className="px-4 py-3 font-semibold text-right">Keuntungan</th>
                  <th className="px-4 py-3 font-semibold text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Tidak ada data pesanan.</td></tr>
                )}
                {orders.map((o) => (
                  <ExpandableRow
                    key={o.id}
                    order={o}
                    unitPrice={unitPrice}
                    isExpanded={expandedRows.has(o.id)}
                    isSelected={selectedIds.includes(o.id)}
                    onToggleExpand={() => toggleRowExpansion(o.id)}
                    onToggleSelect={() => setSelectedIds(prev => prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id])}
                    onEdit={() => { setEditing(o); setShowForm(true); }}
                    onDelete={() => handleDelete(o.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {orders.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Tidak ada data pesanan.</p>}
            {orders.map((o) => {
              const d = compute(o, unitPrice);
              const statusColorMap: Record<string, string> = { 'Belum Membayar': 'border-amber-500', 'Pembayaran Selesai': 'border-emerald-500', 'Sedang Pengiriman': 'border-blue-500', 'Sudah Diterima': 'border-slate-400', 'Selesai': 'border-slate-400', 'Dibatalkan': 'border-red-500' };
              return (
                <Card key={o.id} className={`p-0 overflow-hidden border-l-4 ${statusColorMap[String(o.status)] || 'border-gray-400'}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => setSelectedIds(prev => prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id])} className="mt-1" />
                        <div>
                          <p className="font-semibold text-slate-800">{o.namaPelanggan}</p>
                          <p className="text-xs text-slate-500">#{o.no} &bull; {formatAndAddYear(o.tanggal)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-slate-800 whitespace-nowrap">{formatCurrency(d.totalPembayaran, d.currency)}</p>
                        <StatusPill status={String(o.status) || 'Belum Membayar'} />
                      </div>
                    </div>
                    <p className="mt-3 text-slate-700">{o.namaBarang}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Keuntungan</div>
                        <div className="font-semibold text-emerald-600">{formatCurrency(d.totalKeuntungan, d.currency)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Berat</div>
                        <div className="font-semibold text-slate-800">{d.kg} Kg</div>
                      </div>
                    </div>

                  </div>
                  <div className="bg-slate-50 px-4 py-2 flex gap-2 border-t border-slate-200">
                    <Button variant="ghost" onClick={() => { setEditing(o); setShowForm(true); }}>Edit</Button>
                    <Button variant="danger-ghost" onClick={() => handleDelete(o.id)}>Hapus</Button>
                  </div>
                </Card>
              );
            })}
          </div>

        </Card>
      </div>

      {/* Modals */}
      {showForm && <OrderFormModal customers={customers} initial={editing || undefined} onClose={() => setShowForm(false)} onSubmit={async (val) => { const dto = fromExtended(val as any); if (editing?.id) await updateOrder(editing.id, dto, unitPrice); else await createOrder(dto, unitPrice); setShowForm(false); }} existing={orders} unitPrice={unitPrice} />}
      {showInvoice.show && showInvoice.order && <InvoiceModal order={showInvoice.order} orders={orders} itemIds={showInvoice.itemIds} customer={customers.find((c) => c.nama === showInvoice.order!.namaPelanggan)} onClose={() => setShowInvoice({ show: false })} unitPrice={unitPrice} />}
      {showFilter && <FilterModal initial={{ status: statusFilter, from: dateFrom, to: dateTo }} defaultRange={{ from: defaultFrom, to: defaultTo }} onApply={handleApplyFilters} onReset={() => { handleResetFilters(); setShowFilter(false); }} onClose={() => setShowFilter(false)} />}

      {/* ===== NEW: Floating Action Button for Mobile ===== */}
      <Button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="sm:hidden fixed bottom-20 right-6 z-40 bg-slate-800 hover:bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        aria-label="Tambah Pesanan Baru"
      >
        <IconPlus className="w-6 h-6" />
      </Button>
    </div>
  );
}

// ===== Helper Functions & Components =====
const compute = (o: ExtendedOrder, unitPrice: number) => {
  const kg = Math.ceil(Number(o.jumlahKg ?? 0));
  // Ambil currency dari order, default ke IDR jika tidak ada
  const currency = o.tipeNominal || 'IDR';

  const baseOngkir = typeof o.hargaOngkir === 'number' ? o.hargaOngkir : kg * unitPrice;
  const jastipMarkup = Number(o.hargaJastipMarkup ?? 0);
  const baseJastip = Number(o.hargaJastip ?? 0);
  const ongkirMarkup = Number(o.hargaOngkirMarkup ?? 0);

  const totalPembayaran = jastipMarkup + ongkirMarkup;
  const totalKeuntungan = (jastipMarkup + ongkirMarkup) - (baseOngkir + baseJastip);

  return {
    kg,
    baseJastip,
    jastipMarkup,
    baseOngkir,
    ongkirMarkup,
    totalPembayaran,
    totalKeuntungan,
    currency
  };
};

function ExpandableRow({ order, unitPrice, isExpanded, isSelected, onToggleExpand, onToggleSelect, onEdit, onDelete }: {
  order: ExtendedOrder; unitPrice: number; isExpanded: boolean; isSelected: boolean;
  onToggleExpand: () => void; onToggleSelect: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const d = compute(order, unitPrice);
  return (
    <>
      <tr className={`border-b border-slate-200 transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
        <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={onToggleSelect} /></td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{order.no}</td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatAndAddYear(order.tanggal)}</td>
        <td className="px-4 py-3 text-slate-800 font-medium">{order.namaPelanggan}</td>
        <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={order.namaBarang}>{order.namaBarang}</td>
        <td className="px-4 py-3"><StatusPill status={String(order.status) || 'Belum Membayar'} /></td>
        <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(d.totalPembayaran, d.currency)}</td>
        <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(d.totalKeuntungan, d.currency)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" onClick={onEdit}>Edit</Button>
            <Button variant="ghost" onClick={onToggleExpand} aria-label="Toggle Details">
              <IconChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50">
          <td colSpan={9} className="p-0">
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-xs">
              <div className="space-y-1"><div className="text-slate-500">Pengiriman</div><div className="font-medium text-slate-800">{order.pengiriman || '-'}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Kategori</div><div className="font-medium text-slate-800">{order.kategori || '-'}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Berat (ceil)</div><div className="font-medium text-slate-800">{d.kg} Kg</div></div>
              <div className="space-y-1"><div className="text-slate-500">Harga Jastip</div><div className="font-medium text-slate-800">{formatCurrency(d.baseJastip)}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Jastip Markup</div><div className="font-medium text-slate-800">{formatCurrency(d.jastipMarkup)}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Harga Ongkir</div><div className="font-medium text-slate-800">{formatCurrency(d.baseOngkir)}</div></div>
              <div className="space-y-1"><div className="text-slate-500">Ongkir Markup</div><div className="font-medium text-slate-800">{formatCurrency(d.ongkirMarkup)}</div></div>
              <div className="col-span-2 lg:col-span-3 space-y-1"><div className="text-slate-500">Catatan</div><div className="font-medium text-slate-800">{order.catatan || '-'}</div></div>
              <div className="self-end"><Button variant="danger-ghost" onClick={onDelete}>Hapus Pesanan</Button></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Re-styled FilterModal (same as previous example for consistency)
function FilterModal({ initial, defaultRange, onApply, onReset, onClose }: {
  initial: { status: string; from: string; to: string }; defaultRange: { from: string; to: string };
  onApply: (payload: { status: string; from: string; to: string }) => void; onReset: () => void; onClose: () => void;
}) {
  const [localStatus, setLocalStatus] = useState<string>(initial.status || '');
  const [localFrom, setLocalFrom] = useState<string>(initial.from || defaultRange.from);
  const [localTo, setLocalTo] = useState<string>(initial.to || defaultRange.to);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prev; }; }, []);
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [onClose]);
  useEffect(() => { const onClick = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose(); }; document.addEventListener('mousedown', onClick); return () => document.removeEventListener('mousedown', onClick); }, [onClose]);
  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div ref={panelRef} className="relative w-full sm:w-[480px] max-w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/10 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-slate-800">Filter Pesanan</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Tutup"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
            <Select value={localStatus} onChange={(e) => setLocalStatus((e.target as HTMLSelectElement).value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              <option value="">Semua Status</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Dari Tanggal</label><Input type="date" value={localFrom} onChange={(e) => setLocalFrom((e.target as HTMLInputElement).value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
          <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Sampai Tanggal</label><Input type="date" value={localTo} onChange={(e) => setLocalTo((e.target as HTMLInputElement).value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onReset}>Reset Filter</Button>
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={() => onApply({ status: localStatus, from: localFrom, to: localTo })} className="bg-slate-800 hover:bg-slate-900 text-white">Terapkan</Button></div>
        </div>
      </div>
    </div>
  );
}