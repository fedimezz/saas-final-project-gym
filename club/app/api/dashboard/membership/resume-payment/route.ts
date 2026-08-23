import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, isAuthResponse } from "@/lib/auth-server";
import { initKonnectPayment } from "@/lib/payments/konnect";

// POST /api/dashboard/membership/resume-payment
//
// Called from the "Adhésion" page when a member has a PENDING subscription
// that was started with ONLINE payment but never completed (e.g. they
// closed the Konnect tab, or the payment link's 30-minute lifespan
// expired). Re-opens a fresh Konnect payment session for the SAME
// pending payment record and hands back a new payUrl to redirect to.
//
// NOTE: this route didn't exist even though the frontend has always
// called it (handleResumePayment in app/dashboard/membership/page.tsx) —
// the "Reprendre le paiement" button 404'd. Added here.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (isAuthResponse(auth)) return auth;
    const userId = auth.id;

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "PENDING" },
      include: {
        plan: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucune souscription en attente à relancer" },
        { status: 404 }
      );
    }

    const payment = subscription.payments[0];

    if (!payment || payment.paymentMethod !== "ONLINE") {
      return NextResponse.json(
        { error: "Cette souscription n'a pas de paiement en ligne à relancer" },
        { status: 400 }
      );
    }

    if (payment.status === "PAID") {
      return NextResponse.json(
        { error: "Ce paiement a déjà été validé" },
        { status: 409 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    try {
      const { payUrl, paymentRef } = await initKonnectPayment({
        amountTnd: payment.amount,
        description: `Abonnement ${subscription.plan.name}`,
        orderId: payment.id,
        firstName: user?.name?.split(" ")[0],
        lastName: user?.name?.split(" ").slice(1).join(" ") || undefined,
        email: user?.email,
        phoneNumber: user?.phone || undefined,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: paymentRef, status: "PENDING" },
      });

      return NextResponse.json({ paymentUrl: payUrl });
    } catch (err) {
      console.error("Konnect resume-payment init error:", err);
      return NextResponse.json(
        { error: "Impossible de relancer le paiement en ligne. Réessayez ou payez à l'accueil." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Membership resume-payment POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
