// POST /api/auth/verify  { email, code }
// Confirms the 6-digit code sent at registration and marks the account
// as email-verified.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashSecret } from "@/lib/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { formatZodError, otpSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = otpSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { email: normalizedEmail, code } = parsed.data;

    // A 6-digit code is only ~1M possibilities — without this, an attacker
    // could brute-force it well within the 15-minute expiry window. Limit
    // both per-email (the real target) and per-IP (in case they rotate
    // emails), matching the pattern already used in resend-code.
    const emailLimit = await checkRateLimit(`verify:email:${normalizedEmail}`, 8, 15 * 60 * 1000);
    const ipLimit = await checkRateLimit(`verify:ip:${getClientIp(request)}`, 30, 15 * 60 * 1000);
    if (!emailLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Deliberately generic error — don't reveal whether the email exists.
    const invalidResponse = NextResponse.json(
      { error: "Code invalide ou expiré" },
      { status: 400 }
    );

    if (!user || !user.verificationCodeHash || !user.verificationCodeExpiry) {
      return invalidResponse;
    }

    if (user.verificationCodeExpiry < new Date()) {
      return invalidResponse;
    }

    if (hashSecret(code) !== user.verificationCodeHash) {
      return invalidResponse;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationCodeHash: null,
        verificationCodeExpiry: null,
      },
    });

    return NextResponse.json({ message: "Email vérifié avec succès" });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification" },
      { status: 500 }
    );
  }
}
