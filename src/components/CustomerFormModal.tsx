import React, { useState } from 'react';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const NAVY = '#0a2342';

export type CustomerFormValues = {
  id?: string;
  nama: string;
  alamat?: string;
  telpon?: string;
};

export function CustomerFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CustomerFormValues;
  onClose: () => void;
  onSubmit: (c: CustomerFormValues) => Promise<any> | any; // boleh async
}) {
  const [nama, setNama] = useState(initial?.nama ?? '');
  const [alamat, setAlamat] = useState(initial?.alamat ?? '');
  const [telpon, setTelpon] = useState(initial?.telpon ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const payload: CustomerFormValues = {
        id: initial?.id,
        nama: nama.trim(),
        alamat: alamat.trim(),
        telpon: telpon.trim(),
      };
      await onSubmit(payload); // tunggu proses simpan (create/update)
      // Catatan: biasanya parent akan menutup modal ketika sukses.
      // Kalau mau modal ini yang menutup, bisa panggil onClose() di sini.
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={submitting ? undefined : onClose} title={initial?.id ? 'Edit Konsumen' : 'Tambah Konsumen'}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4">
        {errorMsg && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <Input
          label="Nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          disabled={submitting}
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
        />
        <TextArea
          label="Alamat"
          rows={3}
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          disabled={submitting}
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
        />
        <Input
          label="No Telpon"
          value={telpon}
          onChange={(e) => setTelpon(e.target.value)}
          disabled={submitting}
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-[color:var(--navy,#0a2342)] hover:bg-[#0a2342]/5 disabled:opacity-60"
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-60"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Menyimpan...
              </span>
            ) : (
              'Simpan'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
