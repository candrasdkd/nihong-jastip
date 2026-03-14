import * as XLSX from "xlsx";
import { LedgerEntry } from "../services/ledgerFirebase";

export function exportLedgerToExcel(data: LedgerEntry[], filename: string = "Laporan_Kas.xlsx") {
  // Map data to the desired format for Excel
  const exportData = data.map((entry) => ({
    Tanggal: entry.tanggal,
    Keterangan: entry.keterangan || "Tanpa Keterangan",
    Kategori: entry.kategori || "-",
    "Tipe Transaksi": entry.tipe === "Masuk" ? "Pemasukan" : "Pengeluaran",
    "Metode": entry.metode || "-",
    "Nominal Masuk (Rp)": entry.tipe === "Masuk" ? Number(entry.jumlah || 0) : 0,
    "Nominal Keluar (Rp)": entry.tipe === "Keluar" ? Number(entry.jumlah || 0) : 0,
    Catatan: entry.catatan || "-",
  }));

  // Create a new workbook and add a worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths for better visibility
  const wscols = [
    { wch: 12 }, // Tanggal
    { wch: 30 }, // Keterangan
    { wch: 15 }, // Kategori
    { wch: 15 }, // Tipe
    { wch: 15 }, // Metode
    { wch: 20 }, // Masuk
    { wch: 20 }, // Keluar
    { wch: 40 }, // Catatan
  ];
  worksheet["!cols"] = wscols;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Buku Kas");

  // Trigger download
  XLSX.writeFile(workbook, filename);
}
