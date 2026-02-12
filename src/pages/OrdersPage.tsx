import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Customer, ExtendedOrder } from '../types';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { OrderFormModal } from '../components/OrderFormModal';
import { InvoiceModal } from '../components/InvoiceModal';
import {
  createOrder,
  deleteOrder,
  fromExtended,
  subscribeOrders,
  updateOrder,
  toExtended
} from '../services/ordersFirebase';
import { compute, endOfMonth, formatAndAddYear, startOfMonth, toInputDate } from '../utils/helpers';
import {  ORDER_STATUSES } from '../utils/constants';

// ===== ICONS =====
const IconPlus = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14" /><path d="M12 5v14" /></svg>);
const IconFilter = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>);
const IconInvoice = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>);
const IconChevronDown = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6" /></svg>);
const IconSearch = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const IconTrendingUp = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
const IconBox = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
const IconTrash = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>);
const IconEdit = (p: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>);



// ===== UI SUB-COMPONENTS =====

function StatusPill({ status }: { status: string }) {
  const config: Record<string, string> = {
    'Belum Membayar': 'bg-red-50 text-red-700 border-red-200',
    'Selesai': 'bg-gray-100 text-gray-700 border-gray-200',
    'Diproses': 'bg-sky-50 text-sky-700 border-sky-200',
    'Dibatalkan': 'bg-slate-100 text-slate-500 border-slate-200 line-through decoration-slate-400',
  };
  const cls = config[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Belum Membayar' ? 'bg-red-500' : 'bg-current opacity-60'}`}></span>
      {status}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600'];
  const colorIndex = name ? name.length % colors.length : 0;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${colors[colorIndex]} ring-2 ring-white`}>
      {initial}
    </div>
  );
}

// ===== MAIN PAGE COMPONENT =====
export function OrdersPage({ orders, setOrders, customers, unitPrice }: {
  orders: ExtendedOrder[];
  setOrders: (updater: (prev: ExtendedOrder[]) => ExtendedOrder[]) => void;
  customers: Customer[];
  unitPrice: number;
}) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Date Logic
  const now = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => toInputDate(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1))), [now]);
  const defaultTo = useMemo(() => toInputDate(endOfMonth(now)), [now]);
  const [dateFrom, setDateFrom] = useState<string>(defaultFrom);
  const [dateTo, setDateTo] = useState<string>(defaultTo);

  // UI State
  const [editing, setEditing] = useState<ExtendedOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showInvoice, setShowInvoice] = useState<{ show: boolean; order?: ExtendedOrder; itemIds?: string[] }>({ show: false });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Derived State
  const selectedOrders = useMemo(() => orders.filter(o => selectedIds.includes(o.id)), [orders, selectedIds]);
  const sameCustomer = selectedOrders.length > 0 && selectedOrders.every(o => o.namaPelanggan === selectedOrders[0]?.namaPelanggan);
  const filterCount = (statusFilter ? 1 : 0) + (dateFrom !== defaultFrom ? 1 : 0) + (dateTo !== defaultTo ? 1 : 0);

  // Stats Calculation
  const stats = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let count = 0;
    orders.forEach(o => {
      const c = compute(o, unitPrice);
      if (o.status !== 'Dibatalkan') {
        revenue += c.totalPembayaran;
        profit += c.totalKeuntungan;
        count++;
      }
    });
    return { revenue, profit, count };
  }, [orders, unitPrice]);

  // Data Fetching
  useEffect(() => {
    const unsub = subscribeOrders({
      q, status: statusFilter, fromInput: dateFrom, toInput: dateTo, limit: 250, sort: 'desc',
    }, (rows) => {
      const ex = rows.map(toExtended);
      const filtered = q ? ex.filter((o) => matchSearch(o, q)) : ex;
      setOrders(() => filtered);
      setSelectedIds((prev) => prev.filter((id) => filtered.some((x) => x.id === id)));
    });
    return () => unsub();
  }, [q, statusFilter, dateFrom, dateTo, setOrders]);

  function matchSearch(o: ExtendedOrder, query: string) {
    if (!query) return true;
    const s = query.trim().toLowerCase();
    return [o.no, o.namaBarang, o.namaPelanggan, o.catatan].some((field) => String(field ?? '').toLowerCase().includes(s));
  }

  // Handlers
  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus pesanan ini secara permanen?')) return;
    await deleteOrder(id);
  }
  
  const handleApplyFilters = (p: { status: string; from: string; to: string }) => {
    setStatusFilter(p.status); setDateFrom(p.from); setDateTo(p.to); setShowFilterModal(false);
  };

  const handleInvoiceClick = () => {
    if (selectedOrders.length === 0) { alert('Pilih minimal satu pesanan.'); return; }
    if (!sameCustomer) { alert('Invoice hanya bisa dibuat untuk pesanan dari pelanggan yang sama.'); return; }
    setShowInvoice({ show: true, order: selectedOrders[0], itemIds: selectedIds });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Manajemen Pesanan
            </h1>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setEditing(null); setShowForm(true); }} className="hidden sm:flex bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10">
                <IconPlus className="w-4 h-4 mr-2" /> Buat Pesanan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 3. Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <IconSearch />
            </div>
            <Input
              placeholder="Cari pelanggan, no resi, barang..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 border-0 bg-slate-50 focus:bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Button variant="outline" onClick={() => setShowFilterModal(true)} 
              className={`whitespace-nowrap ${filterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'text-slate-600'}`}>
              <IconFilter className="w-4 h-4 mr-2" /> Filter 
              {filterCount > 0 && <span className="ml-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{filterCount}</span>}
            </Button>
            
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="h-6 w-px bg-slate-300 mx-1"></div>
                <span className="text-sm font-medium text-slate-600 hidden md:inline">{selectedIds.length} dipilih</span>
                <Button onClick={handleInvoiceClick} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <IconInvoice className="w-4 h-4 mr-2" /> Invoice
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Desktop Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4 w-4">
                    <input type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={orders.length > 0 && selectedIds.length === orders.length} 
                      onChange={(e) => setSelectedIds(e.target.checked ? orders.map(o => o.id) : [])} 
                    />
                  </th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Detail Barang</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Tagihan</th>
                  <th className="px-6 py-4 text-right">Profit</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                   <tr>
                     <td colSpan={7} className="px-6 py-12 text-center">
                       <div className="flex flex-col items-center justify-center text-slate-400">
                         <div className="bg-slate-50 p-4 rounded-full mb-3"><IconBox className="w-8 h-8 opacity-50"/></div>
                         <p>Tidak ada pesanan ditemukan.</p>
                       </div>
                     </td>
                   </tr>
                ) : orders.map((o) => (
                  <ExpandableRow
                    key={o.id} order={o} unitPrice={unitPrice}
                    isExpanded={expandedRows.has(o.id)}
                    isSelected={selectedIds.includes(o.id)}
                    onToggleExpand={() => setExpandedRows(prev => { const n = new Set(prev); n.has(o.id) ? n.delete(o.id) : n.add(o.id); return n; })}
                    onToggleSelect={() => setSelectedIds(prev => prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id])}
                    onEdit={() => { setEditing(o); setShowForm(true); }}
                    onDelete={() => handleDelete(o.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Mobile Card View */}
        <div className="sm:hidden space-y-4">
          {orders.map((o) => (
            <MobileCard 
              key={o.id} order={o} unitPrice={unitPrice} isSelected={selectedIds.includes(o.id)}
              onToggleSelect={() => setSelectedIds(prev => prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id])}
              onEdit={() => { setEditing(o); setShowForm(true); }}
              onDelete={() => handleDelete(o.id)}
            />
          ))}
          {orders.length === 0 && <p className="text-center text-slate-500 py-10">Tidak ada data.</p>}
        </div>

      </div>

      {/* Modals */}
      {showForm && (
        <OrderFormModal 
          customers={customers} 
          initial={editing || undefined} 
          onClose={() => setShowForm(false)} 
          onSubmit={async (val) => { 
            const dto = fromExtended(val as any); 
            if (editing?.id) await updateOrder(editing.id, dto, unitPrice); 
            else await createOrder(dto, unitPrice); 
            setShowForm(false); 
          }} 
          existing={orders} 
          unitPrice={unitPrice} 
        />
      )}
      
      {showInvoice.show && showInvoice.order && (
        <InvoiceModal 
          order={showInvoice.order} 
          orders={orders} 
          itemIds={showInvoice.itemIds} 
          customer={customers.find((c) => c.nama === showInvoice.order!.namaPelanggan)} 
          onClose={() => setShowInvoice({ show: false })} 
          unitPrice={unitPrice} 
        />
      )}

      {showFilterModal && (
        <FilterModal 
          initial={{ status: statusFilter, from: dateFrom, to: dateTo }} 
          defaultRange={{ from: defaultFrom, to: defaultTo }} 
          onApply={handleApplyFilters} 
          onReset={() => { handleApplyFilters({status: '', from: defaultFrom, to: defaultTo}); }} 
          onClose={() => setShowFilterModal(false)} 
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="sm:hidden fixed bottom-20 right-6 h-14 w-14 bg-slate-900 text-white rounded-full shadow-xl shadow-slate-900/30 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <IconPlus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ===== ROW COMPONENTS =====

function ExpandableRow({ order, unitPrice, isExpanded, isSelected, onToggleExpand, onToggleSelect, onEdit, onDelete }: any) {
  const d = compute(order, unitPrice);
  
  return (
    <>
      <tr className={`group transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
        <td className="px-6 py-4 align-top">
          <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"/>
        </td>
        <td className="px-6 py-4 align-top">
          <div className="flex items-center gap-3">
            <Avatar name={order.namaPelanggan} />
            <div>
              <div className="font-semibold text-slate-800">{order.namaPelanggan}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">#{order.no}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 align-top">
          <div className="text-slate-700 font-medium line-clamp-1" title={order.namaBarang}>{order.namaBarang}</div>
          <div className="text-xs text-slate-400 mt-1 flex gap-2">
            <span>{formatAndAddYear(order.tanggal)}</span> &bull; <span>{d.kg} Kg</span>
          </div>
        </td>
        <td className="px-6 py-4 align-top"><StatusPill status={String(order.status)} /></td>
        <td className="px-6 py-4 align-top text-right font-medium text-slate-700">{formatCurrency(d.totalPembayaran, d.currency)}</td>
        <td className="px-6 py-4 align-top text-right font-medium text-emerald-600">{formatCurrency(d.totalKeuntungan, d.currency)}</td>
        <td className="px-6 py-4 align-top text-center">
          <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit"><IconEdit/></button>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus"><IconTrash/></button>
            <button onClick={onToggleExpand} className={`p-1.5 text-slate-400 hover:text-slate-700 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}><IconChevronDown/></button>
          </div>
        </td>
      </tr>
      
      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-slate-50/50 shadow-inner">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm pl-12 border-l-4 border-slate-200 ml-3">
              <div><span className="block text-xs text-slate-400 uppercase">Kategori</span><span className="font-medium">{order.kategori || '-'}</span></div>
              <div><span className="block text-xs text-slate-400 uppercase">Pengiriman</span><span className="font-medium">{order.pengiriman || '-'}</span></div>
              <div><span className="block text-xs text-slate-400 uppercase">Base Jastip</span><span className="font-medium text-slate-700">{formatCurrency(d.baseJastip, d.currency)}</span></div>
              <div><span className="block text-xs text-slate-400 uppercase">Markup Jastip</span><span className="font-medium text-emerald-600">+{formatCurrency(d.jastipMarkup, d.currency)}</span></div>
              <div><span className="block text-xs text-slate-400 uppercase">Base Ongkir</span><span className="font-medium text-slate-700">{formatCurrency(d.baseOngkir, d.currency)}</span></div>
              <div><span className="block text-xs text-slate-400 uppercase">Markup Ongkir</span><span className="font-medium text-emerald-600">+{formatCurrency(d.ongkirMarkup, d.currency)}</span></div>
              <div className="col-span-2"><span className="block text-xs text-slate-400 uppercase">Catatan</span><span className="italic text-slate-600">{order.catatan || 'Tidak ada catatan'}</span></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function MobileCard({ order, unitPrice, isSelected, onToggleSelect, onEdit, onDelete }: any) {
  const d = compute(order, unitPrice);
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
           <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="rounded w-5 h-5 border-slate-300 text-blue-600"/>
           <div>
             <div className="font-bold text-slate-800">{order.namaPelanggan}</div>
             <div className="text-xs text-slate-500">#{order.no} &bull; {formatAndAddYear(order.tanggal)}</div>
           </div>
        </div>
        <StatusPill status={order.status} />
      </div>
      
      <div className="py-3 border-y border-slate-50 mb-3 space-y-1">
        <div className="text-sm text-slate-800 font-medium">{order.namaBarang}</div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Tagihan</span>
          <span className="font-bold text-slate-900">{formatCurrency(d.totalPembayaran, d.currency)}</span>
        </div>
        <div className="flex justify-between text-xs">
           <span className="text-slate-400">Keuntungan</span>
           <span className="font-medium text-emerald-600">{formatCurrency(d.totalKeuntungan, d.currency)}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit} className="flex-1 text-xs h-9">Edit</Button>
        <Button variant="ghost" onClick={onDelete} className="text-red-600 text-xs h-9 hover:bg-red-50">Hapus</Button>
      </div>
    </div>
  );
}

// ===== FILTER MODAL =====
function FilterModal({ initial, defaultRange, onApply, onReset, onClose }: any) {
  const [localStatus, setLocalStatus] = useState(initial.status || '');
  const [localFrom, setLocalFrom] = useState(initial.from || defaultRange.from);
  const [localTo, setLocalTo] = useState(initial.to || defaultRange.to);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full sm:w-[450px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Filter Pesanan</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><IconChevronDown className="rotate-180 text-slate-600"/></button>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status Pesanan</label>
            <Select value={localStatus} onChange={(e: any) => setLocalStatus(e.target.value)} className="w-full">
              <option value="">Semua Status</option>
              {ORDER_STATUSES.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Dari</label>
               <Input type="date" value={localFrom} onChange={(e: any) => setLocalFrom(e.target.value)} />
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Sampai</label>
               <Input type="date" value={localTo} onChange={(e: any) => setLocalTo(e.target.value)} />
             </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button variant="ghost" onClick={onReset} className="flex-1 text-slate-500">Reset</Button>
          <Button onClick={() => onApply({ status: localStatus, from: localFrom, to: localTo })} className="flex-[2] bg-slate-900 text-white hover:bg-slate-800">
            Terapkan Filter
          </Button>
        </div>
      </div>
    </div>
  );
}