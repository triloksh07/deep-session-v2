import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ status: "logged_out" });

  // Clear cookie by setting it to empty with maxAge=0
  res.cookies.set("session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
  });

  return res;
}
