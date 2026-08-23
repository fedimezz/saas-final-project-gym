import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, isAuthResponse } from "@/lib/auth-server";
import { initKonnectPayment } from "@/lib/payments/konnect";
import { formatZodError, subscribeSchema } from "@/lib/validation";

// POST /api/dashboard/membership/subscribe  { planId, paymentMethod: "ONLINE" | "ONSITE" }
//
//   - ONSITE  → subscription stays PENDING until an admin marks it ACTIVE
//               once cash/card payment is collected at the front desk.
//   - ONLINE  → subscription + payment are created PENDING, a Konnect
//               payment session is opened, and the payer is redirected to
//               `payUrl` to complete the payment. The subscription is only
//               flipped to ACTIVE once /api/payments/konnect/webhook
//               confirms the payment server-side.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (isAuthResponse(auth)) return auth;
    const userId = auth.id;

    const rawBody = await request.json().catch(() => null);
    const parsed = subscribeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { planId, paymentMethod, promoCode } = parsed.data;

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan introuvable ou inactif" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "Votre compte est suspendu. Contactez le club." }, { status: 403 });
    }

    // Everything below runs in a single transaction so the "does the user
    // already have a subscription" check and the create can't race each
    // other on a double-click or a flaky double-submit.
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.subscription.findFirst({
        where: {
          userId,
          OR: [{ status: "ACTIVE", endDate: { gt: new Date() } }, { status: "PENDING" }],
        },
      });

      if (existing) {
        throw new Error(existing.status === "PENDING" ? "ALREADY_PENDING" : "ALREADY_ACTIVE");
      }

      // Optional promo code: validate, apply the discount, and atomically
      // claim one use so two people redeeming the last slot at once can't
      // both succeed (updateMany's WHERE guard makes this a real check,
      // not a read-then-write race).
      let finalPrice = plan.price;
      let appliedPromotionId: string | null = null;

      if (promoCode && String(promoCode).trim()) {
        const code = String(promoCode).trim().toUpperCase();
        const promo = await tx.promotion.findUnique({ where: { code } });
        const now = new Date();

        if (
          !promo ||
          !promo.isActive ||
          promo.startDate > now ||
          (promo.endDate && promo.endDate < now) ||
          (promo.maxUses !== null && promo.usedCount >= promo.maxUses)
        ) {
          throw new Error("INVALID_PROMO");
        }

        const claim = await tx.promotion.updateMany({
          where: {
            id: promo.id,
            ...(promo.maxUses !== null ? { usedCount: { lt: promo.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claim.count === 0) throw new Error("INVALID_PROMO"); // lost the race for the last slot

        finalPrice =
          promo.discountType === "PERCENT"
            ? Math.max(0, plan.price * (1 - promo.discountValue / 100))
            : Math.max(0, plan.price - promo.discountValue);
        finalPrice = Math.round(finalPrice * 100) / 100;
        appliedPromotionId = promo.id;
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          startDate,
          endDate,
          status: "PENDING", // awaiting payment confirmation / admin approval
        },
      });

      const payment = await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: finalPrice,
          currency: "TND",
          status: "PENDING",
          paymentMethod,
          ...(appliedPromotionId ? { promotionId: appliedPromotionId } : {}),
        },
      });

      return { subscription, payment };
    });

    // ONSITE: nothing more to do, admin will confirm manually.
    if (paymentMethod === "ONSITE") {
      return NextResponse.json({
        message: "Demande enregistrée. Finalisez le paiement à l'accueil pour activer votre abonnement.",
        subscription: result.subscription,
        payment: result.payment,
      });
    }

    // ONLINE: open a Konnect payment session and hand back the payUrl.
    try {
      const { payUrl, paymentRef } = await initKonnectPayment({
        amountTnd: result.payment.amount,
        description: `Abonnement ${plan.name}`,
        orderId: result.payment.id,
        firstName: user?.name?.split(" ")[0],
        lastName: user?.name?.split(" ").slice(1).join(" ") || undefined,
        email: user?.email,
        phoneNumber: user?.phone || undefined,
      });

      await prisma.payment.update({
        where: { id: result.payment.id },
        data: { transactionId: paymentRef },
      });

      return NextResponse.json({
        message: "Redirection vers le paiement en ligne...",
        subscription: result.subscription,
        payment: result.payment,
        paymentUrl: payUrl,
      });
    } catch (err) {
      console.error("Konnect init-payment error:", err);
      // Roll the subscription/payment back so the user isn't stuck with a
      // dangling PENDING request they can never pay for.
      await prisma.payment.delete({ where: { id: result.payment.id } }).catch(() => {});
      await prisma.subscription.delete({ where: { id: result.subscription.id } }).catch(() => {});
      return NextResponse.json(
        { error: "Impossible d'initier le paiement en ligne. Réessayez ou payez à l'accueil." },
        { status: 502 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ALREADY_ACTIVE") {
      return NextResponse.json({ error: "Vous avez déjà un abonnement actif" }, { status: 409 });
    }
    if (message === "ALREADY_PENDING") {
      return NextResponse.json(
        { error: "Une demande d'abonnement est déjà en attente" },
        { status: 409 }
      );
    }
    if (message === "INVALID_PROMO") {
      return NextResponse.json(
        { error: "Ce code promo est invalide, expiré ou épuisé" },
        { status: 400 }
      );
    }
    console.error("Membership subscribe POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
