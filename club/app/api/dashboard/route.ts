import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSessionDateTime } from "@/lib/session-date";

// GET /api/dashboard
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return NextResponse.json({ error: "Non autorisé" }, { status: auth.status });
    const userId = auth.user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      user,
      totalBookings,
      completedAttendances,
      upcomingUserSessions,
      activeSubscription,
      weeklyAttendances,
      recentAttendances,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      prisma.userSession.count({
        where: { userId, isCancelled: false },
      }),
      prisma.attendance.count({
        where: { userId },
      }),
      // Pull every non-cancelled booking in the active weekly plan, then
      // pick the soonest one that hasn't happened yet — in app code,
      // since "day" is stored as a label (not a real date) and can't be
      // compared chronologically at the database level.
      prisma.userSession.findMany({
        where: {
          userId,
          isCancelled: false,
          session: {
            weeklyPlan: { isActive: true },
          },
        },
        include: {
          session: { include: { weeklyPlan: true } },
        },
      }),
      prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          endDate: { gt: now },
        },
        include: { plan: true },
        orderBy: { endDate: "desc" },
      }),
      prisma.attendance.findMany({
        where: { userId, checkInTime: { gte: sevenDaysAgo } },
        select: { checkInTime: true },
      }),
      prisma.attendance.findMany({
        where: { userId, checkInTime: { gte: thirtyDaysAgo } },
        select: { id: true, checkInTime: true, session: { select: { activity: true } } },
        orderBy: { checkInTime: "desc" },
        take: 5,
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Resolve the real next session: compute an actual Date for each
    // booking, discard ones already in the past, and keep the soonest.
    const upcoming = upcomingUserSessions
      .map((us) => {
        const { session } = us;
        const dt = getSessionDateTime(session.weeklyPlan.weekStart, session.day, session.startTime);
        return { session, dt };
      })
      .filter((entry) => entry.dt.getTime() >= now.getTime())
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());

    const nextSession = upcoming[0]?.session ?? null;

    // Build a 7-day activity histogram (Mon..Sun) from real attendance data
    const dayBuckets = [0, 0, 0, 0, 0, 0, 0]; // Mon=0 .. Sun=6
    weeklyAttendances.forEach((a) => {
      const jsDay = new Date(a.checkInTime).getDay(); // Sun=0..Sat=6
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      dayBuckets[idx] += 1;
    });
    const maxBucket = Math.max(1, ...dayBuckets);
    const weeklyActivity = dayBuckets.map((count) =>
      Math.round((count / maxBucket) * 100)
    );

    const daysUntilExpiry = activeSubscription
      ? Math.max(
          0,
          Math.ceil(
            (new Date(activeSubscription.endDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

    return NextResponse.json({
      userName: user.name,
      stats: {
        totalBookings,
        completedAttendances,
        membershipStatus: activeSubscription ? "Active" : "Inactive",
        daysUntilExpiry,
        planName: activeSubscription?.plan.name ?? null,
      },
      upcomingSession: nextSession
        ? {
            id: nextSession.id,
            activity: nextSession.activity,
            day: nextSession.day,
            startTime: nextSession.startTime,
            endTime: nextSession.endTime,
            coach: nextSession.coach,
            location: nextSession.location,
          }
        : null,
      weeklyActivity,
      recentAttendances: recentAttendances.map((a) => ({
        id: a.id,
        activity: a.session?.activity ?? null,
        checkInTime: a.checkInTime,
      })),
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
