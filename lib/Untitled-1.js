// Perfect 🎉 — now we can wire your **auth‑scoped service account** into **DeepSession v3** so that session verification is secure, cookie‑based, and enforced both client‑ and server‑side. Here’s the integrationPerfect 🎉 — now we can wire your **auth‑scoped service account** into **DeepSession v3** so that session verification is secure, cookie‑based, and enforced both client‑ and server‑side. Here’s the integration plan:

// ---

// ## 🏗️ Step 1: Add Firebase Admin SDK with your restricted service account
// Create `lib/firebaseAdmin.ts`:

// ```ts
// import admin from "firebase-admin";

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g plan:

// ---

// ## 🏗️ Step 1: Add Firebase Admin SDK with your restricted service account
// Create `lib/firebaseAdmin.ts`:

// ```ts
// import admin from "firebase-admin";

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     }),
//   });
// }

// export const, "\n"),
//     }),
//   });
// }

// export const authAdmin = admin.auth();
// ```

// - This uses your **restricted service account** (only `roles/firebase authAdmin = admin.auth();
// ```

// - This uses your **restricted service account** (only `roles/firebaseauth.admin`).
// - Keys are pulled from environment variables (never hardcoded).
// - This instance is what middleware and API routes will use for verification.

// ---

// ## 🏗️ Step 2: Create API route to exchange ID token → secure cookie
// Inside `app/api/session/set/routeauth.admin`).
// - Keys are pulled from environment variables (never hardcoded).
// - This instance is what middleware and API routes will use for verification.

// ---

// ## 🏗️ Step 2: Create API route to exchange ID token → secure cookie
// Inside `app/api/session/set/route.ts`:

// ```ts
// import { NextResponse } from "next/server";
// import { authAdmin } from "@/lib/firebaseAdmin";

// export async function POST(req: Request) {
//   const { idToken } = await req.json();

//   try {
//     await authAdmin.verifyIdToken(idToken);

//     const expiresIn = 60 *.ts`:

// ```ts
// import { NextResponse } from "next/server";
// import { authAdmin } from "@/lib/firebaseAdmin";

// export async function POST(req: Request) {
//   const { idToken } = await req.json();

//   try {
//     await authAdmin.verifyIdToken(idToken);

//     const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
//     const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

//     const res = NextResponse.json({ status: "success" });
//     res.cookies.set("session", sessionCookie, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: expiresIn / 1000,
//     });

//     return res;
//   } catch {
//     return NextResponse.json({ error: " 60 * 24 * 5 * 1000; // 5 days
//     const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

//     const res = NextResponse.json({ status: "success" });
//     res.cookies.set("session", sessionCookie, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: expiresIn / 1000,
//     });

//     return res;
//   } catch {
//     return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//   }
// }
// ```

// ---

// ## 🏗️ Step 3: Client SDK login → call cookie API
// In your login handler:

// ```ts
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "@/lib/firebase";

// export async functionInvalid token" }, { status: 401 });
//   }
// }
// ```

// ---

// ## 🏗️ Step 3: Client SDK login → call cookie API
// In your login handler:

// ```ts
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "@/lib/firebase";

// export async function login(email: string, password: string) {
//   const userCred = await signInWithEmailAndPassword(auth, email, password);
//   const idToken = await userCred.user.getIdToken();

//   await fetch("/api/session/set", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ idToken }),
//   });
// }
// ```

// This ensures that after login, the login(email: string, password: string) {
//   const userCred = await signInWithEmailAndPassword(auth, email, password);
//   const idToken = await userCred.user.getIdToken();

//   await fetch("/api/session/set", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ idToken }),
//   });
// }
// ```

// This ensures that after login, the secure cookie is secure cookie is set server‑side.

// ---

// ## 🏗️ Step 4: Middleware for protected routes
// `middleware.ts`:

// ```ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { authAdmin } from "@/lib/firebaseAdmin";

// export async function middleware(req: NextRequest) {
//   const sessionCookie = req.cookies set server‑side.

// ---

// ## 🏗️ Step 4: Middleware for protected routes
// `middleware.ts`:

// ```ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { authAdmin } from "@/lib/firebaseAdmin";

// export async function middleware(req: NextRequest) {
//   const sessionCookie = req.cookies.get("session")?.value;

//   const is.get("session")?.value;

//   const isAuthedRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
//                         req.nextUrl.pathname.startsWith("/sessions") ||
//                         req.nextUrl.pathname.startsWith("/goals") ||
//                         req.nextUrl.pathname.startsWith("/analytics") ||
//                         req.nextUrl.pathname.startsWith("/export");

//   if (isAuthedRoute) {
//     try {
//       await authAdmin.verifySessionAuthedRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
//                         req.nextUrl.pathname.startsWith("/sessions") ||
//                         req.nextUrl.pathname.startsWith("/goals") ||
//                         req.nextUrl.pathname.startsWith("/analytics") ||
//                         req.nextUrl.pathname.startsWith("/export");

//   if (isAuthedRoute) {
//     try {
//       await authAdmin.verifySessionCookie(sessionCookie || "", true);
//       return NextResponse.next();
//     } catch {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcherCookie(sessionCookie || "", true);
//       return NextResponse.next();
//     } catch {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*", "/sessions/:path*", "/goals/:path*", "/analytics/:path*", "/export/:path*"],
// };
// ```

// ---

// ## 🛡️ Security Notes
// - Your **restricted service account** ensures this middleware can only touch Firebase Auth.  
// - Cookies are `httpOnly`, `secure`, `sameSite=strict`.  
// - Client‑side guards (`useAuth`) still provide UX smoothness, but server‑side middleware enforces true protection.  

// ---

// ## 🚀 Next Steps
// - Add a **logout API route** later to clear the cookie + call `signOut`.  
// - Test the flow: login → cookie set → middleware allows access → logout → cookie cleared → middleware blocks access.  
// - Audit IAM to confirm your `session-verifier` account only has `roles/firebaseauth.admin`.

// ---

// 👉 You’re now ready to integrate the service account into DS v3. Do you want me to sketch out the **logout flow** next, or focus on **testing strategies** (like verifying middleware blocks unauthenticated requests)?