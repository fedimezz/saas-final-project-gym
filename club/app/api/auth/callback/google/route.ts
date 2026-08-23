// GET /api/auth/google/callback
// Finishes the Google OAuth flow: exchanges the authorization code for
// tokens, fetches the Google profile, finds-or-creates the matching User,
// and issues the same session cookie the password login uses.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, AUTH_COOKIE_NAME, buildAuthCookieOptions } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const loginUrl = (error: string) => `${baseUrl}/user/login?error=${encodeURIComponent(error)}`;

  const clearStateCookie = (response: NextResponse) => {
    response.cookies.set("google_oauth_state", "", { path: "/api/auth", maxAge: 0 });
    return response;
  };

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return clearStateCookie(NextResponse.redirect(loginUrl("google_not_configured")));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const cookieState = request.cookies.get("google_oauth_state")?.value;

  if (oauthError) {
    // User declined on Google's consent screen — not an app error.
    return clearStateCookie(NextResponse.redirect(loginUrl("google_denied")));
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    return clearStateCookie(NextResponse.redirect(loginUrl("google_state_mismatch")));
  }

  try {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? `${baseUrl}/api/auth/callback/google`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData.error, tokenData.error_description);
      return clearStateCookie(NextResponse.redirect(loginUrl("google_token_failed")));
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return clearStateCookie(NextResponse.redirect(loginUrl("google_userinfo_failed")));
    }

    const profile: GoogleUserInfo = await userInfoRes.json();

    if (!profile.email || !profile.email_verified) {
      // Don't trust an email Google itself hasn't verified.
      return clearStateCookie(NextResponse.redirect(loginUrl("google_email_unverified")));
    }

    const normalizedEmail = profile.email.trim().toLowerCase();

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    let isNewUser = false;

    if (user) {
      if (!user.isActive) {
        return clearStateCookie(NextResponse.redirect(loginUrl("account_disabled")));
      }
      // Link the Google identity to an existing (e.g. password-created)
      // account on first Google sign-in. Google already verified this
      // email address, so we can safely mark it verified too — this also
      // lets someone who signed up with a password but never finished
      // our own email-code step get unblocked via Google instead.
      if (!user.googleId || !user.emailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId ?? profile.sub,
            emailVerified: user.emailVerified ?? new Date(),
            avatar: user.avatar ?? profile.picture ?? null,
          },
        });
      }
    } else {
      isNewUser = true;
      user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name: profile.name?.trim() || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            password: null,
            googleId: profile.sub,
            avatar: profile.picture ?? null,
            role: "MEMBER",
            isActive: true,
            // Google already confirmed this address — skip our own
            // 6-digit code for accounts created this way.
            emailVerified: new Date(),
          },
        });

        const cardNumber = `LCG${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await tx.membershipCard.create({
          data: {
            userId: createdUser.id,
            cardNumber,
            qrCode: `QR-${cardNumber}`,
            expiresAt,
          },
        });

        return createdUser;
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const destination = isNewUser
        ? "/user/onboarding"
        : ["ADMIN", "OWNER"].includes(user.role.toUpperCase())
            ? "/admin"
            : "/dashboard";

    const syncUrl = `${baseUrl}/auth/sync?next=${encodeURIComponent(destination)}`;
    const response = NextResponse.redirect(syncUrl);
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      ...buildAuthCookieOptions(request.url),
      maxAge: 60 * 60 * 24 * 7,
    });
    return clearStateCookie(response);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return clearStateCookie(NextResponse.redirect(loginUrl("google_error")));
  }
}
