export const CATEGORY_OPTIONS = [
    'Makanan & Minuman',
    'Kesehatan & Suplemen',
    'Skin Care & Kosmetik',
    'Fashion & Pakaian',
    'Tas & Aksesoris',
    'Sepatu',
    'Elektronik',
    'Buku & Mainan',
    'Perlengkapan Rumah Tangga',
    'Hobi & Koleksi',
    'Lainnya', // "Lainnya" ditaruh di akhir
];

export const ORDER_STATUSES = [
    'Belum Membayar', 'Pembayaran Selesai', 'Sedang Pengiriman', 'Sudah Diterima',
    'Pending', 'Diproses', 'Selesai', 'Dibatalkan'
] as const;

export const JAPAN_RED = '#b91c1c';
export const INK = '#1f2937';
export const GRID = 'rgba(0,0,0,0.06)';
export const BG = '#f8f8f6';

export const DONE_SET = new Set(['Selesai', 'Sudah Diterima', 'Dibatalkan']);

export const PIC_OPTIONS = ["Diny", "Mizwar", "Zakiya", "Yua", "Candra"];
export const PLATFORM_OPTIONS = ["Shopee", "Tokopedia", "TikTok", "Manual"];