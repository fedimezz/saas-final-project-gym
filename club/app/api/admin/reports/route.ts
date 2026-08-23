// GET /api/admin/reports — operational + business reports.
//
// Split by role: `daily` (attendance/membership/payment reports) is
// available to ADMIN and OWNER. `business` (revenue-by-plan, member growth,
// coach performance) is OWNER only, per the role permission matrix — Admin
// gets operational reports but not financial/business ones.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    if (!(await hasPermission(auth.user, "reports.view"))) {
      return NextResponse.json({ error: "Permission requise : consulter les rapports" }, { status: 403 });
    }

    const isOwner = auth.user.role === "OWNER";
    const now = new Date();

    // ── Daily attendance (last 7 days) — everyone ──
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentAttendances = await prisma.attendance.findMany({
      where: { checkInTime: { gte: sevenDaysAgo } },
      select: { checkInTime: true },
    });
    const dailyAttendance: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
      const count = recentAttendances.filter(
        (a) => a.checkInTime.toDateString() === d.toDateString()
      ).length;
      dailyAttendance.push({ label, count });
    }

    // ── Membership report — everyone ──
    const [active, pending, expired, cancelled, suspended] = await Promise.all([
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "PENDING" } }),
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
      prisma.subscription.count({ where: { status: "CANCELLED" } }),
      prisma.subscription.count({ where: { status: "SUSPENDED" } }),
    ]);

    // ── Payment report — everyone ──
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [paidThisMonth, recentPayments] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, amount: true, status: true, paymentMethod: true, createdAt: true,
          subscription: { select: { user: { select: { name: true } } } },
        },
      }),
    ]);

    const base = {
      dailyAttendance,
      membership: { active, pending, expired, cancelled, suspended },
      payments: {
        totalThisMonth: paidThisMonth._sum.amount ?? 0,
        countThisMonth: paidThisMonth._count,
        recent: recentPayments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          method: p.paymentMethod,
          memberName: p.subscription.user.name,
          date: p.createdAt,
        })),
      },
    };

    if (!isOwner) {
      return NextResponse.json(base);
    }

    // ── Owner-only: member growth (last 6 months) + coach performance ──
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const newMembers = await prisma.user.findMany({
      where: { role: "MEMBER", createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });
    const memberGrowth: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      const count = newMembers.filter(
        (m) => m.createdAt.getFullYear() === d.getFullYear() && m.createdAt.getMonth() === d.getMonth()
      ).length;
      memberGrowth.push({ label, count });
    }

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const attendancesWithSession = await prisma.attendance.findMany({
      where: { checkInTime: { gte: thirtyDaysAgo } },
      select: { session: { select: { coach: true } } },
    });
    const coachCounts = new Map<string, number>();
    for (const a of attendancesWithSession) {
      if (!a.session) continue;
      coachCounts.set(a.session.coach, (coachCounts.get(a.session.coach) ?? 0) + 1);
    }
    const coachPerformance = Array.from(coachCounts.entries())
      .map(([coach, attendances]) => ({ coach, attendances }))
      .sort((a, b) => b.attendances - a.attendances);

    return NextResponse.json({ ...base, memberGrowth, coachPerformance });
  } catch (error) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
