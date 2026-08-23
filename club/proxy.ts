import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_COOKIE_NAME = "token";

interface MiddlewareJWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/admin");

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/user/login", request.url));
  }

  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not set; denying access in proxy.");
    if (isApiRoute) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/user/login", request.url));
  }

  try {
    // jose uses Web Crypto APIs, which ARE supported in the Edge Runtime
    // (unlike jsonwebtoken, which needs Node's "crypto" module and fails
    // silently/unreliably here — that was the actual bug).
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    const typedPayload = payload as unknown as MiddlewareJWTPayload;
    const role = typedPayload.role?.toUpperCase();

    const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
    if (isAdminPath && !["ADMIN", "OWNER"].includes(role)) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const ownerOnlyPaths = ["/admin/stats", "/admin/promotions", "/admin/roles", "/admin/settings"];
    if (ownerOnlyPaths.some((p) => pathname.startsWith(p)) && role !== "OWNER") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", typedPayload.id);
    requestHeaders.set("x-user-role", role);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (err) {
    console.log("Token verification failed:", err);
    if (isApiRoute) {
      const response = NextResponse.json({ error: "Session invalide" }, { status: 401 });
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }
    const response = NextResponse.redirect(new URL("/user/login", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/dashboard/:path*", "/api/admin/:path*"],
};