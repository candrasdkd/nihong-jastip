// Select.tsx
import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export function Select({ label, children, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-1 text-sm text-neutral-600 dark:text-neutral-300">
          {label}
        </span>
      )}

      <div className="relative">
        <select
          {...props}
          className={[
            // ukuran & spacing (stabil di Safari)
            "block w-full rounded-xl pl-3 pr-10 py-2.5 text-base",
            // border & bg (dark mode OK)
            "border border-neutral-300 dark:border-neutral-700",
            "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100",
            // hilangkan UI native Safari (arrow, inner-shadow)
            "appearance-none [-webkit-appearance:none] [-moz-appearance:none] shadow-none bg-clip-padding",
            // fokus & aksesibilitas
            "outline-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "transition",
            className,
          ].join(" ")}
          // Fallback jika Tailwind arbitrary disabled oleh config
          style={
            {
              WebkitAppearance: "none",
              backgroundImage: "none",
              WebkitTapHighlightColor: "transparent",
              // bantu sistem tentukan palet highlight yang benar di dark mode
              colorScheme: "light dark",
            } as React.CSSProperties
          }
        >
          {children}
        </select>

        {/* Ikon caret custom (tidak menghalangi klik) */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </label>
  );
}
