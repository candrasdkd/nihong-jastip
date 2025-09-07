import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Customer, Order } from '../types';
import { formatIDR } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { OrderFormModal } from '../components/OrderFormModal';
import { InvoiceModal } from '../components/InvoiceModal';
import {
  createOrder,
  deleteOrder,
  fromExtended,
  subscribeOrders,
  toExtended,
  updateOrder,
} from '../services/ordersFirebase';

const NAVY = '#0a2342';
const NAVY_DARK = '#081a31';

type ExtendedOrder = Order & Partial<{
  pengiriman: string;
  catatan: string;
  hargaJastip: number;
  hargaJastipMarkup: number;
  hargaOngkir: number;
  hargaOngkirMarkup: number;
}>;

// util default range: start = awal bulan 2 bulan lalu; end = akhir bulan ini
function toInputDate(d: Date) {
  // yyyy-MM-dd
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 10);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Belum Membayar': 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    'Pembayaran Selesai': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    'Sedang Pengiriman': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    'Sudah Diterima': 'bg-[#0a2342]/10 text-[#0a2342] ring-1 ring-[#0a2342]/20',
    Pending: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    Diproses: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
    Selesai: 'bg-[#0a2342]/10 text-[#0a2342] ring-1 ring-[#0a2342]/20',
    Dibatalkan: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  };
  const cls = map[status] || 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200';
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

export function OrdersPage({
  orders,
  setOrders,
  customers,
  unitPrice,
}: {
  orders: ExtendedOrder[];
  setOrders: (updater: (prev: ExtendedOrder[]) => ExtendedOrder[]) => void;
  customers: Customer[];
  unitPrice: number;
}) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | ''>('');

  // DEFAULT: 2 bulan lalu (awal bulan) → bulan ini (akhir bulan)
  const now = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => {
    const m2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return toInputDate(startOfMonth(m2));
  }, [now]);
  const defaultTo = useMemo(() => toInputDate(endOfMonth(now)), [now]);

  const [dateFrom, setDateFrom] = useState<string>(defaultFrom);
  const [dateTo, setDateTo] = useState<string>(defaultTo);

  const [editing, setEditing] = useState<ExtendedOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showInvoice, setShowInvoice] = useState<{ show: boolean; order?: ExtendedOrder; itemIds?: string[] }>({ show: false });

  const selectedOrders = useMemo(() => orders.filter(o => selectedIds.includes(o.id)), [orders, selectedIds]);
  const sameCustomer = selectedOrders.length > 0 && selectedOrders.every(o => o.namaPelanggan === selectedOrders[0]?.namaPelanggan);
  const hasUnpaid = selectedOrders.some(o => String(o.status) === 'Belum Membayar');
  const canCreateInvoice = selectedOrders.length > 0 && sameCustomer && !hasUnpaid;

  function compute(o: ExtendedOrder) {
    const kg = Math.ceil(Number(o.jumlahKg ?? 0));
    const baseOngkir = typeof o.hargaOngkir === 'number' ? o.hargaOngkir : kg * unitPrice;
    const jastipMarkup = Number(o.hargaJastipMarkup ?? 0);
    const baseJastip = Number(o.hargaJastip ?? 0);
    const ongkirMarkup = Number(o.hargaOngkirMarkup ?? 0);
    const totalPembayaran = baseJastip + baseOngkir;
    const totalKeuntungan = (jastipMarkup + ongkirMarkup) - (baseOngkir + baseJastip);
    return { kg, baseJastip, jastipMarkup, baseOngkir, ongkirMarkup, totalPembayaran, totalKeuntungan };
  }

  // 🔄 Subscribe ke Firestore berdasarkan: q, status, dateFrom, dateTo, sort desc
  useEffect(() => {
    const unsub = subscribeOrders(
      {
        q,
        status: statusFilter || undefined,
        fromInput: dateFrom || undefined,
        toInput: dateTo || undefined,
        limit: 250, // atur sesuai kebutuhan
        sort: 'desc',
      },
      (rows) => {
        setOrders(() => rows.map(toExtended));
        // bersihkan pilihan yang sudah tidak ada
        setSelectedIds(prev => prev.filter(id => rows.some(x => x.id === id)));
      }
    );
    return () => unsub();
  }, [q, statusFilter, dateFrom, dateTo, setOrders]);

  async function handleDelete(id: string) {
    if (!confirm('Hapus pesanan ini?')) return;
    await deleteOrder(id);
  }

  // ======== Filter Modal ========
  const [showFilter, setShowFilter] = useState(false);
  const filterCount = useMemo(() => {
    let n = 0;
    if (statusFilter) n++;
    if (dateFrom !== defaultFrom) n++;
    if (dateTo !== defaultTo) n++;
    return n;
  }, [statusFilter, dateFrom, dateTo, defaultFrom, defaultTo]);

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

  return (
    <div className="space-y-4">
      {/* Filter & Action */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        {/* Kiri: Search + Filter btn */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          <Input
            placeholder="Cari token (no/barang/pelanggan/kategori/pengiriman/catatan)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-grow min-w-[220px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />

          <Button
            variant="ghost"
            onClick={() => setShowFilter(true)}
            className="!bg-white !text-[#0a2342] !border !border-[#0a2342]/20 ring-1 ring-[#0a2342]/10 hover:!bg-orange-50 dark:!text-[#0a2342] [&_*]:!text-[#0a2342]"
            title="Filter status & tanggal"
          >
            <span className="!text-[#0a2342]">Filter</span>
            {filterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200">
                {filterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Kanan: Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-orange-600 hover:bg-orange-700 text-white border border-orange-700/20"
          >
            + Tambah Pesanan
          </Button>
          <Button
            onClick={() => {
              if (selectedOrders.length === 0) return;
              if (!sameCustomer) { alert('Silakan pilih pesanan dari pelanggan yang sama.'); return; }
              // if (hasUnpaid) { alert('Tidak bisa membuka/membuat invoice untuk pesanan dengan status "Belum Membayar".'); return; }
              setShowInvoice({ show: true, order: selectedOrders[0], itemIds: selectedIds });
            }}
            // disabled={!canCreateInvoice}
            className={`bg-[#0a2342] hover:bg-[#081a31] text-white border border-[#0a2342]/20`}
          >
            Buat Invoice {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="overflow-x-auto hidden sm:block border ring-1 ring-[#0a2342]/10">
        <table className="min-w-[1400px] text-sm table-auto">
          <thead className="sticky top-0" style={{ backgroundColor: NAVY }}>
            <tr className="text-left text-white">
              <th className="px-4 py-3 font-semibold border-b border-white/10">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && orders.every(o => selectedIds.includes(o.id))}
                  onChange={(e) => {
                    const ids = orders.map(o => o.id);
                    if (e.target.checked) setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
                    else setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                  }}
                />
              </th>
              {[
                'No', 'Tanggal', 'Pengiriman', 'Nama Barang', 'Kategori', 'Nama Pelanggan',
                'Berat (Kg, ceil)', 'Harga Jastip', 'Jastip Markup', 'Harga Ongkir', 'Ongkir Markup',
                'Total Pembayaran', 'Total Keuntungan', 'Status', 'Catatan', 'Aksi',
              ].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold border-b border-white/10 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => {
              const d = compute(o);
              return (
                <tr key={o.id} className="odd:bg-white even:bg-orange-50 hover:bg-orange-100/60 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(o.id)}
                      onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, o.id] : prev.filter(id => id !== o.id))}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{o.no}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{o.tanggal}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{o.pengiriman ?? '-'}</td>
                  <td className="px-4 py-3">{o.namaBarang}</td>
                  <td className="px-4 py-3">{o.kategori}</td>
                  <td className="px-4 py-3">{o.namaPelanggan}</td>
                  <td className="px-4 py-3 text-right">{d.kg}</td>
                  <td className="px-4 py-3 text-right">{formatIDR(d.baseJastip)}</td>
                  <td className="px-4 py-3 text-right">{formatIDR(d.jastipMarkup)}</td>
                  <td className="px-4 py-3 text-right">{formatIDR(d.baseOngkir)}</td>
                  <td className="px-4 py-3 text-right">{formatIDR(d.ongkirMarkup)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatIDR(d.totalPembayaran)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatIDR(d.totalKeuntungan)}</td>
                  <td className="px-4 py-3"><StatusPill status={String(o.status) || 'Belum Membayar'} /></td>
                  <td className="px-4 py-3 w-[320px]"><div className="truncate" title={o.catatan ?? ''}>{o.catatan ?? '-'}</div></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button variant="ghost" className="text-[#0a2342] hover:bg-[#0a2342]/5" onClick={() => { setEditing(o); setShowForm(true); }}>Edit</Button>
                      <Button variant="danger" onClick={() => handleDelete(o.id)}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-neutral-500" colSpan={16}>Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {orders.map((o) => {
          const d = compute(o);
          return (
            <Card key={o.id} className="p-4 border border-[#0a2342]/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(o.id)}
                    onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, o.id] : prev.filter(id => id !== o.id))}
                  />
                  <div>
                    <div className="text-xs text-neutral-500">No</div>
                    <div className="font-semibold">{o.no}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500">Total Pembayaran</div>
                  <div className="font-semibold">{formatIDR(d.totalPembayaran)}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><div className="text-neutral-500 text-xs">Tanggal</div><div>{o.tanggal}</div></div>
                <div><div className="text-neutral-500 text-xs">Pengiriman</div><div>{o.pengiriman ?? '-'}</div></div>
                <div><div className="text-neutral-500 text-xs">Barang</div><div className="font-medium">{o.namaBarang}</div></div>
                <div><div className="text-neutral-500 text-xs">Kategori</div><div>{o.kategori}</div></div>
                <div><div className="text-neutral-500 text-xs">Pelanggan</div><div>{o.namaPelanggan}</div></div>
                <div><div className="text-neutral-500 text-xs">Kg (ceil)</div><div>{d.kg}</div></div>
                <div><div className="text-neutral-500 text-xs">Harga Jastip</div><div>{formatIDR(d.baseJastip)}</div></div>
                <div><div className="text-neutral-500 text-xs">Jastip Markup</div><div>{formatIDR(d.jastipMarkup)}</div></div>
                <div><div className="text-neutral-500 text-xs">Harga Ongkir</div><div>{formatIDR(d.baseOngkir)}</div></div>
                <div><div className="text-neutral-500 text-xs">Ongkir Markup</div><div>{formatIDR(d.ongkirMarkup)}</div></div>
                <div className="col-span-2"><div className="text-neutral-500 text-xs">Status</div><div><StatusPill status={String(o.status) || 'Belum Membayar'} /></div></div>
                <div className="col-span-2"><div className="text-neutral-500 text-xs">Catatan</div><div>{o.catatan ?? '-'}</div></div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" className="text-[#0a2342] hover:bg-[#0a2342]/5" onClick={() => { setEditing(o); setShowForm(true); }}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(o.id)}>Hapus</Button>
              </div>
            </Card>
          );
        })}
        {orders.length === 0 && <p className="text-center text-sm text-neutral-500">Tidak ada data.</p>}
      </div>

      {showForm && (
        <OrderFormModal
          customers={customers.length > 0 ? customers : []}
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

      {showFilter && (
        <FilterModal
          initial={{ status: statusFilter, from: dateFrom, to: dateTo }}
          defaultRange={{ from: defaultFrom, to: defaultTo }}
          onApply={handleApplyFilters}
          onReset={() => { handleResetFilters(); setShowFilter(false); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}

/** Modal responsif untuk Status + Range Tanggal (dengan state lokal & Apply/Cancel) */
function FilterModal({
  initial,
  defaultRange,
  onApply,
  onReset,
  onClose,
}: {
  initial: { status: string; from: string; to: string };
  defaultRange: { from: string; to: string };
  onApply: (payload: { status: string; from: string; to: string }) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [localStatus, setLocalStatus] = useState<string>(initial.status || '');
  const [localFrom, setLocalFrom] = useState<string>(initial.from || defaultRange.from);
  const [localTo, setLocalTo] = useState<string>(initial.to || defaultRange.to);

  const panelRef = useRef<HTMLDivElement>(null);

  // Lock scroll saat modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Klik di luar panel untuk close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full sm:w-[420px] max-w-full sm:max-w-[90vw] rounded-t-2xl sm:rounded-2xl bg-white shadow-xl ring-1 ring-[#0a2342]/10 p-4 sm:p-5 translate-y-0 sm:translate-y-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-base sm:text-lg font-semibold text-[color:var(--navy,#0a2342)]">Filter</div>
          <button
            onClick={onClose}
            className="text-sm text-neutral-500 hover:text-neutral-700"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <div>
            <div className="text-xs text-neutral-600 mb-1">Status</div>
            <Select
              value={localStatus}
              onChange={(e) => setLocalStatus((e.target as HTMLSelectElement).value)}
              className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Semua Status</option>
              {['Belum Membayar', 'Pembayaran Selesai', 'Sedang Pengiriman', 'Sudah Diterima', 'Pending', 'Diproses', 'Selesai', 'Dibatalkan']
                .map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-neutral-600 mb-1">Dari</div>
              <Input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom((e.target as HTMLInputElement).value)}
                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                aria-label="Tanggal dari"
              />
            </div>
            <div>
              <div className="text-xs text-neutral-600 mb-1">Sampai</div>
              <Input
                type="date"
                value={localTo}
                onChange={(e) => setLocalTo((e.target as HTMLInputElement).value)}
                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                aria-label="Tanggal sampai"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-5 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={onReset}
            className="text-[#0a2342] hover:bg-[#0a2342]/5"
            title="Reset filter"
          >
            Reset
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-[#0a2342] hover:bg-[#0a2342]/5"
            >
              Batal
            </Button>
            <Button
              onClick={() => onApply({ status: localStatus, from: localFrom, to: localTo })}
              className="bg-[#0a2342] hover:bg-[#081a31] text-white border border-[#0a2342]/20"
            >
              Terapkan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
