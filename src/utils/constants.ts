import { ScheduleItem } from "../types";

export const CATEGORY_OPTIONS = [
  "Makanan & Minuman",
  "Kesehatan & Suplemen",
  "Skin Care & Kosmetik",
  "Fashion & Pakaian",
  "Tas & Aksesoris",
  "Sepatu",
  "Elektronik",
  "Buku & Mainan",
  "Perlengkapan Rumah Tangga",
  "Hobi & Koleksi",
  "Lainnya", // "Lainnya" ditaruh di akhir
];

export const ORDER_STATUSES = [
  "Belum Membayar",
  "Diproses",
  "Selesai",
  "Dibatalkan",
] as const;

export const JAPAN_RED = "#b91c1c";
export const INK = "#1f2937";
export const GRID = "rgba(0,0,0,0.06)";
export const BG = "#f8f8f6";

export const DONE_SET = new Set(["Selesai", "Dibatalkan"]);

export const PIC_OPTIONS = ["Diny", "Mizwar", "Zakiya", "Yua", "Candra"];
export const PLATFORM_OPTIONS = ["Shopee", "Tokopedia", "TikTok", "Manual"];

// --- KONFIGURASI BACKGROUND ---
export const THEME_BACKGROUNDS = {
  BOARDING:
    "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=1974&auto=format&fit=crop",
  NEON: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
  PASTEL:
    "https://images.unsplash.com/photo-1493548578639-b0c241186eb0?q=80&w=2070&auto=format&fit=crop",
  CARGO:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop",
};

// --- DATA DEFAULT ---
export const DEFAULT_INDO_JPN: ScheduleItem[] = [
  { id: 1, date: "04 NOV", status: "SOLD OUT" },
  { id: 2, date: "12 NOV", status: "SOLD OUT" },
  { id: 3, date: "20 NOV", status: "LIMITED" },
  { id: 4, date: "25 NOV", status: "AVAILABLE", value: "15" },
  { id: 5, date: "28 NOV", status: "AVAILABLE", value: "10" },
  { id: 6, date: "01 DES", status: "AVAILABLE", value: "20" },
  { id: 7, date: "05 DES", status: "LIMITED" },
];

export const DEFAULT_JPN_INDO: ScheduleItem[] = [
  { id: 8, date: "10 NOV", status: "SOLD OUT" },
  { id: 9, date: "15 NOV", status: "SOLD OUT" },
  { id: 10, date: "28 NOV", status: "AVAILABLE", value: "50" },
  { id: 11, date: "02 DES", status: "AVAILABLE", value: "5" },
];

export const LONG_MONTHS_LABEL = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];
export const MONTH_LABEL = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
