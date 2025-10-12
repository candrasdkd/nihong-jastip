import { useEffect, useState } from "react";
import { Input } from "./Input";
import { formatIDR } from "../../utils/format";

/** ===== Rupiah Input (masking) ===== */
export function RupiahInput({
    label,
    value,
    onChange,
    disabled,
    className,
    placeholder = 'Rp 0',
}: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}) {
    const fmt = (n: number) => formatIDR(Math.max(0, Math.floor(n || 0)));
    const [text, setText] = useState<string>(value ? fmt(value) : '');

    // Sinkronisasi ketika prop value berubah dari luar
    useEffect(() => {
        setText(value ? fmt(value) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value ?? '';
        const digits = raw.replace(/[^\d]/g, '');
        if (!digits) {
            setText('');
            onChange(0);
            return;
        }
        const n = Number(digits);
        setText(fmt(n));
        onChange(n);
    };

    return (
        <Input
            label={label}
            type="text"
            value={text}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            className={className}
        />
    );
}