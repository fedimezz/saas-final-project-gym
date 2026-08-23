import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { formatZodError, shortTextSchema } from "@/lib/validation";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const ACTIVITIES = [
  "BODYBUILDING", "FITNESS", "CARDIO", "CROSSFIT", "YOGA", "PILATES",
  "BOXE", "MMA", "AQUAGYM", "PADEL", "ZUMBA", "SPINNING",
] as const;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM, 24h

const createSessionSchema = z
  .object({
    day: z.enum(DAYS),
    startTime: z.string().regex(TIME_RE, "Format d'heure invalide (HH:MM)"),
    endTime: z.string().regex(TIME_RE, "Format d'heure invalide (HH:MM)"),
    activity: z.enum(ACTIVITIES),
    coach: z.string().trim().min(1, "Le nom du coach est requis").max(100),
    coachId: z.string().trim().min(1).optional().or(z.literal("")),
    // Previously `Number(capacity) || 20`, which is falsy for 0 — an admin
    // could never actually create a 0-capacity (blocked) session; it would
    // silently become 20 instead. Bounded 1-500 as a sane real-world range.
    capacity: z.coerce.number().int().min(1).max(500).default(20),
    location: shortTextSchema(200).optional().or(z.literal("")),
    description: shortTextSchema(2000).optional().or(z.literal("")),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  });

// POST /api/admin/schedule/[id] — add a Session to a WeeklyPlan
// Matches frontend: fetch(`/api/admin/schedule/${planId}`, { method: "POST", ... })
export async function POST(
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

    const { id: weeklyPlanId } = await params;
    const rawBody = await request.json().catch(() => null);
    const parsed = createSessionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { day, startTime, endTime, activity, coach, coachId, capacity, location, description } = parsed.data;

    if (coachId) {
      const coachExists = await prisma.coach.findUnique({ where: { id: coachId }, select: { id: true } });
      if (!coachExists) {
        return NextResponse.json({ error: "Coach introuvable" }, { status: 400 });
      }
    }

    const plan = await prisma.weeklyPlan.findUnique({ where: { id: weeklyPlanId }, select: { id: true } });
    if (!plan) {
      return NextResponse.json({ error: "Planning introuvable" }, { status: 404 });
    }

    const session = await prisma.session.create({
      data: {
        weeklyPlanId,
        day,
        startTime,
        endTime,
        activity,
        coach,
        coachId: coachId || null,
        capacity,
        location: location || "Salle principale",
        description: description || null,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Admin session POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}