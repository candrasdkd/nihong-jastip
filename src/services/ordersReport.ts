// src/services/ordersFirebase.ts (Contoh)
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Menghitung total keuntungan dari koleksi 'orders' berdasarkan rentang tanggal.
 * @param from - Tanggal mulai dalam format 'YYYY-MM-DD'
 * @param to - Tanggal selesai dalam format 'YYYY-MM-DD'
 * @returns {Promise<number>} Total keuntungan yang dihitung.
 */
export async function calculateProfitFromOrders(
  from: string,
  to: string,
): Promise<number> {
  if (!from || !to) {
    throw new Error("Tanggal mulai dan selesai harus diisi.");
  }

  const ordersRef = collection(db, "orders");
  const q = query(
    ordersRef,
    where("tanggal", ">=", from),
    where("tanggal", "<=", to),
  );

  const querySnapshot = await getDocs(q);
  let totalProfit = 0;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Pastikan ada field 'keuntungan' dan tipenya adalah number
    if (data.totalKeuntungan && typeof data.totalKeuntungan === "number") {
      totalProfit += data.totalKeuntungan;
    }
  });

  return totalProfit;
}
