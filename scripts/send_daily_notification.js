const admin = require("firebase-admin");

// 1. Initialize Firebase Admin
// We expect FIREBASE_SERVICE_ACCOUNT to be a JSON string
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const fcm = admin.messaging();

async function sendDailyNotification() {
    console.log("--- Starting Daily Notification Script ---");

    try {
        // 2. Fetch Pending Orders
        console.log("Fetching pending orders...");
        const ordersSnap = await db.collection("orders")
            .where("status", "in", ["Pending", "Belum Membayar"])
            .get();

        const pendingCount = ordersSnap.size;
        console.log(`Found ${pendingCount} pending orders.`);

        if (pendingCount === 0) {
            console.log("No pending orders found. Skipping notification.");
            return;
        }

        // 3. Fetch FCM Tokens
        console.log("Fetching FCM tokens...");
        const tokensSnap = await db.collection("fcm_tokens").get();
        const tokens = tokensSnap.docs.map(doc => doc.data().token).filter(t => !!t);

        if (tokens.length === 0) {
            console.log("No registered FCM tokens found.");
            return;
        }

        console.log(`Sending notification to ${tokens.length} devices...`);

        // 4. Send Notification via FCM
        const message = {
            notification: {
                title: "📦 Pengingat Pesanan",
                body: `Ada ${pendingCount} pesanan yang butuh perhatian hari ini. Yuk cek dashboard!`,
            },
            tokens: tokens,
        };

        const response = await fcm.sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} messages.`);

        if (response.failureCount > 0) {
            console.warn(`Failed to send ${response.failureCount} messages.`);
        }

    } catch (error) {
        console.error("Error in daily notification script:", error);
        process.exit(1);
    }

    console.log("--- Script Finished ---");
}

sendDailyNotification();
