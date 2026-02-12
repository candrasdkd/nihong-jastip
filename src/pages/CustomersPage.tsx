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
import { BG } from '../utils/constants';
import { Customer } from '../types';
import { openWhatsApp } from '../utils/helpers';

// ---- Konstanta ----
const COL = 'customer';

// ---- Ikon SVG (Ditambah IconSearch & IconEmpty) ----
const IconUserPlus = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>);
const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>);
const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const IconWhatsApp = (props: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.52 3.48A11.94 11.94 0 0 0 12.06 0C5.47.03.15 5.36.18 11.95a11.87 11.87 0 0 0 1.7 6.17L0 24l5.99-1.85a11.93 11.93 0 0 0 6.07 1.66h.01c6.59-.04 11.91-5.37 11.93-11.96a11.9 11.9 0 0 0-3.48-8.37Zm-8.46 18.3a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.56 1.1 1.12-3.47-.23-.36a9.9 9.9 0 1 1 8.08 4.33ZM17.2 14.3c-.3-.16-1.78-.88-2.05-.98-.27-.1-.47-.16-.66.16-.2.32-.77.98-.95 1.18-.18.2-.35.23-.65.08-.3-.16-1.27-.47-2.43-1.5-.9-.8-1.5-1.8-1.67-2.1-.17-.32-.02-.49.13-.64.13-.12.3-.32.45-.48.15-.16.2-.27.3-.45.1-.18.05-.34-.02-.48-.08-.16-.66-1.6-.9-2.2-.24-.58-.48-.5-.66-.51h-.56c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.99 2.67 1.12 2.85.14.18 1.96 2.98 4.75 4.18.66.28 1.18.45 1.58.58.66.21 1.27.18 1.75.11.53-.08 1.78-.73 2.04-1.44.25-.7.25-1.3.18-1.44-.08-.13-.27-.2-.57-.36Z" /></svg>);
const IconEmpty = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300" {...props}><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>);

// ---- Komponen UI Kecil ----
const Avatar = ({ name }: { name: string }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  // Warna pastel acak bisa ditambahkan, di sini kita pakai Indigo statis agar bersih
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0 border border-indigo-200">
      {initial}
    </div>
  );
};

const TableSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border-b border-slate-100">
        <div className="rounded-full bg-slate-200 h-10 w-10"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </div>
);

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
    const unsub = onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Customer[];
      setCustomers(rows);
      setLoading(false);
    }, (err) => {
      console.error('listen customer error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(
    () => customers.filter((c) => (c?.nama ?? '').toLowerCase().includes(q.toLowerCase()) || (c?.alamat ?? '').toLowerCase().includes(q.toLowerCase()) || (c?.telpon ?? '').toLowerCase().includes(q.toLowerCase())),
    [customers, q]
  );

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm('Hapus pelanggan ini?')) return;
    try {
      await deleteCustomerById(id);
    } catch (err: any) {
      alert('Gagal menghapus: ' + (err?.message || err));
    }
  }

  const makeDefaultWaMsg = (nama?: string) => `Halo ${nama || ''}, saya ingin konfirmasi pesanan.`;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6 px-4">

        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pelanggan</h1>
            <p className="text-slate-500 mt-1">
              Total <strong className="text-slate-900">{customers.length}</strong> pelanggan terdaftar
            </p>
          </div>
          <Button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white hidden sm:flex items-center gap-2 shadow-sm transition-all"
          >
            <IconUserPlus className="w-5 h-5" />
            <span>Tambah Baru</span>
          </Button>
        </div>

        {/* Toolbar & Search */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200/60 p-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconSearch className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, alamat, atau no. telpon..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-none bg-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 text-slate-700 sm:text-sm"
            />
          </div>
        </Card>

        {/* Content Area */}
        <Card className="bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-slate-500 text-left">
                  <th className="px-6 py-4 font-semibold w-[60px]"></th>
                  <th className="px-6 py-4 font-semibold">Nama Pelanggan</th>
                  <th className="px-6 py-4 font-semibold">Kontak</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr><td colSpan={4} className="p-6"><TableSkeleton /></td></tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <IconEmpty className="w-16 h-16 mb-3 opacity-50" />
                        <p className="text-lg font-medium text-slate-600">Tidak ada pelanggan ditemukan</p>
                        <p className="text-sm">Coba kata kunci lain atau tambah pelanggan baru.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 w-[60px]">
                      <Avatar name={c.nama} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-900">{c.nama}</div>
                      <div className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]" title={c.alamat}>
                        {c.alamat || 'Alamat belum diisi'}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {c.telpon ? (
                        <div className="flex items-center gap-2 text-slate-600 font-mono text-xs">
                          <span className="bg-slate-100 px-2 py-1 rounded">{c.telpon}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100">
                        <Button
                          onClick={() => openWhatsApp(c.telpon, makeDefaultWaMsg(c.nama))}
                          disabled={!c.telpon}
                          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 p-2 rounded-lg border border-green-100 disabled:opacity-30"
                          title="Chat WhatsApp"
                        >
                          <IconWhatsApp className="w-4 h-4" />
                        </Button>
                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        <Button
                          variant="ghost"
                          onClick={() => { setEditing(c); setShowForm(true); }}
                          className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-2"
                        >
                          <IconEdit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(c.id)}
                          className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-2"
                        >
                          <IconTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="sm:hidden divide-y divide-slate-100">
            {loading && <div className="p-4"><TableSkeleton /></div>}

            {!loading && filtered.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 px-4 text-center">
                <IconEmpty className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-slate-600 font-medium">Data tidak ditemukan</p>
              </div>
            )}

            {!loading && filtered.map((c) => (
              <div key={c.id} className="p-4 bg-white active:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar name={c.nama} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-slate-900 truncate pr-2">{c.nama}</h3>
                    </div>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{c.alamat || 'Alamat kosong'}</p>

                    {/* Info Bar Mobile */}
                    <div className="flex items-center gap-3 mt-3">
                      {c.telpon ? (
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {c.telpon}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No HP kosong</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Bar Mobile */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-3">
                  <Button
                    onClick={() => openWhatsApp(c.telpon, makeDefaultWaMsg(c.nama))}
                    disabled={!c.telpon}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded-lg disabled:opacity-50 disabled:bg-slate-300 shadow-sm"
                  >
                    <IconWhatsApp className="w-4 h-4" />
                    Chat WA
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => { setEditing(c); setShowForm(true); }}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
                    >
                      <IconEdit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-slate-200"
                    >
                      <IconTrash className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
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

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="sm:hidden fixed bottom-20 right-6 h-14 w-14 bg-slate-900 text-white rounded-full shadow-xl shadow-slate-900/30 flex items-center justify-center active:scale-95 transition-transform z-40"
        aria-label="Tambah Pelanggan"
      >
        <IconUserPlus className="w-7 h-7" />
      </button>
    </div>
  );
}