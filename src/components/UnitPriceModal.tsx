import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function UnitPriceModal({
  unitPrice, onClose, onSave,
}: { unitPrice: number; onClose: () => void; onSave: (newPrice: number, recalc: boolean) => void; }) {
  const [price, setPrice] = useState(unitPrice);
  const [recalc, setRecalc] = useState(true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = Math.max(0, Math.round(Number.isFinite(price) ? price : 0));
    onSave(clean, recalc);
  }

  return (
    <Modal onClose={onClose} title="Pengaturan Harga Satuan">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4">
        <Input
          label="Harga per Kg (IDR)"
          type="number"
          min={0}
          value={price}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            setPrice(Number.isFinite(n) ? n : 0);
          }}
          required
          className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-xs text-neutral-700">
          Perhitungan total menggunakan <b>pembulatan ke atas (ceil)</b> ke kilogram penuh.
          Contoh: 1,2 kg → 2 kg.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={recalc}
            onChange={(e) => setRecalc(e.target.checked)}
            className="accent-orange-600"
          />
          Terapkan ke semua pesanan yang ada (recalculate total)
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose} className="hover:bg-[#0a2342]/5 text-[#0a2342]">
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
