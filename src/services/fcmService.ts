import { messaging, db } from "../lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const fcmService = {
    /**
     * Get FCM Token and save it to Firestore
     * @param userId UID associated with the token
     * @param vapidKey VAPID key from Firebase Console
     */
    async registerToken(userId: string, vapidKey: string) {
        if (!messaging) {
            return;
        }

        try {
            // Ensure Service Worker is ready first
            if (!("serviceWorker" in navigator)) {
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            const token = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: registration
            });

            if (token) {
                await setDoc(doc(db, "fcm_tokens", userId), {
                    token,
                    updatedAt: serverTimestamp(),
                    platform: "web",
                });
                return token;
            }
        } catch (err: any) {
            // Keep essential error logging
            console.error("[fcmService] Error retrieving token:", err);
        }
    },

    /**
     * Listen for foreground messages
     */
    onForegroundMessage(callback: (payload: any) => void) {
        if (!messaging) return;
        return onMessage(messaging, (payload) => {
            console.log("[FCM] Foreground message received:", payload);
            callback(payload);
        });
    }
};
