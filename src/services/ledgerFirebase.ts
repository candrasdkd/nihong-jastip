import {
  collection, query, where, orderBy, limit as qLimit,
  onSnapshot, getDocs, addDoc, doc, updateDoc, deleteDoc, QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';


export type LedgerEntry = {
  id: string;
  tanggal: string;                 // 'YYYY-MM-DD' (string utk range aman TZ)
  tipe: 'Masuk' | 'Keluar';
  kategori: string | null;
  keterangan: string | null;
  metode: string | null;
  jumlah: number;                  // positif
  catatan: string | null;
  createdAt?: number;              // epoch ms (opsional)
};

type FetchParams = {
  from?: string;
  to?: string;
  type?: 'Masuk' | 'Keluar';
  category?: string;
  order?: { field: keyof LedgerEntry; direction: 'asc' | 'desc' };
  limit?: number;
};

function buildConstraints(p: FetchParams): QueryConstraint[] {
  const c: QueryConstraint[] = [];
  if (p.from) c.push(where('tanggal', '>=', p.from));
  if (p.to) c.push(where('tanggal', '<=', p.to));
  if (p.type) c.push(where('tipe', '==', p.type));
  if (p.category) c.push(where('kategori', '==', p.category));
  const field = p.order?.field || 'tanggal';
  const dir = p.order?.direction || 'desc';
  c.push(orderBy(field as string, dir));
  if (p.limit) c.push(qLimit(p.limit));
  return c;
}

function mapDoc(d: any): LedgerEntry {
  const raw = d.data();
  return {
    id: d.id,
    tanggal: raw.tanggal,
    tipe: raw.tipe,
    kategori: raw.kategori ?? null,
    keterangan: raw.keterangan ?? null,
    metode: raw.metode ?? null,
    jumlah: Number(raw.jumlah || 0),
    catatan: raw.catatan ?? null,
    createdAt: raw.createdAt ?? undefined,
  };
}

export async function fetchLedger(p: FetchParams): Promise<LedgerEntry[]> {
  const col = collection(db, 'ledger');
  const qy = query(col, ...buildConstraints(p));
  const snap = await getDocs(qy);
  return snap.docs.map(mapDoc);
}

export function subscribeLedger(
  p: FetchParams,
  onRows: (rows: LedgerEntry[]) => void
) {
  const col = collection(db, 'ledger');
  const qy = query(col, ...buildConstraints(p));
  const unsub = onSnapshot(qy, (snap) => onRows(snap.docs.map(mapDoc)));
  return unsub;
}

/* ===================== CRUD ===================== */

export type LedgerUpsert = Omit<LedgerEntry, 'id'>;

export async function createLedgerEntry(payload: LedgerUpsert) {
  const col = collection(db, 'ledger');
  // normalisasi minimal
  const dto = {
    ...payload,
    tanggal: payload.tanggal,           // 'YYYY-MM-DD'
    jumlah: Number(payload.jumlah || 0),
    createdAt: payload.createdAt ?? Date.now(),
  };
  await addDoc(col, dto);
}

export async function updateLedgerEntry(id: string, payload: Partial<LedgerUpsert>) {
  const ref = doc(db, 'ledger', id);
  const dto: any = { ...payload };
  if (dto.jumlah != null) dto.jumlah = Number(dto.jumlah);
  await updateDoc(ref, dto);
}

export async function deleteLedgerEntry(id: string) {
  const ref = doc(db, 'ledger', id);
  await deleteDoc(ref);
}
