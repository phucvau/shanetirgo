import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminJwt } from "@/lib/admin-jwt";

const PUBLIC_ADMIN_ROUTES = [
  "/auth/admin/login",
  "/auth/admin/forgot-password",
  "/auth/admin/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;
  const payload = await verifyAdminJwt(token);
  const hasSession = Boolean(payload);

  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      const loginUrl = new URL("/auth/admin/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (PUBLIC_ADMIN_ROUTES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/auth/admin/login", "/auth/admin/forgot-password", "/auth/admin/reset-password"],
};
