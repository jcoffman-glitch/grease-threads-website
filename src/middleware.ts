import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes restricted to admin only (technicians cannot access)
  const adminOnlyPaths = ["/admin/social", "/admin/marketing", "/admin/reports", "/admin/customers", "/admin/warranty"];

  // Allow login page through (redirect to admin if already logged in as admin/technician)
  if (pathname.startsWith("/admin/login")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token && (token.role === "admin" || token.role === "technician" || token.role === "it")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Protect all /admin and /api/admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // Check admin or technician role
    if (token.role !== "admin" && token.role !== "technician" && token.role !== "it") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    // Block technicians from admin-only routes
    if (token.role === "technician" && adminOnlyPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Protect /account route (customers must be logged in)
  if (pathname.startsWith("/account")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*"],
};
