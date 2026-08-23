import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCoach } from "@/lib/auth";
import { attendanceCheckinSchema, formatZodError } from "@/lib/validation";

// POST /api/dashboard/coach/attendance — check a member in for one of the
// coach's own sessions (or un-check them in, by passing undo:true).
// Scoped to the requesting coach's own sessions, same as the roster route.
export async function POST(request: NextRequest) {
  const auth = await requireCoach(request);
  if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = attendanceCheckinSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { sessionId, userId, undo } = parsed.data;

    const coach = await prisma.coach.findUnique({ where: { userId: auth.user.id } });
    if (!coach) {
      return NextResponse.json({ error: "Aucun profil coach lié à ce compte" }, { status: 404 });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.coachId !== coach.id) {
      return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });
    }

    const booking = await prisma.userSession.findFirst({
      where: { sessionId, userId, isCancelled: false },
    });
    if (!booking) {
      return NextResponse.json({ error: "Ce membre n'est pas inscrit à cette séance" }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (undo) {
      await prisma.attendance.deleteMany({
        where: { sessionId, userId, checkInTime: { gte: todayStart } },
      });
      return NextResponse.json({ checkedIn: false });
    }

    const existing = await prisma.attendance.findFirst({
      where: { sessionId, userId, checkInTime: { gte: todayStart } },
    });
    if (!existing) {
      await prisma.attendance.create({
        data: { userId, sessionId, createdBy: auth.user.id },
      });
    }

    return NextResponse.json({ checkedIn: true });
  } catch (error) {
    console.error("Coach attendance POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
