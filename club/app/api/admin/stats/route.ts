// GET /api/admin/stats — aggregate KPIs for the admin/owner "Vue d'ensemble"
// dashboard.
//
// FIX: this file used to be a stray copy-paste of the /api/admin/subscriptions
// route — same code, same `{ subscriptions, pagination }` response shape.
// The overview page expects fields like `totalMembers`, `activeMembers`, etc,
// none of which existed in that response, so every stat silently fell back
// to 0 via the frontend's `Number(json.xxx ?? 0)` guards. This is the actual
// stats aggregation.
//
// Open to both ADMIN and OWNER (requireAdmin) — the frontend hides the
// profit/staff-count cards from ADMIN per the role permission matrix, this
// route just always computes everything.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { todayAsDayOfWeek } from "@/lib/session-date";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayDow = todayAsDayOfWeek(now);

    const [
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      activeSubscriptions,
      pendingSubscriptions,
      expiredSubscriptions,
      totalSessionsBooked,
      attendancesToday,
      unreadNotifications,
      revenueAgg,
      totalCoaches,
      totalAdmins,
      todaysReservations,
      todaysClasses,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
      prisma.user.count({
        where: { role: "MEMBER", createdAt: { gte: startOfMonth } },
      }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "PENDING" } }),
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
      prisma.userSession.count({ where: { isCancelled: false } }),
      prisma.attendance.count({ where: { checkInTime: { gte: startOfToday } } }),
      prisma.notification.count({
        where: { userId: auth.user.id, isRead: false },
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // Sessions don't have a dedicated Coach entity yet — `coach` is a
      // free-text name on Session, so "total coaches" counts distinct names.
      prisma.session.findMany({ select: { coach: true }, distinct: ["coach"] }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.userSession.count({
        where: {
          isCancelled: false,
          bookedAt: { gte: startOfToday },
        },
      }),
      prisma.session.count({
        where: { day: todayDow, weeklyPlan: { isActive: true } },
      }),
    ]);

    return NextResponse.json({
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      activeSubscriptions,
      pendingSubscriptions,
      expiredSubscriptions,
      totalSessionsBooked,
      attendancesToday,
      unreadNotifications,
      revenueThisMonth: revenueAgg._sum.amount ?? 0,
      totalCoaches: totalCoaches.length,
      totalAdmins,
      todaysReservations,
      todaysClasses,
    });
  } catch (error) {
    console.error("Admin stats GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
