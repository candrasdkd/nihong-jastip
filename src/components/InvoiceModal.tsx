import React, { useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import { Customer, Order } from '../types';
import { formatIDR } from '../utils/format';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import stampImage from '../assets/cap.png';
import autoTable from 'jspdf-autotable';

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

  // Subtotal dan total tidak diubah, tetap seperti sebelumnya
  const lineTotal = jastipMarkup + ongkirMarkup; // menggunakan harga markup langsung
  const keuntungan = jastipMarkup + ongkirMarkup; // menggunakan harga markup langsung

  return { kg, baseJastip, jastipMarkup, baseOngkir, ongkirMarkup, lineTotal, keuntungan };
}

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
        acc.subtotal += d.lineTotal; // subtotal berdasarkan markup langsung
        acc.totalKeuntungan += d.keuntungan; // keuntungan berdasarkan markup langsung
        return acc;
      },
      { subtotal: 0, totalKeuntungan: 0 }
    );
  }, [items, unitPrice]);

  // Catatan harga (hanya markup yang dibagi dengan kg)
  const priceNotes = useMemo(() => {
    if (!items?.length) return '';
    return items
      .map((it) => {
        const d = compute(it, unitPrice);
        const parts = [
          d.jastipMarkup ? `Jastip Markup / kg ${formatIDR(d.jastipMarkup / d.kg)}` : '',
          d.ongkirMarkup ? `Ongkir Markup / kg ${formatIDR(d.ongkirMarkup / d.kg)}` : '',
        ].filter(Boolean).join(' + ');
        return `${it.namaBarang || '-'}: ${parts || '-'}`;
      })
      .join('\n');
  }, [items, unitPrice]);

  const adminFee = 0;
  const grandTotal = totals.subtotal + adminFee;

  async function downloadPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 14;
    const pageW = doc.internal.pageSize.getWidth();
    const right = pageW - margin;

    // ==== Header ====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(10, 35, 66);
    doc.text('INVOICE', margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(17);
    doc.text(`Tanggal: ${order.tanggal}`, margin, 24);

    // Info perusahaan kanan
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 35, 66);
    doc.text('Nihong Jastip', right, 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text('Depok/Jakarta/Kendal', right, 22, { align: 'right' });
    doc.text('jastipnihong@gmail.com • 085156775933', right, 27, { align: 'right' });

    // Garis tipis
    doc.setDrawColor(225);
    doc.line(margin, 34, right, 34);

    // Ditagihkan kepada
    doc.setFontSize(10);
    doc.setTextColor(107);
    doc.text('Ditagihkan kepada', margin, 41);
    doc.setTextColor(17);
    doc.setFont('helvetica', 'bold');
    doc.text(order.namaPelanggan || '-', margin, 47);
    doc.setFont('helvetica', 'normal');
    if (customer?.telpon) doc.text(String(customer.telpon), margin, 52);

    // Status kanan
    doc.setTextColor(107);
    doc.text('Status', right, 41, { align: 'right' });
    doc.setTextColor(17);
    doc.setFont('helvetica', 'bold');
    doc.text(order.status || '-', right, 47, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107);
    doc.text(`Pengiriman: ${order.pengiriman ?? '-'}`, right, 52, { align: 'right' });

    // ==== Tabel Items (MARKUP) ====
    const head = [['Nama Barang', 'Kategori', 'Kg', 'Subtotal (Markup)']];
    const body = items.map((it) => {
      const d = compute(it, unitPrice);
      return [
        it.namaBarang || '-',
        it.kategori || '-',
        String(d.kg),
        formatIDR(d.lineTotal), // subtotal (markup) tetap seperti sebelumnya
      ];
    });

    autoTable(doc, {
      head,
      body,
      startY: 58,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
      },
      headStyles: {
        fillColor: [10, 35, 66],
        textColor: 255,
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 45 },
        2: { halign: 'right', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 35 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && (data.column.index === 2 || data.column.index === 3)) {
          data.cell.styles.fontStyle = 'normal';
        }
      },
    });

    const afterItemsY = (doc as any).lastAutoTable.finalY || 58;

    // ==== Totals (kanan) ====
    const totalsTableWidth = 70; // mm
    autoTable(doc, {
      body: [
        ['Subtotal (Markup)', formatIDR(totals.subtotal)],
        ['Biaya Admin', formatIDR(0)],
        [
          { content: 'Total', styles: { fontStyle: 'bold', textColor: [10, 35, 66] } },
          { content: formatIDR(grandTotal), styles: { fontStyle: 'bold', textColor: [10, 35, 66] } },
        ],
      ],
      theme: 'grid',
      startY: afterItemsY + 6,
      tableWidth: totalsTableWidth,
      margin: { left: pageW - margin - totalsTableWidth, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
        halign: 'right',
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
      },
    });

    let afterTotalsY = (doc as any).lastAutoTable.finalY || (afterItemsY + 6);

    // ==== Cap (opsional) ====
    try {
      const capDataUrl = await (async (src: string) => {
        const res = await fetch(src);
        const blob = await res.blob();
        return await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.readAsDataURL(blob);
        });
      })(stampImage as unknown as string);

      const size = 28; // mm
      const x = pageW - margin - size;
      const y = afterTotalsY + 8;
      doc.addImage(capDataUrl, 'PNG', x, y, size, size);
      afterTotalsY = y + size;
    } catch {
      // skip jika gagal
    }

    // ==== Catatan harga ====
    doc.setFontSize(9);
    doc.setTextColor(90);
    const noteTitleY = afterTotalsY + 10;
    doc.text('Catatan harga: Subtotal dihitung dari Jastip Markup + Ongkir Markup per item (tidak dibagi dengan kg).', margin, noteTitleY);

    if (priceNotes) {
      const noteLines = doc.splitTextToSize(priceNotes, right - margin);
      doc.text(noteLines, margin, noteTitleY + 6);
    }

    doc.save(`${(order as any).no || order.id || 'invoice'}_Invoice.pdf`);
  }

  return (
    <Modal onClose={onClose} title={`Invoice`} size="5xl" contentClassName="p-0">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 overflow-auto">
          {/* ======= INVOICE BODY ======= */}
          <div ref={invoiceRef} className="invoice-sheet w-[794px] mx-auto bg-white text-neutral-900 p-6 rounded-xl border border-[#0a2342]/10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[color:var(--navy,#0a2342)]">INVOICE</h3>
                <p className="text-sm text-neutral-500">Tanggal: {order.tanggal}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[color:var(--navy,#0a2342)]">Nihong Jastip</div>
                <div className="text-sm text-neutral-600">Depok/Jakarta/Kendal</div>
                <div className="text-sm text-neutral-600">jastipnihong@gmail.com • 085156775933</div>
              </div>
            </div>

            <div className="border-t border-[#0a2342]/10 my-3" />

            {/* Bill to + status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <div className="text-sm text-neutral-500 mb-1">Ditagihkan kepada</div>
                <div className="font-semibold">{order.namaPelanggan}</div>
                <div className="text-sm text-neutral-700">{customer?.telpon || ''}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">Status</div>
                <div className="font-semibold">{order.status}</div>
                <div className="text-sm text-neutral-500">Pengiriman: {order.pengiriman ?? '-'}</div>
              </div>
            </div>

            {/* Items table */}
            <div className="mt-4 overflow-x-auto">
              <table className="table-a4 table-fixed w-full text-sm">
                <colgroup>
                  <col style={{ width: '44%' }} /> {/* Nama Barang */}
                  <col style={{ width: '26%' }} /> {/* Kategori */}
                  <col style={{ width: '10%' }} /> {/* Kg */}
                  <col style={{ width: '20%' }} /> {/* Subtotal (Markup) */}
                </colgroup>
                <thead>
                  <tr className="bg-[#0a2342] text-white">
                    <th className="tcell text-left font-semibold">Nama Barang</th>
                    <th className="tcell text-left font-semibold">Kategori</th>
                    <th className="tcell text-right font-semibold">Kg</th>
                    <th className="tcell text-right font-semibold">Subtotal (Markup)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const d = compute(it, unitPrice);
                    return (
                      <tr key={it.id} className="odd:bg-white even:bg-orange-50">
                        <td className="tcell">{it.namaBarang}</td>
                        <td className="tcell">{it.kategori}</td>
                        <td className="tcell text-right align-nums whitespace-nowrap">{d.kg}</td>
                        <td className="tcell text-right align-nums whitespace-nowrap">
                          {formatIDR(d.lineTotal)}{/* jastipMarkup + ongkirMarkup */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Notes + Totals */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Catatan</div>
                <div className="text-sm text-neutral-700">
                  Subtotal dihitung dari <b>Jastip Markup + Ongkir Markup</b> per item (tidak dibagi dengan kg).
                  {order.catatan ? (<div className="mt-1 text-neutral-600">Catatan pesanan: {order.catatan}</div>) : null}
                  {priceNotes ? (
                    <div className="mt-2 text-xs text-neutral-500 whitespace-pre-line">
                      {priceNotes}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="sm:justify-self-end w-full sm:w-80">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-neutral-600">Subtotal (Markup)</span>
                  <span className="font-medium">{formatIDR(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-neutral-600">Biaya Admin</span>
                  <span className="font-medium">{formatIDR(adminFee)}</span>
                </div>
                <div className="border-t border-[#0a2342]/10 my-1" />
                <div className="flex items-center justify-between py-1">
                  <span className="font-semibold text-[color:var(--navy,#0a2342)]">Total</span>
                  <span className="font-bold text-[color:var(--navy,#0a2342)]">{formatIDR(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Stamp only (paraf dihilangkan) */}
            <div className="mt-10 flex justify-end">
              <div className="text-center">
                <div className="text-sm mb-2">Cap/Stempel</div>
                <div className="h-28 w-28 mx-auto rounded-full border border-dashed border-[#0a2342]/30 grid place-items-center bg-white">
                  <img src={stampImage} alt="Stempel" className="stamp max-h-24 max-w-24 object-contain" />
                </div>
                <div className="mt-2 text-sm">Nihong Jastip</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="w-full lg:w-72 space-y-3">
          <div className="flex flex-col gap-2">
            <Button onClick={downloadPDF} className="bg-orange-600 hover:bg-orange-700 text-white">Download PDF</Button>
            <Button variant="ghost" onClick={onClose}>Tutup</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


