// Button.tsx
import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'navy' | 'outline';
type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'className' | 'disabled' | 'onClick'
> & {
  children: React.ReactNode;
  variant?: Variant;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'px-4 py-2 rounded-xl font-medium transition active:scale-[0.99] focus:outline-none focus:ring-2 flex-shrink-0 inline-flex items-center justify-center gap-2';
  const variants: Record<Variant, string> = {
    // primary = ORANGE solid
    primary:
      'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-400',
    // ghost = light neutral (override per-use untuk navy text jika perlu)
    ghost:
      'bg-white text-neutral-800 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 focus:ring-neutral-400 border border-transparent',
    // solid NAVY
    navy: 'bg-[#0a2342] text-white hover:bg-[#081a31] focus:ring-[#0a2342]/40',
    // outline navy
    outline:
      'bg-white text-[#0a2342] border border-[#0a2342]/30 hover:bg-[#0a2342]/5 focus:ring-[#0a2342]/30',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400',
  };

  const disabledCls = disabled ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <button
      {...rest}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabledCls} ${className}`}
    >
      {children}
    </button>
  );
}
