"use server"

import { adminDb } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";

export async function updateUserStatus(uid: string, isApproved: boolean, status: string) {
    try {
        if (status === 'approved') {
            await adminDb.collection("users").doc(uid).update({
                approved: "approved",
                submittedAt: new Date().toISOString()
            });
            revalidatePath("/dashboard");
            return { success: true };

        } else if (status === 'rejected') {
            await adminDb.collection("users").doc(uid).update({
                approved: "rejected",
                submittedAt: new Date().toISOString()
            });
            revalidatePath("/dashboard");
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false };
    }
}