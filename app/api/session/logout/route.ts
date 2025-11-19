// app/api/session/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ status: "logged_out" });
  res.cookies.set("session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    // path: "/",
    maxAge: 0,
  });
  return res;
}
