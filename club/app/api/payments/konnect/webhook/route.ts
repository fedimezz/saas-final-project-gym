import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getKonnectPaymentDetails } from "@/lib/payments/konnect";

// GET /api/payments/konnect/webhook?payment_ref=xxxx
//
// Konnect calls this URL (as a browser redirect, since we don't use
// silentWebhook) once the payer finishes on the gateway page. Per Konnect's
// docs we must NOT trust the redirect itself — we re-fetch the payment
// status server-side via Get Payment Details before touching the DB.
export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const paymentRef = request.nextUrl.searchParams.get("payment_ref");

  if (!paymentRef) {
    return NextResponse.redirect(`${appUrl}/dashboard/membership?payment=error`);
  }

  try {
    const details = await getKonnectPaymentDetails(paymentRef);

    const payment = await prisma.payment.findFirst({
      where: { transactionId: paymentRef },
      include: { subscription: true },
    });

    if (!payment) {
      console.error("Konnect webhook: no payment found for ref", paymentRef);
      return NextResponse.redirect(`${appUrl}/dashboard/membership?payment=error`);
    }

    // Payment already processed (webhook can be called more than once) —
    // don't double-activate / double-extend anything.
    if (payment.status === "PAID") {
      return NextResponse.redirect(`${appUrl}/dashboard/membership?payment=success`);
    }

    if (details.status === "completed" && details.reachedAmount >= details.amount) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date() },
        }),
        prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: "ACTIVE" },
        }),
      ]);
      return NextResponse.redirect(`${appUrl}/dashboard/membership?payment=success`);
    }

    if (details.status === "failed") {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
        prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: "CANCELLED" },
        }),
      ]);
      return NextResponse.redirect(`${appUrl}/dashboard/membership?payment=failed`);
    }

    // Still pending (e.g. payer closed the tab mid-flow) — leave as is,
    // the user can resume from the membership page.
    return NextResponse.redirect(`${appUrl}/dashboard/membership?payment=pending`);
  } catch (error) {
    console.error("Konnect webhook error:", error);
    return NextResponse.redirect(`${appUrl}/dashboard/membership?payment=error`);
  }
}
