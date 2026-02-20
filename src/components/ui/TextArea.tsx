// TextArea.tsx
import React from "react";
export function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-1 text-sm text-neutral-600 dark:text-neutral-300">
          {label}
        </span>
      )}
      <textarea
        {...props}
        className={`w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${props.className || ""}`}
      />
    </label>
  );
}
