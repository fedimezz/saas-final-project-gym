import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ActivityType } from "@prisma/client";

// GET /api/dashboard/schedule?activity=YOGA&weekStart=2026-06-22
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Non autorisé" }, { status: auth.status });
    }
    const userId = auth.user.id;

    const { searchParams } = new URL(request.url);
    const activity = searchParams.get("activity");
    const weekStartParam = searchParams.get("weekStart");

    // Find the relevant weekly plan: either the one containing the requested
    // date, or the currently active one.
    const weeklyPlan = weekStartParam
      ? await prisma.weeklyPlan.findFirst({
          where: {
            weekStart: { lte: new Date(weekStartParam) },
            weekEnd: { gte: new Date(weekStartParam) },
            isArchived: false,
          },
        })
      : await prisma.weeklyPlan.findFirst({
          where: { isActive: true, isArchived: false },
          orderBy: { weekStart: "desc" },
        });

    if (!weeklyPlan) {
      return NextResponse.json({
        weeklyPlan: null,
        sessions: [],
      });
    }

    const sessions = await prisma.session.findMany({
      where: {
        weeklyPlanId: weeklyPlan.id,
        ...(activity && (Object.values(ActivityType) as string[]).includes(activity)
          ? { activity: activity as ActivityType }
          : {}),
      },
      include: {
        userSessions: {
          where: { userId, isCancelled: false },
          select: { id: true },
        },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    const formatted = sessions.map((s) => {
      const { userSessions, ...rest } = s;
      return {
        ...rest,
        isBookedByUser: userSessions.length > 0,
        isFull: s.currentBookings >= s.capacity,
        spotsLeft: Math.max(0, s.capacity - s.currentBookings),
      };
    });

    return NextResponse.json({
      weeklyPlan: {
        id: weeklyPlan.id,
        weekStart: weeklyPlan.weekStart,
        weekEnd: weeklyPlan.weekEnd,
      },
      sessions: formatted,
    });
  } catch (error) {
    console.error("Schedule GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
