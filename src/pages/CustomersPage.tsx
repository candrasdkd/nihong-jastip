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
const COL = 'customer';

// ---- Ikon SVG yang Ditingkatkan ----
const IconUserPlus = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>);
const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>);
const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const IconWhatsApp = (props: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.52 3.48A11.94 11.94 0 0 0 12.06 0C5.47.03.15 5.36.18 11.95a11.87 11.87 0 0 0 1.7 6.17L0 24l5.99-1.85a11.93 11.93 0 0 0 6.07 1.66h.01c6.59-.04 11.91-5.37 11.93-11.96a11.9 11.9 0 0 0-3.48-8.37Zm-8.46 18.3a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.56 1.1 1.12-3.47-.23-.36a9.9 9.9 0 1 1 8.08 4.33ZM17.2 14.3c-.3-.16-1.78-.88-2.05-.98-.27-.1-.47-.16-.66.16-.2.32-.77.98-.95 1.18-.18.2-.35.23-.65.08-.3-.16-1.27-.47-2.43-1.5-.9-.8-1.5-1.8-1.67-2.1-.17-.32-.02-.49.13-.64.13-.12.3-.32.45-.48.15-.16.2-.27.3-.45.1-.18.05-.34-.02-.48-.08-.16-.66-1.6-.9-2.2-.24-.58-.48-.5-.66-.51h-.56c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.99 2.67 1.12 2.85.14.18 1.96 2.98 4.75 4.18.66.28 1.18.45 1.58.58.66.21 1.27.18 1.75.11.53-.08 1.78-.73 2.04-1.44.25-.7.25-1.3.18-1.44-.08-.13-.27-.2-.57-.36Z" /></svg>);

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
    if (!confirm('Hapus pelanggan ini? Semua data pesanan yang terkait tidak akan terhapus.')) return;
    try {
      await deleteCustomerById(id);
    } catch (err: any) {
      alert('Gagal menghapus: ' + (err?.message || err));
    }
  }

  const makeDefaultWaMsg = (nama?: string) => `Halo ${nama || ''}, saya ingin konfirmasi pesanan.`;

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold text-slate-800">Daftar Pelanggan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola semua data pelanggan Anda di satu tempat.</p>
        </header>

        {/* Main Content Area */}
        <Card className="bg-white p-4 sm:p-6 shadow-sm">
          {/* Toolbar atas */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
            <Input
              placeholder="Cari nama, alamat, atau no. telpon..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[300px] lg:min-w-[400px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {/* ===== MODIFIED: Button is now hidden on small screens ===== */}
            <Button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="bg-slate-800 hover:bg-slate-900 text-white hidden sm:flex items-center gap-1.5"
            >
              <IconUserPlus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </Button>
          </div>

          {/* Desktop table */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="text-slate-600">
                  {['Nama', 'Alamat', 'No Telpon', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={4}>Memuat data...</td></tr>
                )}
                {!loading && filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">{c.nama}</td>
                    <td className="px-4 py-3 text-slate-600 min-w-[240px]">{c.alamat || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{c.telpon || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" onClick={() => { setEditing(c); setShowForm(true); }}>Edit</Button>
                        <Button variant="danger-ghost" onClick={() => handleDelete(c.id)}>Hapus</Button>
                        <Button
                          onClick={() => openWhatsApp(c.telpon, makeDefaultWaMsg(c.nama))}
                          disabled={!c.telpon}
                          title="Kirim WhatsApp"
                          className="bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 disabled:bg-slate-100 flex items-center gap-1.5 !px-2.5 !py-1.5 text-xs font-semibold"
                        >
                          <IconWhatsApp className="w-4 h-4" />
                          <span>WA</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={4}>Pelanggan tidak ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {loading && <p className="text-center text-sm text-slate-500 py-8">Memuat data...</p>}
            {!loading && filtered.map((c) => (
              <Card key={c.id} className="p-0 overflow-hidden">
                <div className="p-4 flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{c.nama}</p>
                    <p className="text-sm text-slate-500">{c.alamat || 'Alamat tidak diisi'}</p>
                    <p className="text-sm text-slate-600 font-medium mt-1">{c.telpon || 'No. telpon tidak diisi'}</p>
                  </div>
                  <Button
                    onClick={() => openWhatsApp(c.telpon, makeDefaultWaMsg(c.nama))}
                    disabled={!c.telpon}
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 disabled:opacity-60 disabled:bg-slate-100 shrink-0"
                    aria-label="Kirim WhatsApp"
                  >
                    <IconWhatsApp className="w-5 h-5" />
                  </Button>
                </div>
                <div className="bg-slate-50 px-4 py-2 flex gap-2 border-t border-slate-200">
                  <Button variant="ghost" onClick={() => { setEditing(c); setShowForm(true); }}>
                    <IconEdit className="w-4 h-4 mr-1.5" /> Edit
                  </Button>
                  <Button variant="danger-ghost" onClick={() => handleDelete(c.id)}>
                    <IconTrash className="w-4 h-4 mr-1.5" /> Hapus
                  </Button>
                </div>
              </Card>
            ))}
            {!loading && filtered.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-8">Tidak ada data pelanggan.</p>
            )}
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

      {/* ===== NEW: Floating Action Button for Mobile ===== */}
      <Button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="sm:hidden fixed bottom-20 right-6 z-40 bg-slate-800 hover:bg-slate-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        aria-label="Tambah Pelanggan Baru"
      >
        <IconUserPlus className="w-6 h-6" />
      </Button>
    </div>
  );
}