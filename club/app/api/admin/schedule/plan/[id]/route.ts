import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notifyAllMembers } from "@/lib/notify";
import { hasPermission } from "@/lib/permissions";
import { formatZodError, weeklyPlanActionSchema } from "@/lib/validation";

// PATCH /api/admin/schedule/plan/[id] — activate or archive a WeeklyPlan
//
// This was previously missing from this route file (it only had DELETE),
// which caused every "Activer"/"Archiver" click from the admin schedule
// page to hit a 405 Method Not Allowed with an empty body.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;
    if (!(await hasPermission(admin, "planning.manage"))) {
      return NextResponse.json({ error: "Permission requise : gérer le planning" }, { status: 403 });
    }

    const { id } = await params;
    const rawBody = await request.json().catch(() => null);
    const parsed = weeklyPlanActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { action } = parsed.data;

    if (action === "activate") {
      await prisma.weeklyPlan.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const plan = await prisma.weeklyPlan.update({
        where: { id },
        data: { isActive: true },
        include: { _count: { select: { sessions: true } } },
      });

      notifyAllMembers({
        title: "Nouveau planning disponible",
        message: `Le planning de la semaine du ${new Date(plan.weekStart).toLocaleDateString("fr-FR")} est maintenant actif.`,
        type: "SCHEDULE_ACTIVATED",
        data: { planId: plan.id },
      }).catch((err) => console.error("notifyAllMembers failed:", err));

      return NextResponse.json({ plan });
    }

    if (action === "archive") {
      const plan = await prisma.weeklyPlan.update({
        where: { id },
        data: { isArchived: true, isActive: false },
      });
      return NextResponse.json({ plan });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("Admin plan PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/schedule/plan/[id]
// Cancels all active bookings across every session, notifies affected members,
// then deletes sessions and the plan in one transaction.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;
    if (!(await hasPermission(admin, "planning.manage"))) {
      return NextResponse.json({ error: "Permission requise : gérer le planning" }, { status: 403 });
    }

    const { id: planId } = await params;

    const plan = await prisma.weeklyPlan.findUnique({
      where: { id: planId },
      include: {
        sessions: {
          include: {
            userSessions: {
              where: { isCancelled: false },
              select: { id: true, userId: true },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Planning introuvable" }, { status: 404 });
    }

    // One notification per member (deduplicated), regardless of how many
    // sessions they were booked into.
    const affectedUserIds = [
      ...new Set(
        plan.sessions.flatMap((s) => s.userSessions.map((us) => us.userId))
      ),
    ];

    const activeUserSessionIds = plan.sessions.flatMap((s) =>
      s.userSessions.map((us) => us.id)
    );

    const weekLabel = new Date(plan.weekStart).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    await prisma.$transaction(async (tx) => {
      // 1. Cancel all active bookings across all sessions
      if (activeUserSessionIds.length > 0) {
        await tx.userSession.updateMany({
          where: { id: { in: activeUserSessionIds } },
          data: { isCancelled: true, cancelledAt: new Date() },
        });
      }

      // 2. One notification per affected member
      if (affectedUserIds.length > 0) {
        await tx.notification.createMany({
          data: affectedUserIds.map((userId) => ({
            userId,
            title: "Planning annulé",
            message: `Le planning de la semaine du ${weekLabel} a été supprimé. Toutes vos réservations sur cette semaine ont été annulées.`,
            type: "WARNING",
          })),
        });
      }

      // 3. Delete all UserSessions, then Sessions, then the plan
      await tx.userSession.deleteMany({
        where: { session: { weeklyPlanId: planId } },
      });
      await tx.session.deleteMany({ where: { weeklyPlanId: planId } });
      await tx.weeklyPlan.delete({ where: { id: planId } });
    });

    return NextResponse.json({
      success: true,
      notifiedCount: affectedUserIds.length,
    });
  } catch (error) {
    console.error("Admin plan DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}