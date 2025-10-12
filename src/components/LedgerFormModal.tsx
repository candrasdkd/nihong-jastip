import { useEffect, useRef, useState } from 'react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { LedgerEntry, LedgerUpsert } from '../services/ledgerFirebase';
import { RupiahInput } from './ui/RupiahInput';

const NAVY = '#0a2342';

export function LedgerFormModal({
    initial,
    onClose,
    onSubmit,
}: {
    initial?: LedgerEntry;
    onClose: () => void;
    onSubmit: (val: LedgerUpsert) => Promise<void> | void;
}) {
    const [tanggal, setTanggal] = useState<string>(initial?.tanggal || '');
    const [tipe, setTipe] = useState<'Masuk' | 'Keluar'>(initial?.tipe || 'Masuk');
    const [kategori, setKategori] = useState<string>(initial?.kategori || '');
    const [keterangan, setKeterangan] = useState<string>(initial?.keterangan || '');
    const [metode, setMetode] = useState<string>(initial?.metode || '');
    const [jumlah, setJumlah] = useState<number>(initial?.jumlah || 0);
    const [catatan, setCatatan] = useState<string>(initial?.catatan || '');
    const [submitting, setSubmitting] = useState(false);

    const panelRef = useRef<HTMLDivElement>(null);
    const isSmall = typeof window !== 'undefined' ? window.innerWidth < 768 : true; // < md

    // Lock scroll di body saat modal terbuka
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // ESC to close
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Klik di luar panel untuk close (hindari ganggu saat scroll di mobile)
    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (!panelRef.current) return;
            const target = e.target as Node;
            if (!panelRef.current.contains(target)) onClose();
        }
        // Di mobile, kadang scroll bisa terdeteksi sebagai click; batasi ke desktop saja
        if (!isSmall) {
            document.addEventListener('mousedown', onDown);
            return () => document.removeEventListener('mousedown', onDown);
        }
    }, [onClose, isSmall]);

    async function handleSubmit() {
        if (!tanggal) { alert('Tanggal wajib diisi'); return; }
        if (!jumlah || isNaN(Number(jumlah))) { alert('Jumlah tidak valid'); return; }
        setSubmitting(true);
        try {
            const val: LedgerUpsert = {
                tanggal,
                tipe,
                kategori: kategori || null,
                keterangan: keterangan || null,
                metode: metode || null,
                jumlah: Number(jumlah),
                catatan: catatan || null,
                createdAt: initial?.createdAt ?? Date.now(),
            };
            await onSubmit(val);
            onClose();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Panel — mobile: bottom sheet penuh, desktop: dialog tengah */}
            <div
                ref={panelRef}
                className="
          relative w-full md:w-[560px] max-w-full md:max-w-[90vw]
          rounded-t-2xl md:rounded-2xl bg-white shadow-xl ring-1 ring-[#0a2342]/10
          h-[92vh] md:h-auto max-h-[92vh]
          flex flex-col
        "
            >
                {/* Header sticky */}
                <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 md:px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div className="text-base md:text-lg font-semibold" style={{ color: NAVY }}>
                            {initial ? 'Edit Transaksi' : 'Tambah Transaksi'}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-sm text-neutral-500 hover:text-neutral-700"
                            aria-label="Tutup"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body scrollable */}
                <div className="px-4 md:px-5 py-4 overflow-y-auto">
                    {/* Pakai md untuk 2 kolom agar HP kecil tidak kepotong */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs text-neutral-600 mb-1">Tanggal</div>
                            <Input
                                type="date"
                                value={tanggal}
                                onChange={e => setTanggal((e.target as HTMLInputElement).value)}
                                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <Select
                                label='Tipe'
                                value={tipe}
                                onChange={e => setTipe((e.target as HTMLSelectElement).value as 'Masuk' | 'Keluar')}
                                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="Masuk">Masuk</option>
                                <option value="Keluar">Keluar</option>
                            </Select>
                        </div>

                        <div>
                            <Select
                                label='Kategori'
                                value={kategori}
                                onChange={e => setKategori((e.target as HTMLSelectElement).value)}
                                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="Penjualan">Penjualan</option>
                                <option value="Operasional">Operasional</option>
                                <option value="Investasi">Investasi</option>
                                <option value="Lainnya">Lainnya</option>
                            </Select>
                        </div>

                        <div>
                            <Select
                                label='Metode Pembayaran'
                                value={metode}
                                onChange={e => setMetode((e.target as HTMLSelectElement).value)}
                                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Transfer">Transfer</option>
                                <option value="E-Wallet">E-Wallet</option>
                            </Select>
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                label='Keterangan'
                                value={keterangan}
                                onChange={e => setKeterangan((e.target as HTMLInputElement).value)}
                                placeholder="Deskripsi singkat"
                                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <RupiahInput
                                label="Jumlah"
                                value={jumlah}
                                onChange={setJumlah}
                                className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <Input
                                label='Catatan'
                                value={catatan}
                                onChange={e => setCatatan((e.target as HTMLInputElement).value)}
                                placeholder="Opsional"
                                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer sticky */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-neutral-200 px-4 md:px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-[#0a2342] hover:bg-[#0a2342]/5"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-[#0a2342] hover:bg-[#081a31] text-white border border-[#0a2342]/20"
                        >
                            {submitting ? 'Menyimpan…' : (initial ? 'Simpan Perubahan' : 'Tambah')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
