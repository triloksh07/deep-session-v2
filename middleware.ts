// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authAdmin } from '@/lib/firebase-admin';

export async function middleware(req: NextRequest) {
    const sessionCookie = req.cookies.get("session")?.value;
    // const pathname = req.nextUrl.pathname;
    const { pathname } = req.nextUrl;

    const isAuthedRoute =
        pathname.startsWith("/dashboard/*") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/sessions") ||
        pathname.startsWith("/goals") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/export") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/profile");

    const isAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/verify-email") ||
        pathname.startsWith("/auth");

    // Case 1: No cookie → block protected routes, allow public
    if (!sessionCookie) {
        if (isAuthedRoute) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        return NextResponse.next();
    }
    // Case 2: Cookie exists → verify for protected routes
    try {
        const decoded = await authAdmin.verifySessionCookie(sessionCookie, true);

        // If visiting auth pages while ✅ authenticated → go to dashboard
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

        // For other public routes, just continue
        return NextResponse.next();
    } catch {
        // ❌ Invalid/expired cookie → clear session and redirect to login
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

// Apply middleware only to protected routes
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


// --- new middleware.ts ---
// Lightweight checks only: read cookies, redirect if missing.
// import { NextResponse } from 'next/server';

// export const config = {
//   matcher: ['/dashboard/:path*'],
// };

// export function middleware(req: Request) {
//   // const session = req.headers.get("cookie")?.includes("session=");
//   const sessionCookie = req.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];
//   if (!sessionCookie) {
//     return NextResponse.redirect(new URL('/login', req.url));
//   }
//   // ✅ Do not verify here (edge runtime can't use firebase-admin)
//   return NextResponse.next();
// }
