import React, { useMemo, useState } from 'react';
import { Customer, Order } from '../types';
import { formatIDR } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { OrderFormModal } from '../components/OrderFormModal';
import { InvoiceModal } from '../components/InvoiceModal';

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
  const [editing, setEditing] = useState<ExtendedOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showInvoice, setShowInvoice] = useState<{ show: boolean; order?: ExtendedOrder; itemIds?: string[] }>({ show: false });

  // ⬇️ Tambahan helper untuk validasi selection
  const selectedOrders = useMemo(
    () => orders.filter(o => selectedIds.includes(o.id)),
    [orders, selectedIds]
  );
  const sameCustomer =
    selectedOrders.length > 0 &&
    selectedOrders.every(o => o.namaPelanggan === selectedOrders[0]?.namaPelanggan);

  const hasUnpaid = selectedOrders.some(o => String(o.status) === 'Belum Membayar');

  // Hanya boleh bikin invoice jika: ada pilihan + pelanggan sama + tidak ada "Belum Membayar"
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

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const hit =
        (o.no ?? '').toLowerCase().includes(q.toLowerCase()) ||
        (o.namaBarang ?? '').toLowerCase().includes(q.toLowerCase()) ||
        (o.namaPelanggan ?? '').toLowerCase().includes(q.toLowerCase()) ||
        (o.kategori ?? '').toLowerCase().includes(q.toLowerCase()) ||
        (o.pengiriman ?? '').toLowerCase().includes(q.toLowerCase()) ||
        (o.catatan ?? '').toLowerCase().includes(q.toLowerCase());
      const statusOk = statusFilter ? String(o.status) === statusFilter : true;
      return hit && statusOk;
    });
  }, [orders, q, statusFilter]);

  function handleDelete(id: string) {
    if (!confirm('Hapus pesanan ini?')) return;
    setOrders((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Filter & Action */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Cari no/barang/pelanggan/kategori/pengiriman/catatan"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Semua Status</option>
            {['Belum Membayar', 'Pembayaran Selesai', 'Sedang Pengiriman', 'Sudah Diterima', 'Pending', 'Diproses', 'Selesai', 'Dibatalkan'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-orange-600 hover:bg-orange-700 text-white border border-orange-700/20"
          >
            + Tambah Pesanan
          </Button>
          <Button
            onClick={() => {
              if (selectedOrders.length === 0) return;

              if (!sameCustomer) {
                alert('Silakan pilih pesanan dari pelanggan yang sama.');
                return;
              }
              if (hasUnpaid) {
                alert('Tidak bisa membuka/membuat invoice untuk pesanan dengan status "Belum Membayar".');
                return;
              }

              setShowInvoice({ show: true, order: selectedOrders[0], itemIds: selectedIds });
            }}
            disabled={!canCreateInvoice}
            className={`bg-[#0a2342] hover:bg-[#081a31] text-white border border-[#0a2342]/20 ${!canCreateInvoice ? 'opacity-60 cursor-not-allowed' : ''
              }`}
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
                  checked={filtered.length > 0 && filtered.every(o => selectedIds.includes(o.id))}
                  onChange={(e) => {
                    const ids = filtered.map(o => o.id);
                    if (e.target.checked) {
                      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
                    } else {
                      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                    }
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
            {filtered.map((o) => {
              const d = compute(o);
              return (
                <tr key={o.id} className="odd:bg-white even:bg-orange-50 hover:bg-orange-100/60 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(o.id)}
                      onChange={(e) => {
                        setSelectedIds(prev => e.target.checked ? [...prev, o.id] : prev.filter(id => id !== o.id));
                      }}
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
                  <td className="px-4 py-3">
                    <StatusPill status={String(o.status) || 'Belum Membayar'} />
                  </td>
                  <td className="px-4 py-3 w-[320px]">
                    <div className="truncate" title={o.catatan ?? ''}>{o.catatan ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button variant="ghost" className="text-[#0a2342] hover:bg-[#0a2342]/5" onClick={() => { setEditing(o); setShowForm(true); }}>Edit</Button>
                      {/* HAPUS tombol Invoice per baris */}
                      <Button variant="danger" onClick={() => handleDelete(o.id)}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-neutral-500" colSpan={16}>Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map((o) => {
          const d = compute(o);
          return (
            <Card key={o.id} className="p-4 border border-[#0a2342]/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(o.id)}
                    onChange={(e) => {
                      setSelectedIds(prev => e.target.checked ? [...prev, o.id] : prev.filter(id => id !== o.id));
                    }}
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
                {/* HAPUS tombol Invoice di sini */}
                <Button variant="danger" onClick={() => handleDelete(o.id)}>Hapus</Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-sm text-neutral-500">Tidak ada data.</p>}
      </div>

      {showForm && (
        <OrderFormModal
          customers={customers}
          initial={editing || undefined}
          onClose={() => setShowForm(false)}
          onSubmit={(val) => {
            setOrders((prev) => {
              if (editing) return prev.map((p) => (p.id === editing.id ? (val as ExtendedOrder) : p));
              return [val as ExtendedOrder, ...prev];
            });
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
          itemIds={showInvoice.itemIds}  // ⬅️ penting
          customer={customers.find((c) => c.nama === showInvoice.order!.namaPelanggan)}
          onClose={() => setShowInvoice({ show: false })}
          unitPrice={unitPrice}
        />
      )}


    </div>
  );
}
