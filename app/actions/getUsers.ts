"use server"

import { adminDb } from "@/lib/firebaseAdmin";

export async function getAllAttendees() {
    try {
        const snapshot = await adminDb.collection("users").get();
        const attendees = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: attendees };
    } catch (error) {
        console.error("Error fetching attendees:", error);
        return { success: false, error: "Failed to fetch data" };
    }
}