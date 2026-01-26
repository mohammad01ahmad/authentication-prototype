import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import admin from "firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { idToken, name, email, idea } = body;

        console.log("Received request with data:", { name, email, hasIdToken: !!idToken });

        if (!idToken) {
            return NextResponse.json({ error: "Missing ID Token" }, { status: 400 });
        }

        // Verify the token
        console.log("Verifying ID token...");
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        console.log("Token verified successfully for user:", uid);

        // Save to Firestore
        console.log("Saving to Firestore...");
        await adminDb.collection("attendees").doc(uid).set({
            Payed: false,
            email: email,
            idea: idea,
            name: name,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: uid
        }, { merge: true });

        console.log("Data saved successfully!");
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin SDK Error:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return NextResponse.json({
            error: error.message || "Internal server error",
            details: error.code
        }, { status: 401 });
    }
}