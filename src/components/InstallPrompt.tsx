import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Download, X } from 'lucide-react';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Cek Standalone (udah diinstall)
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsStandalone(true);
            return; // Jangan lanjut script
        }

        // Detect mobile
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
            setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
            setIsIOS(/ipad|iphone|ipod/i.test(userAgent.toLowerCase()));
        };

        checkMobile();

        // Listen for PWA install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Paksa Muncul jika dia mobile dan belum terinstall
        // Tunggu 2 detik setelah buka web
        const timer = setTimeout(() => {
            setShowPrompt(true);
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Native install prompt tersedia (Android/Chrome)
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            setDeferredPrompt(null);
            setShowPrompt(false);
        } else {
            // Fallback instruction (iOS/Safari atau jika native prompt disembunyikan/cooling)
            if (isIOS) {
                alert('Untuk install: Tap icon Share (Bagikan) 📤 di bawah layar, lalu pilih "Add to Home Screen" (Tambahkan ke Layar Utama)');
            } else {
                alert('Untuk install: Tap menu titik 3 ⋮ di pojok kanan atas browser, lalu pilih "Add to Home screen" / "Install app"');
            }
            setShowPrompt(false);
        }
    };

    if (!showPrompt || isStandalone || !isMobile) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 left-4 right-4 z-[100] md:bottom-6 md:right-6 md:left-auto md:w-80"
                >
                    <div className="bg-indigo-600 dark:bg-indigo-500 rounded-2xl p-4 shadow-2xl border border-indigo-400/30 text-white relative overflow-hidden group">
                        {/* Background Accent */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />

                        <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-3 rounded-xl shadow-inner">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-sm">Pasang Aplikasi NJ</h3>
                                <p className="text-[11px] text-indigo-100 mt-1 leading-relaxed">
                                    Pasang di HP Anda untuk akses lebih cepat dan pengalaman terbaik!
                                </p>

                                <div className="mt-4 flex items-center gap-2">
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
                                    >
                                        <Download className="w-3 h-3" />
                                        INSTALL SEKARANG
                                    </button>
                                    <button
                                        onClick={() => setShowPrompt(false)}
                                        className="p-2 text-indigo-200 hover:text-white transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
