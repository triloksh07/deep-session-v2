// app/(authed)/dashboard/sessions/actions.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getUserId } from "@/lib/server/auth";
import { revalidatePath } from "next/cache";

export async function updateSessionTitle(id: string, title: string) {
  const uid = await getUserId();
  if (!uid) throw new Error("Not authenticated");

  const ref = adminDb.collection("sessions").doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Not found");
  if (doc.data()?.uid !== uid) throw new Error("Forbidden");

  await ref.update({ title });
  revalidatePath("/dashboard/sessions");
  return { success: true };
}
