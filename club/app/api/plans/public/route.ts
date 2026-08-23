import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public, unauthenticated: only active plans, only the fields a visitor
// should see (no isActive/createdAt/etc). Used by the marketing /offres
// page and the homepage PricingSection so real, owner-set prices show up
// instead of hardcoded copy.
export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        durationDays: true,
        features: true,
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Public plans GET error:", error);
    return NextResponse.json({ plans: [] });
  }
}
