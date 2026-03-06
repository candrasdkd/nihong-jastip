import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { X, RefreshCcw } from "lucide-react";

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 p-4 rounded-xl shadow-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-4 max-w-[320px] animate-in slide-in-from-bottom-5">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {offlineReady
            ? "Aplikasi siap offline"
            : "Pembaruan Tersedia"}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {offlineReady
            ? "Aplikasi dapat digunakan tanpa koneksi internet."
            : "Versi baru aplikasi telah tersedia. Muat ulang untuk memperbarui."}
        </p>

        <div className="flex items-center gap-2 mt-3">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCcw size={14} />
              Muat Ulang
            </button>
          )}
          <button
            onClick={() => close()}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
      <button
        onClick={() => close()}
        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
