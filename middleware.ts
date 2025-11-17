import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("authToken"); // or however you store auth

    const isAuthedRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/sessions") ||
        req.nextUrl.pathname.startsWith("/goals") ||
        req.nextUrl.pathname.startsWith("/analytics") ||
        req.nextUrl.pathname.startsWith("/export");

    if (isAuthedRoute && !token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/sessions/:path*", "/goals/:path*", "/analytics/:path*", "/export/:path*"],
};
