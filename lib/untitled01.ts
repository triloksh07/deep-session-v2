// Perfect timing 🎉 — now that you’ve got your **auth‑scoped service account** locked down, let’s wire it into **DeepSession v3** so your session verification is secure and seamless. Here’s the integration roadmap:

// ---

// ## 🏗️ Step 1: Add Admin SDK with your restricted service account
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

// export const authAdmin = admin.auth();
// ```

// - This uses your **restricted service account** (only `roles/firebaseauth.admin`).  
// - Keys are pulled from environment variables (never hardcoded).  

// ---

// ## 🏗️ Step 2: Create API route to exchange ID token → session cookie
// Inside `app/api/session/set/route.ts`:

// ```ts
// import { NextResponse } from "next/server";
// import { authAdmin } from "@/lib/firebaseAdmin";

// export async function POST(req: Request) {
//   const { idToken } = await req.json();

//   try {
//     // Verify ID token
//     await authAdmin.verifyIdToken(idToken);

//     // Create secure session cookie
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

// ---

// ## 🏗️ Step 4: Middleware for protected routes
// `middleware.ts`:

// ```ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { authAdmin } from "@/lib/firebaseAdmin";

// export async function middleware(req: NextRequest) {
//   const sessionCookie = req.cookies.get("session")?.value;

//   const isAuthedRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
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
//   matcher: ["/dashboard/:path*", "/sessions/:path*", "/goals/:path*", "/analytics/:path*", "/export/:path*"],
// };
// ```

// ---

// ## 🛡️ Security Notes
// - Your **restricted service account** ensures this middleware can only touch Firebase Auth.  
// - Cookies are `httpOnly`, `secure`, `sameSite=strict`.  
// - Client-side guards (`useAuth`) still provide UX smoothness, but server-side middleware enforces true protection.  

// ---

// ## 🚀 Next Steps
// - Add a **logout API route** to clear the cookie (we’ll do this later).  
// - Test the flow: login → cookie set → middleware allows access → logout → cookie cleared → middleware blocks access.  

// ---

// 👉 You’ve now got the **auth‑scoped service account integrated into DS v3**. Do you want me to sketch out the **logout flow** next, or focus on **testing strategies** (like how to confirm middleware is actually blocking unauthenticated requests)?