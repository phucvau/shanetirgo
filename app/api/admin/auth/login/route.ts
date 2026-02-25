import { NextResponse } from "next/server";
import { createAdminJwt } from "@/lib/admin-jwt";

const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:4002";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${orderServiceUrl}/admin-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    const user = result?.user;
    const token = await createAdminJwt(
      {
        sub: String(user?.username || "admin"),
        username: String(user?.username || "admin"),
        email: String(user?.email || ""),
      },
      60 * 60 * 12
    );

    const next = NextResponse.json(result, { status: 200 });
    next.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return next;
  } catch (error) {
    return NextResponse.json(
      { message: "Cannot login", error: (error as Error).message },
      { status: 500 }
    );
  }
}
