// Card.tsx
import React from "react";
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl shadow-md bg-white dark:bg-neutral-900 border border-[#0a2342]/10 dark:border-[#0a2342]/30 ${className}`}
    >
      {children}
    </div>
  );
}
