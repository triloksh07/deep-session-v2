// lib/authHandlers.ts
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";

async function setSessionCookie(idToken: string) {
  await fetch("/api/session/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export async function login(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      return { success: false, error: "Please verify your email before logging in." };
    }
    const idToken = await cred.user.getIdToken();
    await setSessionCookie(idToken);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function signup(email: string, password: string, name: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await sendEmailVerification(cred.user);
    return { success: true, message: "Verification email sent. Please check your inbox." };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function loginWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const idToken = await cred.user.getIdToken();
    await setSessionCookie(idToken);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function loginWithGithub() {
  try {
    const cred = await signInWithPopup(auth, new GithubAuthProvider());
    const idToken = await cred.user.getIdToken();
    await setSessionCookie(idToken);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
