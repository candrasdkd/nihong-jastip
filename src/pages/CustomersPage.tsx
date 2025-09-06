// src/pages/CustomersPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';

// ---- Tipe lokal ----
export type Customer = {
  id?: string;
  nama: string;
  alamat?: string;
  telpon?: string;
  createdAt?: any;
  updatedAt?: any;
};

// ---- Konstanta ----
const NAVY = '#0a2342';
const COL = 'customer';

// ---- Ikon inline (ringan, tanpa lib eksternal) ----
const baseIcon = 'h-4 w-4 shrink-0';
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className={baseIcon} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className={baseIcon} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className={baseIcon} fill="currentColor">
      <path d="M20.52 3.48A11.94 11.94 0 0 0 12.06 0C5.47.03.15 5.36.18 11.95a11.87 11.87 0 0 0 1.7 6.17L0 24l5.99-1.85a11.93 11.93 0 0 0 6.07 1.66h.01c6.59-.04 11.91-5.37 11.93-11.96a11.9 11.9 0 0 0-3.48-8.37Zm-8.46 18.3a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.56 1.1 1.12-3.47-.23-.36a9.9 9.9 0 1 1 8.08 4.33ZM17.2 14.3c-.3-.16-1.78-.88-2.05-.98-.27-.1-.47-.16-.66.16-.2.32-.77.98-.95 1.18-.18.2-.35.23-.65.08-.3-.16-1.27-.47-2.43-1.5-.9-.8-1.5-1.8-1.67-2.1-.17-.32-.02-.49.13-.64.13-.12.3-.32.45-.48.15-.16.2-.27.3-.45.1-.18.05-.34-.02-.48-.08-.16-.66-1.6-.9-2.2-.24-.58-.48-.5-.66-.51h-.56c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.99 2.67 1.12 2.85.14.18 1.96 2.98 4.75 4.18.66.28 1.18.45 1.58.58.66.21 1.27.18 1.75.11.53-.08 1.78-.73 2.04-1.44.25-.7.25-1.3.18-1.44-.08-.13-.27-.2-.57-.36Z" />
    </svg>
  );
}

// ---- Helper WA ----
function toWaNumber(raw?: string) {
  if (!raw) return '';
  const digits = (raw.match(/\d+/g) || []).join('');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('8')) return '62' + digits;
  return digits;
}
function openWhatsApp(rawNumber?: string, message?: string) {
  const wa = toWaNumber(rawNumber);
  if (!wa) {
    alert('Nomor telepon tidak valid atau kosong.');
    return;
  }
  const url = `https://wa.me/${wa}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ---- CRUD ----
async function addCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
  await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
async function updateCustomerById(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}
async function deleteCustomerById(id: string) {
  const ref = doc(db, COL, id);
  await deleteDoc(ref);
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  useEffect(() => {
    const qy = query(collection(db, COL), orderBy('nama'));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Customer[];
        setCustomers(rows);
        setLoading(false);
      },
      (err) => {
        console.error('listen customer error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(
    () => customers.filter((c) => (c?.nama ?? '').toLowerCase().includes(q.toLowerCase())),
    [customers, q]
  );

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm('Hapus konsumen ini?')) return;
    try {
      await deleteCustomerById(id);
    } catch (err: any) {
      alert('Gagal menghapus: ' + (err?.message || err));
    }
  }

  const makeDefaultWaMsg = (nama?: string) => `Halo ${nama || ''}, saya ingin konfirmasi pesanan.`;

  return (
    <div className="space-y-4">
      {/* Toolbar atas */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <Input
          placeholder="Cari nama konsumen"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <Button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-orange-600 hover:bg-orange-700 text-white border border-orange-700/20"
        >
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden xs:inline">Tambah Konsumen</span>
          </span>
        </Button>
      </div>

      {/* Desktop table */}
      <Card className="overflow-x-auto hidden sm:block border border-[#0a2342]/10">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0" style={{ backgroundColor: NAVY }}>
            <tr className="text-left text-white">
              {['Nama', 'Alamat', 'No Telpon', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold border-b border-white/10">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>Memuat data...</td>
              </tr>
            )}
            {!loading && filtered.map((c) => (
              <tr key={c.id} className="odd:bg-white even:bg-orange-50 hover:bg-orange-100/60 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap font-medium">{c.nama}</td>
                <td className="px-4 py-3 min-w-[240px]">{c.alamat || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.telpon || ''}</td>
                <td className="px-4 py-3">
                  {/* RESPONSIVE ACTIONS: wrap + ikon-only di < md, ikon+label di >= md */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      title="Edit"
                      aria-label={`Edit ${c.nama}`}
                      className="text-[color:var(--navy,#0a2342)] hover:bg-[#0a2342]/5 px-2 py-2"
                      onClick={() => { setEditing(c); setShowForm(true); }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconEdit />
                        <span className="hidden md:inline">Edit</span>
                      </span>
                    </Button>

                    <Button
                      variant="danger"
                      title="Hapus"
                      aria-label={`Hapus ${c.nama}`}
                      className="px-2 py-2"
                      onClick={() => handleDelete(c.id)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconTrash />
                        <span className="hidden md:inline">Hapus</span>
                      </span>
                    </Button>

                    <Button
                      onClick={() => openWhatsApp(c.telpon, makeDefaultWaMsg(c.nama))}
                      disabled={!c.telpon}
                      title="Kirim WhatsApp"
                      aria-label={`WhatsApp ${c.nama}`}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 px-2 py-2"
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconWhatsApp />
                        <span className="hidden md:inline">WhatsApp</span>
                      </span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>Tidak ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading && <p className="text-center text-sm text-neutral-500">Memuat data...</p>}

        {!loading && filtered.map((c) => (
          <Card key={c.id} className="p-4 border border-[#0a2342]/10">
            <div className="font-semibold">{c.nama}</div>
            <div className="text-sm text-neutral-600">{c.alamat || '-'}</div>
            <div className="text-sm">{c.telpon || ''}</div>

            {/* RESPONSIVE ACTIONS (mobile): grid 3 kolom biar rapi */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button
                variant="ghost"
                title="Edit"
                aria-label={`Edit ${c.nama}`}
                className="text-[color:var(--navy,#0a2342)] hover:bg-[#0a2342]/5 px-2 py-2"
                onClick={() => { setEditing(c); setShowForm(true); }}
              >
                <span className="mx-auto inline-flex items-center gap-2">
                  <IconEdit />
                  {/* label optional di mobile: kecilkan */}
                  <span className="text-xs">Edit</span>
                </span>
              </Button>

              <Button
                variant="danger"
                title="Hapus"
                aria-label={`Hapus ${c.nama}`}
                className="px-2 py-2"
                onClick={() => handleDelete(c.id)}
              >
                <span className="mx-auto inline-flex items-center gap-2">
                  <IconTrash />
                  <span className="text-xs">Hapus</span>
                </span>
              </Button>

              <Button
                onClick={() => openWhatsApp(c.telpon, makeDefaultWaMsg(c.nama))}
                disabled={!c.telpon}
                title="Kirim WhatsApp"
                aria-label={`WhatsApp ${c.nama}`}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 px-2 py-2"
              >
                <span className="mx-auto inline-flex items-center gap-2">
                  <IconWhatsApp />
                  <span className="text-xs">WA</span>
                </span>
              </Button>
            </div>
          </Card>
        ))}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-sm text-neutral-500">Tidak ada data.</p>
        )}
      </div>

      {showForm && (
        <CustomerFormModal
          initial={editing || undefined}
          onClose={() => setShowForm(false)}
          onSubmit={async (val: Customer) => {
            try {
              if (editing?.id) {
                await updateCustomerById(editing.id, { nama: val.nama, alamat: val.alamat, telpon: val.telpon });
              } else {
                await addCustomer({ nama: val.nama, alamat: val.alamat, telpon: val.telpon });
              }
              setShowForm(false);
            } catch (err: any) {
              alert('Gagal menyimpan: ' + (err?.message || err));
            }
          }}
        />
      )}
    </div>
  );
}
