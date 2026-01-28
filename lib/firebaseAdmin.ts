import "server-only";
import admin from "firebase-admin";

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    const adminApp = admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // This regex replaces literal '\n' strings with actual newline characters
            privateKey: privateKey?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

// Export initialized services for use in API routes
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();