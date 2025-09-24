import React, { useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import { Customer, Order } from '../types';
import { formatIDR } from '../utils/format';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import stampImage from '../assets/cap.png';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Selaras dengan OrdersPage: dukung kolom markup dan ongkir
export type ExtendedOrder = Order & Partial<{
  pengiriman: string;
  catatan: string;
  hargaJastip: number;
  hargaJastipMarkup: number;
  hargaOngkir: number;
  hargaOngkirMarkup: number;
  jumlahKg: number | string;
}>;

function compute(o: ExtendedOrder, unitPrice: number) {
  const kg = Math.ceil(Number(o.jumlahKg ?? 0));
  const baseJastip = typeof o.hargaJastip === 'number' ? o.hargaJastip : kg * unitPrice;
  const jastipMarkup = Number(o.hargaJastipMarkup ?? 0);
  const baseOngkir = Number(o.hargaOngkir ?? 0);
  const ongkirMarkup = Number(o.hargaOngkirMarkup ?? 0);

  const lineTotal = jastipMarkup + ongkirMarkup;
  const keuntungan = jastipMarkup + ongkirMarkup;

  return { kg, baseJastip, jastipMarkup, baseOngkir, ongkirMarkup, lineTotal, keuntungan };
}

const STATUS_STYLES: Record<string, string> = {
  'Selesai': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Sudah Diterima': 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  'Diproses': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Dibatalkan': 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const chip = (label?: string) =>
  label ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200">
      {label}
    </span>
  ) : null;

export function InvoiceModal({
  order,
  orders,
  customer,
  onClose,
  unitPrice,
  itemIds,
}: {
  order: ExtendedOrder;
  orders: ExtendedOrder[];
  customer?: Customer;
  onClose: () => void;
  unitPrice: number;
  itemIds: string[];
}) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const pool = orders || [];
    if (itemIds && itemIds.length) {
      const set = new Set(itemIds);
      return pool.filter(o => set.has(o.id));
    }
    return pool.filter(o => o.namaPelanggan === order.namaPelanggan);
  }, [orders, itemIds, order.namaPelanggan]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        const d = compute(it, unitPrice);
        acc.subtotal += d.lineTotal;
        acc.totalKeuntungan += d.keuntungan;
        return acc;
      },
      { subtotal: 0, totalKeuntungan: 0 }
    );
  }, [items, unitPrice]);

  const priceNotes = useMemo(() => {
    if (!items?.length) return '';
    return items
      .map((it) => {
        const d = compute(it, unitPrice);
        const parts = [
          d.jastipMarkup ? `Jastip / kg ${formatIDR(d.jastipMarkup / d.kg)}` : '',
          d.ongkirMarkup ? `Ongkir / kg ${formatIDR(d.ongkirMarkup / d.kg)}` : '',
        ].filter(Boolean).join(' + ');
        return `${it.namaBarang || '-'}: ${parts || '-'}`;
      })
      .join('\n');
  }, [items, unitPrice]);

  const adminFee = 0;
  const grandTotal = totals.subtotal + adminFee;

  async function downloadPDF() {
    const node = invoiceRef.current;
    if (!node) return;

    // Pastikan state/UI sudah render
    await new Promise(r => setTimeout(r, 0));

    // Render DOM -> Canvas (pakai scale tinggi biar tajam)
    const canvas = await html2canvas(node, {
      scale: Math.min(2, window.devicePixelRatio || 1.5), // kualitas cukup tinggi
      useCORS: true,              // biar <img> lokal/remote bisa ikut
      backgroundColor: '#ffffff', // pastikan putih
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');

    // A4: 210 x 297 mm
    const margin = 8; // mm — sedikit lebih kecil dari sebelumnya biar muat
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    // Hitung skala canvas -> mm
    const imgWidthMM = printableWidth;
    const pxPerMM = canvas.width / imgWidthMM;
    const pageCanvasHeightPX = Math.floor(printableHeight * pxPerMM);

    let y = 0;
    let pageIndex = 0;

    // Helper: crop per halaman agar tidak “nyeret” gambar panjang
    while (y < canvas.height) {
      // Buat sub-canvas setinggi 1 halaman
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      const sliceHeight = Math.min(pageCanvasHeightPX, canvas.height - y);

      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0, y, canvas.width, sliceHeight,    // sumber (crop)
          0, 0, canvas.width, sliceHeight     // tujuan
        );
      }

      const imgData = pageCanvas.toDataURL('image/png');

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        imgWidthMM,
        (sliceHeight / pxPerMM) // tinggi mm sesuai potongan
      );

      y += sliceHeight;
      pageIndex++;
    }

    const fileName = `${(order as any).no || order.id || 'invoice'}_Invoice.pdf`;
    pdf.save(fileName);
  }

  const statusClass = STATUS_STYLES[order.status || ''] ?? 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200';

  return (
    <Modal onClose={onClose} title={`Invoice`} size="5xl" contentClassName="p-0">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          {/* ======= INVOICE SHEET ======= */}
          <div
            ref={invoiceRef}
            className="invoice-sheet w-[794px] mx-auto bg-white text-neutral-900 p-0 rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden"
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-[#0a2342] to-[#081a31] text-white px-6 py-5 flex items-start justify-between">
              <div>
                <div className="text-xs/5 opacity-80">INVOICE</div>
                <h3 className="text-xl font-bold tracking-wide">Nihong Jastip</h3>
                <div className="text-[13px] opacity-85">Depok/Jakarta/Kendal</div>
                <div className="text-[13px] opacity-85">jastipnihong@gmail.com • 085156775933</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">Tanggal</div>
                <div className="font-semibold tabular-nums">{order.tanggal}</div>
                {(order as any).no || order.id ? (
                  <>
                    <div className="mt-2 text-sm opacity-80">No. Invoice</div>
                    <div className="font-semibold">{(order as any).no || order.id}</div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Bill to + Status */}
            <div className="px-6 pt-5 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs text-neutral-500 mb-1">Ditagihkan kepada</div>
                <div className="font-semibold text-neutral-900">{order.namaPelanggan || '-'}</div>
                {customer?.telpon ? <div className="text-sm text-neutral-700">{customer.telpon}</div> : null}
              </div>
              <div className="rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs text-neutral-500 mb-2">Status</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                    {order.status || '-'}
                  </span>
                  {chip(order.pengiriman ? `Pengiriman: ${order.pengiriman}` : undefined)}
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="px-6 pb-2 mt-2">
              <div className="overflow-hidden rounded-xl ring-1 ring-neutral-200">
                <table className="w-full text-sm">
                  <colgroup>
                    <col style={{ width: '44%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#0a2342] text-white">
                      <th className="px-3.5 py-2.5 text-left font-semibold">Nama Barang</th>
                      <th className="px-3.5 py-2.5 text-left font-semibold">Kategori</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold tabular-nums">Kg</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold tabular-nums">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((it, idx) => {
                      const d = compute(it, unitPrice);
                      return (
                        <tr key={it.id} className={idx % 2 ? 'bg-orange-50/40' : 'bg-white'}>
                          <td className="px-3.5 py-2.5">{it.namaBarang || '-'}</td>
                          <td className="px-3.5 py-2.5 text-neutral-700">{it.kategori || '-'}</td>
                          <td className="px-3.5 py-2.5 text-right tabular-nums">{d.kg}</td>
                          <td className="px-3.5 py-2.5 text-right tabular-nums font-medium">{formatIDR(d.lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes + Totals */}
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Catatan</div>
                <div className="rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-4">
                  <div className="text-sm text-neutral-700">
                    Total sudah termasuk biaya admin.
                    {order.catatan ? (<div className="mt-1 text-neutral-600">Catatan pesanan: {order.catatan}</div>) : null}
                  </div>
                  {priceNotes ? (
                    <div className="mt-3 text-xs text-neutral-500 whitespace-pre-line leading-5">
                      {priceNotes}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="sm:justify-self-end w-full sm:w-80">
                <div className="rounded-xl ring-1 ring-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-600">Total</span>
                    <span className="font-medium tabular-nums">{formatIDR(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-600">Biaya Admin</span>
                    <span className="font-medium tabular-nums">{formatIDR(adminFee)}</span>
                  </div>
                  <div className="border-t border-neutral-200 my-2" />
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-[color:var(--navy,#0a2342)]">Total</span>
                    <span className="font-bold text-[color:var(--navy,#0a2342)] tabular-nums">{formatIDR(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stamp */}
            <div className="px-6 pb-8 flex justify-end">
              <div className="text-center">
                <div className="text-sm mb-2 text-neutral-600">Cap/Stempel</div>
                <div className="h-28 w-28 mx-auto rounded-full border border-dashed border-[#0a2342]/30 grid place-items-center bg-white hover:shadow-sm transition">
                  <img src={stampImage} alt="Stempel" className="stamp max-h-24 max-w-24 object-contain" />
                </div>
                <div className="mt-2 text-sm font-medium text-neutral-800">Nihong Jastip</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="w-full lg:w-72">
          <div className="sticky top-4 space-y-3 rounded-2xl ring-1 ring-neutral-200 bg-white p-4 shadow-sm">
            <Button onClick={downloadPDF} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              Download PDF
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Tutup
            </Button>
            <div className="text-xs text-neutral-500">
              File A4, lebar 794px. Warna utama navy <span className="font-mono">#0a2342</span> & aksen oranye.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
