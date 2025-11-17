// app/api/session/set/route.ts
import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebaseAdmin"; // Firebase Admin SDK

export async function POST(req: Request) {
  const { idToken } = await req.json();

  try {
    // Verify Firebase ID token
    const decodedToken = await authAdmin.verifyIdToken(idToken);

    // Create a session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ status: "success" });
    res.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: expiresIn / 1000,
    });

    return res;

  } catch {
    return NextResponse.json({ status: 'Unauthorized', error: "Invalid token" }, { status: 401 });
  }
}
