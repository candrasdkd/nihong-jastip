import React, { useState } from 'react';
import { Customer } from '../types';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const NAVY = '#0a2342';

export function CustomerFormModal({
  initial,
  onClose,
  onSubmit,
}: { initial?: Customer; onClose: () => void; onSubmit: (c: Customer) => void; }) {
  const [nama, setNama] = useState(initial?.nama || '');
  const [alamat, setAlamat] = useState(initial?.alamat || '');
  const [telpon, setTelpon] = useState(initial?.telpon || '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Customer = { id: initial?.id || crypto.randomUUID(), nama, alamat, telpon };
    onSubmit(payload);
  }

  return (
    <Modal onClose={onClose} title={initial ? 'Edit Konsumen' : 'Tambah Konsumen'}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4">
        <Input
          label="Nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <TextArea
          label="Alamat"
          rows={3}
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <Input
          label="No Telpon"
          value={telpon}
          onChange={(e) => setTelpon(e.target.value)}
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            className="text-[color:var(--navy,#0a2342)] hover:bg-[#0a2342]/5"
          >
            Batal
          </Button>
          <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
