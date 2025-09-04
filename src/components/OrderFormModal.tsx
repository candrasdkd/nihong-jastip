import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Customer, Order, OrderStatus } from '../types';
import { computeTotal, genOrderNo, todayStr } from '../utils/helpers';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { formatIDR } from '../utils/format';
import SearchableSelect from './ui/SearchableSelect';
import { Select } from './ui/Select';

const STATUS_BARU = ['Belum Membayar', 'Pembayaran Selesai', 'Sedang Pengiriman', 'Sudah Diterima'] as const;
const STATUS_LAMA: OrderStatus[] = ['Pending', 'Diproses', 'Selesai', 'Dibatalkan'];
const ALL_STATUSES = [...STATUS_BARU, ...STATUS_LAMA] as readonly string[];
type Option = { label: string; value: string };
const toStr = (v: number) => (Number.isFinite(v) ? String(v) : '');
const num = (v: any) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

export function OrderFormModal({
  customers, initial, onClose, onSubmit, existing, unitPrice,
}: {
  customers: Customer[];
  initial?: Order;
  onClose: () => void;
  onSubmit: (order: Order) => void;
  existing: Order[];
  unitPrice: number;
}) {
  console.log('OrderFormModal', initial);

  // Basic
  const [no] = useState(initial?.no || genOrderNo(existing));
  const [namaBarang, setNamaBarang] = useState(initial?.namaBarang || '');
  const [kategori, setKategori] = useState(initial?.kategori || 'Makanan');
  const [tanggal, setTanggal] = useState(initial?.tanggal || todayStr());
  const [namaPelanggan, setNamaPelanggan] = useState(initial?.namaPelanggan || (customers[0]?.nama || ''));
  const [jumlahKg, setJumlahKg] = useState<number>(initial?.jumlahKg || 1);

  // New fields
  const [pengiriman, setPengiriman] = useState<string>((initial as any)?.pengiriman || 'INDO - JPG');
  const [catatan, setCatatan] = useState<string>((initial as any)?.catatan || '');

  const initialHasManualJastip = typeof (initial as any)?.hargaJastip === 'number';
  const [useAutoJastip, setUseAutoJastip] = useState<boolean>(!initialHasManualJastip);
  const [hargaJastipManual, setHargaJastipManual] = useState<number>(Number((initial as any)?.hargaJastipManual ?? 0));
  const [hargaJastipMarkup, setHargaJastipMarkup] = useState<number>(Number((initial as any)?.hargaJastipMarkup ?? 0));
  const [hargaOngkir, setHargaOngkir] = useState<number>((initial as any)?.hargaOngkir ?? computeTotal(jumlahKg, unitPrice));
  const [hargaOngkirMarkup, setHargaOngkirMarkup] = useState<number>(Number((initial as any)?.hargaOngkirMarkup ?? 0));
  const [status, setStatus] = useState<string>((initial?.status as any) || 'Belum Membayar');

  const baseOngkir = useMemo(
    () => (useAutoJastip ? computeTotal(jumlahKg, unitPrice) : (Number(hargaOngkir) || 0)),
    [useAutoJastip, hargaOngkir, jumlahKg, unitPrice]
  );
  const ceilKg = useMemo(() => Math.ceil(Number(jumlahKg || 0)), [jumlahKg]);
  const totalPembayaran = useMemo(
    () => (Number(hargaJastipManual) || 0) + (Number(baseOngkir) || 0),
    [hargaJastipManual, baseOngkir]
  );
  const totalKeuntungan = useMemo(
    () => ((Number(hargaJastipMarkup) || 0) + (Number(hargaOngkirMarkup) || 0) - (Number(hargaJastipManual) || 0) - (Number(baseOngkir) || 0)),
    [hargaJastipMarkup, hargaOngkirMarkup, hargaJastipManual, baseOngkir]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      id: initial?.id || crypto.randomUUID(),
      no, namaBarang, kategori, tanggal, namaPelanggan,
      jumlahKg: num(jumlahKg),
      totalHarga: baseOngkir, // legacy
      status,
      pengiriman: pengiriman || '',
      catatan: catatan || '',
      hargaJastip: num(hargaJastipManual),
      hargaJastipMarkup: num(hargaJastipMarkup),
      hargaOngkir: num(baseOngkir),
      hargaOngkirMarkup: num(hargaOngkirMarkup),
      _computed: { ceilKg, totalPembayaran, totalKeuntungan, unitPriceAtSave: unitPrice, useAutoJastip },
    };
    onSubmit(payload as Order);
  }

  const customerOptions: Option[] = useMemo(
    () => customers.map(c => ({ label: c.nama, value: c.nama })),
    [customers]
  );

  return (
    <Modal onClose={onClose} title={initial ? 'Edit Pesanan' : 'Tambah Pesanan'} size="5xl" contentClassName="w-full">
      <div className="max-h-[60vh] overflow-y-auto p-2">
        <form id="order-form" onSubmit={submit} className="grid grid-cols-1 gap-6">
          {/* ===== Info Pesanan ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* No Pesanan: otomatis & disabled */}
            <Input
              label="No Pesanan"
              value={no}
              onChange={() => { }}
              required
              disabled
              title="No pesanan dibuat otomatis dan tidak bisa diubah"
              className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500 opacity-80 cursor-not-allowed"
            />

            <Input
              label="Nama Barang"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              required
              className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />

            {/* Kategori */}
            <div className="lg:col-span-1">
              <label className="block mb-1 text-sm text-neutral-600">Kategori</label>
              <Select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {['Makanan', 'Minuman', 'Kecantikan', 'Elektronik', 'Lainnya'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </Select>
            </div>

            <Input
              label="Tanggal Pemesanan"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
              className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />

            {/* Nama Pelanggan: searchable di dalam dropdown */}
            <SearchableSelect
              label="Nama Pelanggan"
              value={namaPelanggan}
              onChange={setNamaPelanggan}
              options={customerOptions}
              className=""
            />

            <div>
              <Input
                label="Berat (Kg)"
                type="number"
                step="0.01"
                min={0}
                value={toStr(jumlahKg)}
                onChange={(e) => setJumlahKg(num(e.target.value))}
                required
                className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="mt-1 text-xs text-neutral-500">* Pembulatan ke atas (ceil).</p>
            </div>

            <Input
              label="Lokasi Pengiriman"
              value={pengiriman}
              onChange={(e) => setPengiriman(e.target.value)}
              className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500 lg:col-span-2"
            />

            <div className="lg:col-span-1">
              <label className="block mb-1 text-sm text-neutral-600">Status</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>

          {/* ===== Harga & Ongkir ===== */}
          <div className="rounded-2xl border border-[#0a2342]/15 p-4 bg-white/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label className="block text-sm text-neutral-700 font-medium">Harga Jastip (base)</label>
                <p className="text-xs text-neutral-500">
                  {useAutoJastip ? <>Otomatis: ceil({jumlahKg || 0} kg) × {formatIDR(unitPrice)}</> : <>Manual: masukkan nominal sendiri</>}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={useAutoJastip} onChange={(e) => setUseAutoJastip(e.target.checked)} />
                Gunakan perhitungan otomatis
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <Input
                  label="Harga Jastip (base)"
                  type="number"
                  min={0}
                  step="1"
                  value={toStr(hargaJastipManual)}
                  onChange={(e) => setHargaJastipManual(num(e.target.value))}
                  className={`focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${useAutoJastip ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                <p className="mt-1 text-xs text-neutral-500">{useAutoJastip ? 'Terkunci (otomatis)' : 'Bisa diubah (manual)'}</p>
              </div>

              <Input label="Jastip Markup" type="number" min={0} step="1" value={toStr(hargaJastipMarkup)} onChange={(e) => setHargaJastipMarkup(num(e.target.value))} className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
              <Input label="Harga Ongkir (base)" type="number" min={0} step="1" value={toStr(useAutoJastip ? baseOngkir : hargaOngkir)} disabled={useAutoJastip} onChange={(e) => setHargaOngkir(num(e.target.value))} className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
              <Input label="Ongkir Markup" type="number" min={0} step="1" value={toStr(hargaOngkirMarkup)} onChange={(e) => setHargaOngkirMarkup(num(e.target.value))} className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-sm text-neutral-600">Total Pembayaran</label>
                <div className="px-3 py-2 rounded-xl border border-[#0a2342]/20 bg-white font-semibold text-[#0a2342]">
                  {formatIDR(totalPembayaran)}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm text-neutral-600">Total Keuntungan</label>
                <div className="px-3 py-2 rounded-xl border border-[#0a2342]/20 bg-white font-semibold text-[#0a2342]">
                  {formatIDR(totalKeuntungan)}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm text-neutral-600">Detail Perhitungan</label>
                <div className="px-3 py-2 rounded-xl border border-[#0a2342]/10 bg-orange-50 text-sm">
                  ceil({jumlahKg || 0}) = <b>{ceilKg}</b> • Jastip base: <b>{formatIDR(baseOngkir)}</b> • J+M: <b>{formatIDR(Number(hargaJastipMarkup) || 0)}</b> • O+M: <b>{formatIDR((Number(hargaOngkir) || 0) + (Number(hargaOngkirMarkup) || 0))}</b>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Catatan ===== */}
          <div>
            <label className="block mb-1 text-sm text-neutral-600">Catatan</label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#0a2342]/20 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Catatan khusus (opsional)"
            />
          </div>
        </form>
      </div>

      {/* ===== Aksi ===== */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onClose} className="text-[#0a2342] hover:bg-[#0a2342]/5">Batal</Button>
        <Button type="submit" form="order-form" className="bg-orange-600 hover:bg-orange-700 text-white">Simpan</Button>
      </div>
    </Modal>
  );
}
