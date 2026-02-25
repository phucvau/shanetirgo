import { NextResponse } from "next/server";

export async function POST() {
  const next = NextResponse.json({ ok: true });
  next.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return next;
}
