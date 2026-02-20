// src/services/customersFirebase.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase"; // pastikan sudah ada inisialisasi firebase
import { Customer } from "../types";

const COL = "customer"; // sesuai permintaan: nama db/collection = "customer"

// Live listener (real-time)
export function listenCustomers(cb: (rows: Customer[]) => void) {
  const q = query(collection(db, COL), orderBy("nama"));
  const unsub = onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as DocumentData),
    })) as Customer[];
    cb(rows);
  });

  return unsub; // panggil untuk berhenti listen
}

// CREATE
export async function addCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">,
) {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, ...data } as Customer;
}

// UPDATE
export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, "id" | "createdAt">>,
) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// DELETE
export async function deleteCustomer(id: string) {
  await deleteDoc(doc(db, COL, id));
}
