// GET /api/admin/analytics — aggregate revenue/growth analytics.
// OWNER only — Admin accounts don't get profit/business-level analytics
// (see the role permission matrix).
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalMembers,
      activeSubscriptions,
      newMembersThisMonth,
      newMembersLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      attendanceLast30Days,
      planBreakdown,
      allPaidPayments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.subscription.count({
        where: { status: "ACTIVE", endDate: { gt: now } },
      }),
      prisma.user.count({
        where: { role: "MEMBER", createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({
        where: {
          role: "MEMBER",
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfLastMonth, lt: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.attendance.count({
        where: { checkInTime: { gte: thirtyDaysAgo } },
      }),
      prisma.subscription.groupBy({
        by: ["planId"],
        where: { status: "ACTIVE", endDate: { gt: now } },
        _count: { _all: true },
      }),
      prisma.payment.findMany({
        where: { status: "PAID", paidAt: { gte: sixMonthsAgo } },
        select: { amount: true, paidAt: true },
      }),
    ]);

    const plans = await prisma.membershipPlan.findMany({
      where: { id: { in: planBreakdown.map((p) => p.planId) } },
      select: { id: true, name: true },
    });
    const planNameById = new Map(plans.map((p) => [p.id, p.name]));

    // Bucket the last 6 months of paid payments into a revenue-by-month series.
    const monthBuckets: { label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthBuckets.push({
        label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        revenue: 0,
      });
    }
    for (const payment of allPaidPayments) {
      if (!payment.paidAt) continue;
      const monthsAgo =
        (now.getFullYear() - payment.paidAt.getFullYear()) * 12 +
        (now.getMonth() - payment.paidAt.getMonth());
      const bucketIndex = 5 - monthsAgo;
      if (bucketIndex >= 0 && bucketIndex < 6) {
        monthBuckets[bucketIndex].revenue += payment.amount;
      }
    }

    return NextResponse.json({
      totalMembers,
      activeSubscriptions,
      newMembersThisMonth,
      memberGrowthPct:
        newMembersLastMonth > 0
          ? Math.round(((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100)
          : null,
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      revenueLastMonth: revenueLastMonth._sum.amount ?? 0,
      attendanceLast30Days,
      planBreakdown: planBreakdown.map((p) => ({
        planId: p.planId,
        planName: planNameById.get(p.planId) ?? "Plan inconnu",
        activeSubscriptions: p._count._all,
      })),
      revenueByMonth: monthBuckets,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
