import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";

interface NotificationPermissionModalProps {
    isOpen: boolean;
    isDenied?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
    isOpen,
    isDenied = false,
    onClose,
    onConfirm,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
                    >
                        <div className="p-6 sm:p-8">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-6">
                                {/* Icon Circle */}
                                <div className="relative">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full bg-indigo-500/20"
                                    />
                                    <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border ${isDenied ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'}`}>
                                        <Bell size={40} className={isDenied ? "" : "animate-bounce-slow"} />
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isDenied ? "Akses Notifikasi Diblokir" : "Aktifkan Notifikasi?"}
                                    </h3>
                                    <p className="text-slate-500 dark:text-neutral-400 leading-relaxed">
                                        {isDenied
                                            ? "Anda telah memblokir notifikasi. Untuk mendapatkan update pesanan, harap aktifkan kembali secara manual di setelan browser."
                                            : "Dapatkan update terbaru mengenai status pesanan dan penawaran menarik langsung di browser Anda."}
                                    </p>
                                </div>

                                {/* Denial Instructions if needed */}
                                {isDenied && (
                                    <div className="w-full p-4 bg-slate-50 dark:bg-neutral-800 rounded-2xl text-left space-y-2">
                                        <p className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">Cara mengaktifkan:</p>
                                        <ol className="text-xs text-slate-500 dark:text-neutral-400 list-decimal list-inside space-y-1">
                                            <li>Klik ikon <span className="font-bold">Gembok</span> atau <span className="font-bold">Setelan</span> di bar alamat browser.</li>
                                            <li>Cari bagian <span className="font-bold">Notifikasi</span>.</li>
                                            <li>Ubah dari <span className="font-bold text-rose-500">Blokir</span> menjadi <span className="font-bold text-emerald-500">Izinkan</span>.</li>
                                            <li>Refresh halaman ini.</li>
                                        </ol>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col w-full gap-3 pt-4">
                                    {!isDenied ? (
                                        <>
                                            <button
                                                onClick={onConfirm}
                                                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                                            >
                                                Ya, Aktifkan Sekarang
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="w-full py-3 px-6 bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-300 rounded-2xl font-semibold transition-all"
                                            >
                                                Nanti Saja
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={onClose}
                                            className="w-full py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
                                        >
                                            Mengerti
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Subtle Footer Info */}
                        <div className="px-6 py-4 bg-slate-50/50 dark:bg-neutral-800/50 border-t border-slate-100 dark:border-neutral-800 text-center">
                            <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider">
                                {isDenied ? "Status: Diblokir oleh Browser" : "Anda dapat mematikan ini kapan saja di setelan browser"}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
