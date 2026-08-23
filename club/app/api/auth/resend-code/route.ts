// POST /api/auth/resend-code  { email }
// Issues a fresh verification code and emails it. Rate-limited per
// email since this is an unauthenticated, enumeration-sensitive endpoint.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateVerificationCode, hashSecret, minutesFromNow } from "@/lib/otp";
import { sendEmail, verificationCodeEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatZodError, resendCodeSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = resendCodeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { email: normalizedEmail } = parsed.data;

    const rl = await checkRateLimit(`resend-code:${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success even if the user doesn't exist or is already
    // verified — don't let this endpoint be used to enumerate accounts.
    if (user && !user.emailVerified) {
      const code = generateVerificationCode();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCodeHash: hashSecret(code),
          verificationCodeExpiry: minutesFromNow(15),
        },
      });
      const { subject, html } = verificationCodeEmail(code);
      await sendEmail({ to: user.email, subject, html });
    }

    return NextResponse.json({
      message: "Si ce compte existe, un nouveau code a été envoyé.",
    });
  } catch (error) {
    console.error("Resend code error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
