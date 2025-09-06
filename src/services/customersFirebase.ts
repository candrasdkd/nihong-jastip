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
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // pastikan sudah ada inisialisasi firebase

// Struktur data customer di Firestore
export type CustomerDoc = {
    id?: string;
    nama: string;
    alamat?: string;
    telpon?: string;
    createdAt?: any;
    updatedAt?: any;
};

const COL = 'customer'; // sesuai permintaan: nama db/collection = "customer"

// Live listener (real-time)
export function listenCustomers(
    cb: (rows: CustomerDoc[]) => void
) {
    const q = query(collection(db, COL), orderBy('nama'));
    const unsub = onSnapshot(q, (snap) => {
        const rows = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as DocumentData),
        })) as CustomerDoc[];
        cb(rows);
    });

    return unsub; // panggil untuk berhenti listen
}

// CREATE
export async function addCustomer(data: Omit<CustomerDoc, 'id' | 'createdAt' | 'updatedAt'>) {
    const ref = await addDoc(collection(db, COL), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...data } as CustomerDoc;
}

// UPDATE
export async function updateCustomer(
    id: string,
    data: Partial<Omit<CustomerDoc, 'id' | 'createdAt'>>
) {
    const ref = doc(db, COL, id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// DELETE
export async function deleteCustomer(id: string) {
    await deleteDoc(doc(db, COL, id));
}
