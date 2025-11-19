// app/api/session/set/route.ts
import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebase-admin"; // Firebase Admin SDK

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }
    // Verify Firebase ID token
    const decodedToken = await authAdmin.verifyIdToken(idToken, true);
    // Create a session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ status: "success" });
    res.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      // path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    return res;

  } catch (e: any) {
    return NextResponse.json({
      status: '401',
      message: 'Unauthorized',
      error: e.message || "Invalid token"
    }, { status: 401 });
  }
}
