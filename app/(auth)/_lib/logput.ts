import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function logout() {
  // End Firebase client session
  await signOut(auth);

  // Clear secure cookie via API
  await fetch("/api/session/logout", {
    method: "POST",
  });
}
