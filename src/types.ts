export type OrderStatus = 'Pending' | 'Diproses' | 'Selesai' | 'Dibatalkan';
export interface Order {
  id?: string; no: string; namaBarang: string; kategori: string; tanggal: string;
  namaPelanggan: string; jumlahKg: number; totalHarga?: number; status?: OrderStatus;
  tipeNominal?: string;
}

export type Customer = {
  id?: string;
  nama: string;
  alamat?: string;
  telpon?: string;
  createdAt?: any;
  updatedAt?: any;
};
export type SubscribeOpts = {
  q?: string;                 // (belum diimplementasi server-side; gunakan client-side jika perlu)
  status?: string;
  fromInput?: string;         // yyyy-MM-dd (inklusif, 00:00)
  toInput?: string;           // yyyy-MM-dd (inklusif, 23:59:59)
  sort?: 'asc' | 'desc';      // default 'desc'
  limit?: number;             // default 250
};
// ===== Type Definitions =====
export type ExtendedOrder = Order & Partial<{
  pengiriman: string;
  catatan: string;
  hargaJastip: number;
  hargaJastipMarkup: number;
  hargaOngkir: number;
  hargaOngkirMarkup: number;
  tipeNominal: string;
}>;

export type OrderDoc = {
  id: string;
  no: string;
  tanggal: string; // format dianjurkan: 'yyyy-MM-dd' agar range query & sorting valid
  idPelanggan: string;
  namaPelanggan: string;
  namaBarang: string;
  kategori: string;
  pengiriman?: string;
  jumlahKg: number;
  kgCeil: number;
  hargaJastip: number;
  hargaJastipMarkup: number;
  hargaOngkir: number;
  hargaOngkirMarkup: number;
  totalPembayaran: number;
  totalKeuntungan: number;
  status: OrderStatus; // 'Belum Membayar' | 'Pembayaran Selesai' | ...
  tipeNominal?: string;
  catatan?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type PeriodType = '30d' | '3m' | '12m';

export type MonthPoint = {
  key: string;
  label: string;
  total: number;
  count: number;
  profit: number;
};

export type PurchaseItem = {
  id: string;
  name: string;
  quantity: string;
  pic: string;
  customer: string;
  platform?: string;
  link?: string;
  note?: string;
  shippingDate: string;
  isDone: boolean;
};

export type ShareConfig = {
  date: string;
  pic: string;
  status: "all" | "pending" | "done";
};

export type Option = { label: string; value: string };

export type ScheduleItem = {
  id: number;
  date: string;
  status: 'SOLD OUT' | 'LIMITED' | 'AVAILABLE';
  value?: string;
};

export type ThemeType = 'BOARDING' | 'NEON' | 'PASTEL' | 'CARGO';