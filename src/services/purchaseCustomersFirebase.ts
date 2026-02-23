import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { PurchaseCustomer } from "../types";

const COL = "purchase_customer";

export function listenPurchaseCustomers(cb: (rows: PurchaseCustomer[]) => void) {
    const q = query(collection(db, COL), orderBy("nama"));
    const unsub = onSnapshot(q, (snap) => {
        const rows = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as DocumentData),
        })) as PurchaseCustomer[];
        cb(rows);
    });
    return unsub;
}

export async function addPurchaseCustomer(nama: string) {
    const ref = await addDoc(collection(db, COL), {
        nama: nama,
        createdAt: serverTimestamp(),
    });
    return { id: ref.id, nama };
}
