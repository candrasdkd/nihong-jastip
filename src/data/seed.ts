import { Customer, Order, OrderStatus } from "../types";
import { computeTotal } from "../utils/helpers";

export function ensureSeed(
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>,
  unitPrice: number,
) {
  const seeded = sessionStorage.getItem("jastip_seeded_v1");
  if (seeded) return;
  const custs: Customer[] = [
    {
      id: crypto.randomUUID(),
      nama: "Budi Santoso",
      alamat: "Jl. Melati No. 12, Jakarta",
      telpon: "0812-3456-7890",
    },
    {
      id: crypto.randomUUID(),
      nama: "Siti Nurhaliza",
      alamat: "Gg. Kenanga RT 03/05, Bandung",
      telpon: "0813-1111-2222",
    },
    {
      id: crypto.randomUUID(),
      nama: "Andi Wijaya",
      alamat: "Perum Green Park Blok B2, Surabaya",
      telpon: "0821-9999-0000",
    },
  ];
  const now = new Date();
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const orders: Order[] = Array.from({ length: 16 }).map((_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - Math.floor(Math.random() * 10));
    d.setDate(
      Math.max(1, Math.min(28, d.getDate() - Math.floor(Math.random() * 20))),
    );
    const tanggal = d.toISOString().slice(0, 10);
    const jumlahKg = Number((Math.random() * 5 + 0.2).toFixed(2));
    const totalHarga = computeTotal(jumlahKg, unitPrice);
    const cust = custs[Math.floor(Math.random() * custs.length)];
    const status: OrderStatus = ["Pending", "Diproses", "Selesai"][
      Math.floor(Math.random() * 3)
    ] as OrderStatus;
    return {
      id: crypto.randomUUID(),
      no: `ORD-${ymd}-${String(i + 1).padStart(3, "0")}`,
      namaBarang: [
        "Mie Instan",
        "Bumbu Ramen",
        "Matcha",
        "Susu Bubuk",
        "Skincare",
      ][Math.floor(Math.random() * 5)],
      kategori: ["Makanan", "Minuman", "Kecantikan", "Lainnya"][
        Math.floor(Math.random() * 4)
      ],
      tanggal,
      namaPelanggan: cust.nama,
      jumlahKg,
      totalHarga,
      status,
    };
  });
  setCustomers(custs);
  setOrders(orders);
  sessionStorage.setItem("jastip_seeded_v1", "1");
}
