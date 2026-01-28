import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { payload } = body;
        const { name, email, idea, idToken } = payload;

        console.log("Received request with data:", { name, email, idea, idToken });

        if (!idToken) {
            return NextResponse.json({ error: "Missing ID Token" }, { status: 400 });
        }

        // 1. Verify idToken and get the UserID
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Create user
        await adminDb.collection("users").doc(uid).set({
            Payed: false,
            email: email,
            idea: idea,
            name: name,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: uid,
            approved: "pending",
        }, { merge: true });

        console.log("Data saved successfully!");
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin SDK Error:", error.message);
        return NextResponse.json({
            error: "Authentication failed",
            details: error.message
        }, { status: 401 });
    }
}