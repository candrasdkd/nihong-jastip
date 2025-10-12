// TabButton.tsx
import React from 'react';
export function TabButton({
  current,
  setTab,
  id,
  children,
}: {
  current: string;
  setTab: (t: any) => void;
  id: 'dashboard' | 'orders' | 'customers' | 'calculator' | 'cash';
  children: React.ReactNode;
}) {
  const active = current === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-xl text-sm font-medium border transition
        ${active
          ? 'bg-[#0a2342] text-white border-[#0a2342]'
          : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-[#0a2342]/20 dark:border-[#0a2342]/30 hover:bg-[#0a2342]/5 dark:hover:bg-neutral-800'
        }`}
    >
      {children}
    </button>
  );
}
