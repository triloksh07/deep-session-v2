
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function loginOld(email: string, password: string) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCred.user.getIdToken();

    await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
}

export async function login(provider: "email" | "google" | "github", creds?: { email: string; password: string }) {
    let userCred;

    if (provider === "email" && creds) {
        userCred = await signInWithEmailAndPassword(auth, creds.email, creds.password);
    } else if (provider === "google") {
        userCred = await signInWithPopup(auth, new GoogleAuthProvider());
    } else if (provider === "github") {
        userCred = await signInWithPopup(auth, new GithubAuthProvider());
    } else {
        throw new Error("Unsupported provider or missing credentials");
    }

    const idToken = await userCred.user.getIdToken();

    await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
}
