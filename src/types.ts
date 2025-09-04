export type OrderStatus = 'Pending' | 'Diproses' | 'Selesai' | 'Dibatalkan';
export interface Order {
  id: string; no: string; namaBarang: string; kategori: string; tanggal: string;
  namaPelanggan: string; jumlahKg: number; totalHarga: number; status: OrderStatus;
}
export interface Customer { id: string; nama: string; alamat: string; telpon: string; }
