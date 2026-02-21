/**
 * Service to handle Web Notifications and Permission requests.
 */

export const notificationService = {
    /**
     * Request permission to show notifications.
     */
    async requestPermission(): Promise<NotificationPermission> {
        console.log("[NotificationService] Requesting permission...");

        if (!("Notification" in window)) {
            console.warn("[NotificationService] Browser does not support notifications");
            return "denied";
        }

        if (Notification.permission === "granted") {
            console.log("[NotificationService] Permission already granted");
            return "granted";
        }

        try {
            const permission = await Notification.requestPermission();
            console.log("[NotificationService] Permission result:", permission);
            return permission;
        } catch (error) {
            console.error("[NotificationService] Error requesting permission:", error);
            return "denied";
        }
    },

    /**
     * Check if permission is currently granted.
     */
    isPermissionGranted(): boolean {
        return "Notification" in window && Notification.permission === "granted";
    },

    /**
     * Show a local browser notification.
     */
    async showLocalNotification(title: string, options?: NotificationOptions) {
        if (!this.isPermissionGranted()) {
            console.warn("[NotificationService] Permission not granted.");
            return;
        }

        const notificationOptions: any = {
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            vibrate: [100, 50, 100],
            body: options?.body,
            tag: options?.tag,
            ...options,
        };

        try {
            // Prefer Service Worker for PWA compatibility
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration) {
                    await registration.showNotification(title, notificationOptions);
                    return;
                }
            }

            // Fallback to standard API
            new Notification(title, notificationOptions);
        } catch (error) {
            console.error("[NotificationService] Error showing notification:", error);
        }
    },

    /**
     * Logic to check orders and notify if needed
     */
    checkAndNotifyOrders(orders: any[]) {
        const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Belum Membayar");
        console.log(`[NotificationService] Checking ${orders.length} orders, found ${pendingOrders.length} pending.`);

        if (pendingOrders.length > 0) {
            this.showLocalNotification("Pesanan Butuh Perhatian", {
                body: `Ada ${pendingOrders.length} pesanan yang masih pending / belum dibayar.`,
                tag: "pending-orders",
            });
        }
    }
};
