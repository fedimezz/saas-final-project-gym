// GET /api/auth/google
// Starts the Google OAuth "Authorization Code" flow by redirecting the
// browser to Google's consent screen. Google redirects back to
// /api/auth/callback/google with a `code` once the user approves.
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "La connexion Google n'est pas configurée." },
      { status: 501 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${baseUrl}/api/auth/callback/google`;

  // CSRF protection: a one-time random value stored in a short-lived
  // cookie, verified against the `state` Google echoes back in the
  // callback before we trust anything in that request.
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: baseUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 60 * 5,
  });
  return response;
}
