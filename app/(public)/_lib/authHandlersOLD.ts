import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser, // Rename to avoid conflict
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';

async function setSessionCookie(idToken: string) {
  await fetch("/api/session/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export async function login(email: string, password: string) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCred.user.getIdToken();
    await setSessionCookie(idToken);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function signup(email: string, password: string, name: string) {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: name });
    const idToken = await userCred.user.getIdToken();
    await setSessionCookie(idToken);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(auth, provider);
    const idToken = await userCred.user.getIdToken();
    await setSessionCookie(idToken);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function loginWithGithub() {
  try {
    const provider = new GithubAuthProvider();
    const userCred = await signInWithPopup(auth, provider);
    const idToken = await userCred.user.getIdToken();
    await setSessionCookie(idToken);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
