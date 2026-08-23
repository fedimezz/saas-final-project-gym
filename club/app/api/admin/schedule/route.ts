import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getSessionDateTime } from "@/lib/session-date";
import { hasPermission } from "@/lib/permissions";
import { formatZodError, weeklyPlanSchema } from "@/lib/validation";

async function cleanupPastData() {
  const now = new Date();

  const sessions = await prisma.session.findMany({
    where: { weeklyPlan: { isArchived: false } },
    select: {
      id: true,
      day: true,
      endTime: true,
      weeklyPlan: { select: { weekStart: true } },
    },
  });

  const idsToDelete: string[] = [];

  for (const s of sessions) {
    // Use the shared UTC-based helper instead of local-time Date math —
    // weekStart is stored as a UTC calendar date, so mixing it with
    // setDate()/setHours() (local time) shifted this by a day for any
    // server timezone ahead of UTC, deleting/keeping sessions incorrectly.
    const sessionDate = getSessionDateTime(s.weeklyPlan.weekStart, s.day, s.endTime);

    if (sessionDate < now) {
      idsToDelete.push(s.id);
    }
  }

  if (idsToDelete.length > 0) {
    await prisma.session.deleteMany({ where: { id: { in: idsToDelete } } });
  }

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  await prisma.weeklyPlan.updateMany({
    where: {
      weekEnd: { lt: todayMidnight },
      isArchived: false,
    },
    data: { isActive: false, isArchived: true },
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;

    await cleanupPastData();

    const plans = await prisma.weeklyPlan.findMany({
      orderBy: { weekStart: "desc" },
      include: {
        sessions: {
          orderBy: [{ day: "asc" }, { startTime: "asc" }],
        },
        _count: { select: { sessions: true } },
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Admin schedule GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;
    if (!(await hasPermission(admin, "planning.manage"))) {
      return NextResponse.json({ error: "Permission requise : gérer le planning" }, { status: 403 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = weeklyPlanSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { weekStart, weekEnd, isActive } = parsed.data;

    const existing = await prisma.weeklyPlan.findFirst({
      where: { weekStart },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un planning existe déjà pour cette semaine" },
        { status: 409 }
      );
    }

    const plan = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.weeklyPlan.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.weeklyPlan.create({
        data: {
          weekStart,
          weekEnd,
          isActive: !!isActive,
        },
        include: { _count: { select: { sessions: true } } },
      });
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Admin schedule POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}