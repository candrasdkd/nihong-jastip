// src/components/LedgerFormModal.tsx

import { useEffect, useRef, useState } from 'react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { LedgerEntry, LedgerUpsert } from '../services/ledgerFirebase';
import { RupiahInput } from './ui/RupiahInput';
import { calculateProfitFromOrders } from '../services/ordersReport';
import { formatIDR } from '../utils/format';

const NAVY = '#0a2342';

// BARU: Helper kecil untuk memformat tanggal
function formatReadableDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Atasi masalah timezone
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}


export function LedgerFormModal({
    initial,
    onClose,
    onSubmit,
}: {
    initial?: LedgerEntry;
    onClose: () => void;
    onSubmit: (val: LedgerUpsert) => Promise<void> | void;
}) {
    // State form yang sudah ada
    const [tanggal, setTanggal] = useState<string>(initial?.tanggal || '');
    const [tipe, setTipe] = useState<'Masuk' | 'Keluar'>(initial?.tipe || 'Masuk');
    const [kategori, setKategori] = useState<string>(initial?.kategori || '');
    const [keterangan, setKeterangan] = useState<string>(initial?.keterangan || '');
    const [metode, setMetode] = useState<string>(initial?.metode || '');
    const [jumlah, setJumlah] = useState<number>(initial?.jumlah || 0);
    const [catatan, setCatatan] = useState<string>(initial?.catatan || '');
    const [submitting, setSubmitting] = useState(false);

    // State untuk kalkulasi keuntungan
    const [profitCalcFrom, setProfitCalcFrom] = useState('');
    const [profitCalcTo, setProfitCalcTo] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);

    const isMonthlyProfitCategory = tipe === 'Masuk' && kategori === 'Keuntungan Bulanan';

    const panelRef = useRef<HTMLDivElement>(null);
    const isSmall = typeof window !== 'undefined' ? window.innerWidth < 768 : true;

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (!panelRef.current) return;
            const target = e.target as Node;
            if (!panelRef.current.contains(target)) onClose();
        }
        if (!isSmall) {
            document.addEventListener('mousedown', onDown);
            return () => document.removeEventListener('mousedown', onDown);
        }
    }, [onClose, isSmall]);

    // MODIFIKASI: Fungsi kalkulasi sekarang juga mengisi keterangan
    async function handleCalculateProfit() {
        if (!profitCalcFrom || !profitCalcTo) {
            alert('Silakan pilih rentang tanggal kalkulasi terlebih dahulu.');
            return;
        }
        setIsCalculating(true);
        try {
            const profit = await calculateProfitFromOrders(profitCalcFrom, profitCalcTo);

            // 1. Set jumlah keuntungan
            setJumlah(profit);

            // 2. BARU: Buat dan set keterangan dinamis
            const formattedFrom = formatReadableDate(profitCalcFrom);
            const formattedTo = formatReadableDate(profitCalcTo);
            setKeterangan(`Laba bersih periode ${formattedFrom} - ${formattedTo}`);

            alert(`Keuntungan berhasil dihitung: ${formatIDR(profit)}`);
        } catch (error) {
            console.error("Gagal menghitung keuntungan:", error);
            alert("Terjadi kesalahan saat menghitung keuntungan. Periksa konsol untuk detail.");
        } finally {
            setIsCalculating(false);
        }
    }


    async function handleSubmit() {
        if (!tanggal) { alert('Tanggal wajib diisi'); return; }
        // MODIFIKASI: Keterangan sekarang juga wajib jika itu keuntungan bulanan
        if (isMonthlyProfitCategory && !keterangan) {
            alert('Keterangan wajib diisi. Silakan hitung keuntungan terlebih dahulu.');
            return;
        }
        if (jumlah === 0 || isNaN(Number(jumlah))) {
            alert('Jumlah tidak valid atau nol. Jika ini adalah keuntungan bulanan, pastikan Anda sudah menghitungnya.');
            return;
        }

        setSubmitting(true);
        try {
            const val: LedgerUpsert = {
                tanggal, tipe,
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
        <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" />
            <div ref={panelRef} className="relative w-full md:w-[560px] max-w-full md:max-w-[90vw] rounded-t-2xl md:rounded-2xl bg-white shadow-xl ring-1 ring-[#0a2342]/10 h-[92vh] md:h-auto max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 md:px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div className="text-base md:text-lg font-semibold" style={{ color: NAVY }}>
                            {initial ? 'Edit Transaksi' : 'Tambah Transaksi'}
                        </div>
                        <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-700" aria-label="Tutup">✕</button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-4 md:px-5 py-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs text-neutral-600 mb-1">Tanggal Transaksi</div>
                            <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                        </div>

                        <div>
                            <Select label='Tipe' value={tipe} onChange={e => setTipe(e.target.value as 'Masuk' | 'Keluar')} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                                <option value="">-- Pilih Tipe --</option>
                                <option value="Masuk">Masuk</option>
                                <option value="Keluar">Keluar</option>
                            </Select>
                        </div>

                        <div>
                            <Select label='Kategori' value={kategori} onChange={e => setKategori(e.target.value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                                <option value="">-- Pilih Kategori --</option>
                                {tipe === 'Masuk' && <option value="Keuntungan Bulanan">Keuntungan Bulanan</option>}
                                {tipe === 'Keluar' &&
                                    <>
                                        <option value="Operasional">Operasional</option>
                                        <option value="Investasi">Investasi</option>
                                        <option value="Refund">Refund</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </>
                                }

                            </Select>
                        </div>

                        {tipe !== 'Masuk' &&
                            <div>
                                <Select label='Metode Pembayaran' value={metode} onChange={e => setMetode(e.target.value)} className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                                    <option value="">-- Pilih Metode Pembayaran --</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Transfer">Transfer</option>
                                    <option value="E-Wallet">E-Wallet</option>
                                </Select>
                            </div>
                        }
                        {/* Kalkulator Keuntungan */}
                        {isMonthlyProfitCategory ? (
                            <div className="md:col-span-2 p-3 border border-orange-200 rounded-lg bg-orange-50 space-y-3">
                                <p className="text-sm font-medium text-orange-800">Kalkulator Keuntungan Otomatis</p>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    <div>
                                        <Input label='Dari Tanggal (Orders)' type="date" value={profitCalcFrom} onChange={e => setProfitCalcFrom(e.target.value)} className="w-full" />
                                    </div>
                                    <div>
                                        <Input label='Sampai Tanggal (Orders)' type="date" value={profitCalcTo} onChange={e => setProfitCalcTo(e.target.value)} className="w-full" />
                                    </div>
                                </div>
                                <Button onClick={handleCalculateProfit} disabled={isCalculating} variant='outline' className="w-full bg-white border-orange-500 text-orange-800 hover:bg-orange-100">
                                    {isCalculating ? 'Menghitung...' : 'Hitung & Ambil Keuntungan'}
                                </Button>
                            </div>
                        ) : null}

                        {/* MODIFIKASI: Input keterangan sekarang juga bisa di-disable */}
                        <div className="md:col-span-2">
                            <Input
                                label='Keterangan'
                                value={keterangan}
                                onChange={e => setKeterangan(e.target.value)}
                                placeholder="Deskripsi singkat"
                                disabled={isMonthlyProfitCategory} // Input dinonaktifkan jika kategori keuntungan
                                className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            {isMonthlyProfitCategory && (
                                <p className='text-xs text-slate-500 mt-1'>Keterangan diisi otomatis dari hasil kalkulasi.</p>
                            )}
                        </div>

                        <div>
                            <RupiahInput
                                label="Jumlah"
                                value={jumlah}
                                onChange={setJumlah}
                                disabled={isMonthlyProfitCategory}
                                className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            {isMonthlyProfitCategory && (
                                <p className='text-xs text-slate-500 mt-1'>Jumlah diisi otomatis.</p>
                            )}
                        </div>

                        <div>
                            <Input label='Catatan' value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional" className="w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-neutral-200 px-4 md:px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" onClick={onClose} className="text-[#0a2342] hover:bg-[#0a2342]/5">Batal</Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="bg-[#0a2342] hover:bg-[#081a31] text-white border border-[#0a2342]/20">
                            {submitting ? 'Menyimpan…' : (initial ? 'Simpan Perubahan' : 'Tambah')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}