// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { auth } from "@/lib/firebaseAdmin";

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;

  const isAuthedRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
                        req.nextUrl.pathname.startsWith("/sessions") ||
                        req.nextUrl.pathname.startsWith("/goals") ||
                        req.nextUrl.pathname.startsWith("/analytics") ||
                        req.nextUrl.pathname.startsWith("/export");

  if (isAuthedRoute) {
    try {
      await auth.verifySessionCookie(sessionCookie || "", true);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sessions/:path*", "/goals/:path*", "/analytics/:path*", "/export/:path*"],
};
