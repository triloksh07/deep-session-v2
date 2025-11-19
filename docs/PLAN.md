# Project structure and core auth wiring

Below is a clean, scalable app structure and the essential code to get DeepSession v3 running with secure middleware, Firebase Admin, API routes for session lifecycle, Server Components for reads, and Server Actions for writes.

---

## Directory layout

```txt
app/
  (public)/
    login/page.tsx
    signup/page.tsx
    verify-email/page.tsx
  (authed)/
    dashboard/
      layout.tsx
      page.tsx                  # redirects to /dashboard/overview
      overview/page.tsx
      goals/page.tsx
      sessions/page.tsx
      analytics/page.tsx
      exportdata/page.tsx
      goals/actions.ts          # 'use server' (mutations)
      sessions/actions.ts       # 'use server' (mutations)
  api/
    session/
      set/route.ts              # mint secure cookie
      logout/route.ts           # clear cookie
    export/route.ts             # CSV/PDF generation (admin-only)

lib/
  firebase.ts                   # client SDK
  firebase-admin.ts             # Admin SDK (server-only)
  server/
    auth.ts                     # getUserId(), verifySessionCookie helper
    data.ts                     # server-side Firestore queries

middleware.ts                   # bidirectional guard
```

---

## Firebase Admin initialization (server-only)

```ts
// lib/firebase-admin.ts
import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
} else {
  adminApp = getApps()[0]!;
}

export const authAdmin = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
```

Environment variables (never commit keys):
```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

---

## Client SDK initialization

```ts
// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
```

---

## Session verification helper (server)

```ts
// lib/server/auth.ts
import { cookies } from "next/headers";
import { authAdmin } from "@/lib/firebase-admin";

export async function verifySessionCookie() {
  const session = cookies().get("session")?.value;
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
```

---

## Middleware: bidirectional guard with email verification

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authAdmin } from "@/lib/firebase-admin";

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  const isAuthedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/sessions") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/exportdata") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile");

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/auth");

  // No cookie: block protected routes, allow public
  if (!sessionCookie) {
    if (isAuthedRoute) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Cookie exists: verify
  try {
    const decoded = await authAdmin.verifySessionCookie(sessionCookie, true);

    // If visiting auth pages while authenticated → go to dashboard
    if (isAuthPage) {
      // If not verified, route to verify page
      if (!decoded.email_verified && !pathname.startsWith("/verify-email")) {
        return NextResponse.redirect(new URL("/verify-email", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard/overview", req.url));
    }

    // Enforce verification for authed routes
    if (isAuthedRoute && !decoded.email_verified) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired cookie → redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/verify-email",
    "/auth",
    "/dashboard/:path*",
    "/sessions/:path*",
    "/goals/:path*",
    "/analytics/:path*",
    "/exportdata/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};
```

---

## API route: set session cookie

```ts
// app/api/session/set/route.ts
import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decodedIdToken = await authAdmin.verifyIdToken(idToken, true);
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ success: true });
    res.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Invalid token" }, { status: 401 });
  }
}
```

---

## API route: logout (clear cookie)

```ts
// app/api/session/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ status: "logged_out" });
  res.cookies.set("session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
```

---

## Public pages: login and signup (client)

Use a client wrapper so the page itself can remain a Server Component if you prefer.

```tsx
// app/(public)/login/page.tsx
import AuthClient from "./AuthClient";

export default function LoginPage() {
  return <AuthClient defaultTab="login" />;
}
```

```tsx
// app/(public)/signup/page.tsx
import AuthClient from "../login/AuthClient";

export default function SignupPage() {
  return <AuthClient defaultTab="signup" />;
}
```

```tsx
// app/(public)/login/AuthClient.tsx
"use client";

import { Auth } from "@/components/Auth";
import { login, signup, loginWithGoogle, loginWithGithub } from "@/lib/authHandlers";

export default function AuthClient({ defaultTab = "login" }: { defaultTab?: "login" | "signup" }) {
  return (
    <Auth
      onLogin={login}
      onSignup={signup}
      onGoogleSignIn={loginWithGoogle}
      onGitHubSignIn={loginWithGithub}
      isLoading={false}
      isProviderLoading={false}
      defaultTab={defaultTab}
    />
  );
}
```

---

## Auth handlers (client) that call session APIs

```ts
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
```

Note: Providers often return already-verified emails; middleware still enforces `email_verified` for consistency.

---

## Verify email page (server + client UI)

```tsx
// app/(public)/verify-email/page.tsx
import { verifySessionCookie } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage() {
  const decoded = await verifySessionCookie();

  // If no session, send to login
  if (!decoded) redirect("/login");

  // If verified, go to dashboard
  if (decoded.email_verified) redirect("/dashboard/overview");

  return (
    <div className="container mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Verify your email</h1>
      <p className="text-muted-foreground mt-2">
        We’ve sent a verification link to {decoded.email}. Please check your inbox.
      </p>
      <form action="/api/session/logout" method="post" className="mt-6">
        <button className="btn btn-outline" type="submit">Logout</button>
      </form>
    </div>
  );
}
```

Optional: Add a client button to resend verification using Client SDK.

---

## Authed layout and pages (server components)

```tsx
// app/(authed)/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <aside className="w-64 p-4 border-r">
        {/* Sidebar, nav, etc. */}
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

```tsx
// app/(authed)/dashboard/page.tsx
import { redirect } from "next/navigation";

export default function DashboardIndex() {
  redirect("/dashboard/overview");
}
```

```tsx
// app/(authed)/dashboard/sessions/page.tsx
import { getUserId } from "@/lib/server/auth";
import { getSessionsData } from "@/lib/server/data";
import SessionLog from "./SessionLogClient";

export default async function SessionsPage() {
  const uid = await getUserId();
  const sessions = uid ? await getSessionsData(uid) : [];
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <SessionLog initialSessions={sessions} />
    </div>
  );
}
```

Client wrapper for interactive component:

```tsx
// app/(authed)/dashboard/sessions/SessionLogClient.tsx
"use client";
import { useState } from "react";

export default function SessionLog({ initialSessions }: { initialSessions: any[] }) {
  const [data] = useState(initialSessions);
  return <div>{/* render sessions */}</div>;
}
```

Server-side data helper:

```ts
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
```

---

## Server Actions example

```ts
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
```

Client-side mutation can call the server action directly or via a simple wrapper.

---

## Next steps

- Wire your existing Auth component into the public pages (done above).
- Add role-based checks (custom claims) for admin-only endpoints like `/api/export`.
- Add audit logging for verification failures and sensitive mutations.
- Configure revalidation per route: dynamic views `revalidate = 0`, static/summary views with a short cache.

If you want, I can provide a compact checklist to commit as SECURITY.md and a quick CI smoke test script to validate login, verification redirect, and protected route access.