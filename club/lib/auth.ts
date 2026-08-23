// src/lib/auth.ts

import jwt, { type SignOptions } from "jsonwebtoken";
import prisma from "@/lib/prisma";

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Add JWT_SECRET to your .env file."
    );
  }
  return secret;
}

export const generateToken = (
  payload: JWTPayload,
  expiresIn: SignOptions["expiresIn"] = "7d"
): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "string") return null;
    return decoded as JWTPayload;
  } catch {
    return null;
  }
};

export const getTokenFromHeader = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1] ?? null;
};

export const AUTH_COOKIE_NAME = "token";

// Cookie-first (the JWT lives only in the httpOnly cookie now — the
// Authorization header fallback stays only for non-browser callers like
// the cron job, which authenticate differently anyway).
export const getTokenFromRequest = (request: Request): string | null => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (match) {
    return decodeURIComponent(match.slice(AUTH_COOKIE_NAME.length + 1));
  }
  return getTokenFromHeader(request);
};

export type AuthResult =
  | { ok: true; user: JWTPayload }
  | { ok: false; status: 401 | 403 };

function getTokenPayload(request: Request): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

// Re-verifies the token's subject against the database. Previously every
// requireX() below trusted the JWT's `role` claim for the full life of the
// token (up to 7 days) with no DB check at all — an account suspended via
// PATCH /api/admin/members/[id] (or /api/admin/staff/[id]) kept a fully
// working session until its token happened to expire, and a role change
// (promotion/demotion) didn't take effect until re-login either.
//
// This adds one indexed primary-key lookup per authenticated request. For
// a single-club app that's the right tradeoff — proportionate, not the
// "unnecessary Redis/caching" the production brief explicitly warned
// against — but it's worth knowing about if this ever needs to scale to
// very high request volume, since it does mean auth is no longer a purely
// stateless JWT check.
async function getVerifiedAccount(
  payload: JWTPayload
): Promise<{ id: string; email: string; role: string; name: string } | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, name: true, isActive: true },
  });
  if (!dbUser || !dbUser.isActive) return null;
  // Use the CURRENT role/name/email from the DB, not the possibly-stale
  // JWT claims — so a demoted/promoted account is judged correctly even
  // while holding an old token.
  return { id: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.name };
}

/** Any logged-in, active user (MEMBER, ADMIN, OWNER, or COACH). */
export async function requireUser(request: Request): Promise<AuthResult> {
  const payload = getTokenPayload(request);
  if (!payload) return { ok: false, status: 401 };
  const account = await getVerifiedAccount(payload);
  if (!account) return { ok: false, status: 403 };
  return { ok: true, user: account };
}

/** ADMIN or OWNER only, and currently active. */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  const payload = getTokenPayload(request);
  if (!payload) return { ok: false, status: 401 };
  const account = await getVerifiedAccount(payload);
  if (!account) return { ok: false, status: 403 };
  if (!["ADMIN", "OWNER"].includes(account.role?.toUpperCase())) {
    return { ok: false, status: 403 };
  }
  return { ok: true, user: account };
}

/** OWNER only, and currently active. */
export async function requireOwner(request: Request): Promise<AuthResult> {
  const payload = getTokenPayload(request);
  if (!payload) return { ok: false, status: 401 };
  const account = await getVerifiedAccount(payload);
  if (!account) return { ok: false, status: 403 };
  if (account.role?.toUpperCase() !== "OWNER") {
    return { ok: false, status: 403 };
  }
  return { ok: true, user: account };
}

/** COACH only, and currently active (not ADMIN/OWNER — staff manage coaches, they don't act as one). */
export async function requireCoach(request: Request): Promise<AuthResult> {
  const payload = getTokenPayload(request);
  if (!payload) return { ok: false, status: 401 };
  const account = await getVerifiedAccount(payload);
  if (!account) return { ok: false, status: 403 };
  if (account.role?.toUpperCase() !== "COACH") {
    return { ok: false, status: 403 };
  }
  return { ok: true, user: account };
}

// IMPORTANT: secure cookies are silently dropped by the browser over
// plain http://. This checks the real request URL instead of trusting
// NODE_ENV blindly, so the cookie isn't lost on a local production build
// or a fresh deploy before HTTPS is configured.
export function buildAuthCookieOptions(requestUrl?: string) {
  const isHttps = requestUrl
    ? requestUrl.startsWith("https://")
    : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
  };
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};