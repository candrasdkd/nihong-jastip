import React, { forwardRef } from "react";

// --- Utility Kecil untuk Menggabungkan Class (Inline) ---
// Jika Anda sudah punya 'clsx' atau 'tailwind-merge', silakan pakai itu.
// Ini versi sederhana agar file ini bisa langsung jalan tanpa install library tambahan.
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- Tipe Data ---
type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "navy";

type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

// --- Komponen Button ---
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    // 1. Base Styles (Layout dasar, fokus, transisi)
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    // 2. Variants (Warna & Border)
    const variants: Record<Variant, string> = {
      primary:
        "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 shadow-sm shadow-orange-200",
      navy: "bg-[#0a2342] text-white hover:bg-[#0a2342]/90 focus:ring-[#0a2342] shadow-sm",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400",
      outline:
        "border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
      ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-200",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm shadow-emerald-200",
    };

    // 3. Sizes (Padding & Ukuran Font)
    const sizes: Record<Size, string> = {
      sm: "h-8 px-3 text-xs", // Cocok untuk tombol di dalam Tabel
      md: "h-10 px-4 text-sm", // Default standard
      lg: "h-12 px-8 text-base", // Cocok untuk tombol Login/CTA besar
      icon: "h-10 w-10 p-2", // Khusus jika isinya hanya Icon (kotak)
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className, // Class tambahan dari luar akan ditambahkan di sini
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
