import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/bcrypt";
import { generateToken, AUTH_COOKIE_NAME, buildAuthCookieOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { formatZodError, loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { email: normalizedEmail, password, rememberMe } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        subscriptions: {
          where: {
            status: "ACTIVE",
            endDate: { gt: new Date() },
          },
          take: 1,
          include: {
            plan: true,
          },
        },
        membershipCard: true,
      },
    });

    const invalidCredentialsResponse = NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 }
    );

    if (!user) {
      return invalidCredentialsResponse;
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Votre compte a été désactivé. Contactez l'administrateur." },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "Ce compte utilise la connexion Google. Cliquez sur \"Continuer avec Google\".",
        },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return invalidCredentialsResponse;
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Veuillez vérifier votre email avant de vous connecter.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const expiresIn = rememberMe ? "30d" : "7d";
    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      expiresIn
    );

    const activeSubscription = user.subscriptions[0] || null;

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      membershipCard: user.membershipCard,
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            plan: activeSubscription.plan.name,
            endDate: activeSubscription.endDate,
            status: activeSubscription.status,
          }
        : null,
    };

    const response = NextResponse.json({
      message: "Connexion réussie",
      user: userData,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      ...buildAuthCookieOptions(request.url),
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion" },
      { status: 500 }
    );
  }
}