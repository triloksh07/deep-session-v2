// lib/server/data.ts
import { adminDb } from "@/lib/firebase-admin";

export async function getSessionsData(uid: string) {
  const snap = await adminDb
    .collection("sessions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
