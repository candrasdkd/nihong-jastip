import React, { useMemo, useState } from 'react';
import { Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CustomerFormModal } from '../components/CustomerFormModal';

const NAVY = '#0a2342';

export function CustomersPage({ customers, setCustomers }: { customers: Customer[]; setCustomers: any; }) {
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const filtered = useMemo(
    () => customers.filter((c) => c.nama.toLowerCase().includes(q.toLowerCase())),
    [customers, q]
  );

  function handleDelete(id: string) {
    if (!confirm('Hapus konsumen ini?')) return;
    setCustomers((prev: Customer[]) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
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
          + Tambah Konsumen
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
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="odd:bg-white even:bg-orange-50 hover:bg-orange-100/60 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium">{c.nama}</td>
                <td className="px-4 py-3 min-w-[240px]">{c.alamat}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.telpon}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="text-[color:var(--navy,#0a2342)] hover:bg-[#0a2342]/5"
                      onClick={() => { setEditing(c); setShowForm(true); }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(c.id)}>Hapus</Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map((c) => (
          <Card key={c.id} className="p-4 border border-[#0a2342]/10">
            <div className="font-semibold">{c.nama}</div>
            <div className="text-sm text-neutral-600">{c.alamat || '-'}</div>
            <div className="text-sm">{c.telpon || ''}</div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                className="text-[color:var(--navy,#0a2342)] hover:bg-[#0a2342]/5"
                onClick={() => { setEditing(c); setShowForm(true); }}
              >
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDelete(c.id)}>Hapus</Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-neutral-500">Tidak ada data.</p>
        )}
      </div>

      {showForm && (
        <CustomerFormModal
          initial={editing || undefined}
          onClose={() => setShowForm(false)}
          onSubmit={(val) => {
            setCustomers((prev: Customer[]) => {
              if (editing) return prev.map((p) => (p.id === editing.id ? val : p));
              return [val, ...prev];
            });
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
