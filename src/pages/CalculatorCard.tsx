import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatIDR } from '../utils/format';
import { computeTotal } from '../utils/helpers';

const NAVY = '#0a2342';

export function CalculatorCard({
  unitPrice,
  openUnitPrice,
}: { unitPrice: number; openUnitPrice: () => void; }) {
  const [kg, setKg] = useState<string>('1');

  const total = useMemo(() => {
    // Replace comma with a dot for accurate float parsing
    const normalizedKg = kg.replace(',', '.');
    const numericKg = parseFloat(normalizedKg) || 0;
    return computeTotal(numericKg, unitPrice);
  }, [kg, unitPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Allow only digits, a single comma, and an empty string
    const sanitizedValue = value.match(/^[0-9,]*$/) ? value : kg;
    const commaCount = sanitizedValue.split(',').length - 1;

    if (commaCount <= 1) {
      setKg(sanitizedValue);
    }
  };

  return (
    <div className="max-w-xl">
      <Card className="p-5 bg-white border border-[#0a2342]/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-[color:var(--navy,#0a2342)]">
              Kalkulator Harga
            </h2>
            <p className="text-sm text-neutral-600">
              Rumus: <span className="font-medium">total = ceil(kg) × {formatIDR(unitPrice)}</span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              * Pembulatan ke atas ke kilogram penuh (ceil). Contoh: 0,2 kg → 1 kg.
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={openUnitPrice}
            className="text-[color:var(--navy,#0a2342)] hover:bg-[#0a2342]/5"
          >
            Ubah Harga
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mt-4">
          <Input
            label="Berat (Kg)"
            type="text" // Change to text for full control
            inputMode="decimal" // This suggests the decimal keyboard on mobile
            value={kg}
            onChange={handleInputChange}
            className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />

          <div>
            <label className="block mb-1 text-sm text-neutral-600">Total Harga</label>
            <div className="px-3 py-2 rounded-xl border border-[#0a2342]/20 bg-white font-semibold text-[color:var(--navy,#0a2342)]">
              {formatIDR(total)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}