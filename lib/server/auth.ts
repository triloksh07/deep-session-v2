// lib/server/auth.ts
import { cookies } from "next/headers";
import { authAdmin } from "@/lib/firebase-admin";

export async function verifySessionCookie() {
    const session = (await cookies()).get("session")?.value;
    if (!session) return null;

    try {
        // second param 'true' enforces revocation check
        const decoded = await authAdmin.verifySessionCookie(session, true);
        return decoded; // contains uid, email, email_verified, etc.
    } catch {
        return null;
    }
}

export async function getUserId() {
    const decoded = await verifySessionCookie();
    return decoded?.uid ?? null;
}
