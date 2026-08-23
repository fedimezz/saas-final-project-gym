import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { bookSessionSchema, formatZodError } from "@/lib/validation";

function getUserId(request: NextRequest): string | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const decoded = verifyToken(token) as { id: string } | null;
  return decoded?.id ?? null;
}

type SessionCapacityRow = {
  id: string;
  currentBookings: number;
  capacity: number;
  weeklyPlanId: string;
  day: string;
  startTime: string;
  endTime: string;
  activity: string;
  coach: string;
  coachId: string | null;
  description: string | null;
  location: string;
  createdAt: Date;
  updatedAt: Date;
};

// POST /api/dashboard/schedule/book  { sessionId }
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = bookSessionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { sessionId } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // The JWT itself is never re-checked against the DB anywhere in this
      // app (see the broader note in the production report) — a member
      // suspended via PATCH /api/admin/members/[id] keeps a working,
      // unexpired session token for up to 7 days. That's tolerable for
      // read-only browsing, but not for taking a new booking slot away
      // from other members, so it's enforced here specifically.
      const user = await tx.user.findUnique({ where: { id: userId }, select: { isActive: true } });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }
      if (!user.isActive) {
        throw new Error("ACCOUNT_SUSPENDED");
      }

      // Check for an existing (possibly cancelled) booking first — this is
      // a cheap early-out, NOT the correctness guarantee for capacity.
      const existing = await tx.userSession.findUnique({
        where: { userId_sessionId: { userId, sessionId } },
      });

      if (existing && !existing.isCancelled) {
        throw new Error("ALREADY_BOOKED");
      }

      // Race-free capacity check: previously this route did
      // `findUnique` (read currentBookings in JS) then a separate
      // `update({ increment: 1 })`. Under concurrent requests, two
      // transactions could both read currentBookings=19/20, both pass the
      // JS check, and both increment — landing on 21/20.
      //
      // A plain UPDATE's WHERE clause is instead evaluated by Postgres
      // against the current row at UPDATE time and takes a row lock, so
      // concurrent requests for the last spot serialize here: whichever
      // commits first flips currentBookings to 20, and the second
      // transaction's WHERE "currentBookings" < "capacity" then evaluates
      // false and updates zero rows. That's what makes this atomic.
      const updatedRows = await tx.$queryRaw<SessionCapacityRow[]>(
        Prisma.sql`
          UPDATE "sessions"
          SET "currentBookings" = "currentBookings" + 1
          WHERE "id" = ${sessionId} AND "currentBookings" < "capacity"
          RETURNING *
        `
      );

      if (updatedRows.length === 0) {
        const session = await tx.session.findUnique({
          where: { id: sessionId },
          select: { id: true },
        });
        if (!session) throw new Error("SESSION_NOT_FOUND");
        throw new Error("SESSION_FULL");
      }

      if (existing && existing.isCancelled) {
        await tx.userSession.update({
          where: { id: existing.id },
          data: { isCancelled: false, cancelledAt: null, bookedAt: new Date() },
        });
      } else {
        // If two requests from the same user race past the `existing`
        // check above (e.g. a double-click with no prior row), the
        // @@unique([userId, sessionId]) constraint makes the second
        // `create` throw P2002 here. That throw aborts the transaction,
        // which also rolls back the capacity increment above — so a
        // rejected duplicate never leaves a phantom reserved spot.
        await tx.userSession.create({
          data: { userId, sessionId },
        });
      }

      return updatedRows[0];
    });

    return NextResponse.json({
      message: "Session réservée avec succès",
      session: {
        ...result,
        isFull: result.currentBookings >= result.capacity,
        spotsLeft: Math.max(0, result.capacity - result.currentBookings),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }
    if (message === "ACCOUNT_SUSPENDED") {
      return NextResponse.json({ error: "Votre compte est suspendu. Contactez le club." }, { status: 403 });
    }
    if (message === "SESSION_NOT_FOUND") {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }
    if (message === "SESSION_FULL") {
      return NextResponse.json({ error: "Cette session est complète" }, { status: 409 });
    }
    if (message === "ALREADY_BOOKED") {
      return NextResponse.json({ error: "Vous avez déjà réservé cette session" }, { status: 409 });
    }
    console.error("Schedule book POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/dashboard/schedule/book  { sessionId }
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = bookSessionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { sessionId } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userSession.findUnique({
        where: { userId_sessionId: { userId, sessionId } },
      });

      if (!existing || existing.isCancelled) {
        throw new Error("NOT_BOOKED");
      }

      await tx.userSession.update({
        where: { id: existing.id },
        data: { isCancelled: true, cancelledAt: new Date() },
      });

      // Same atomic-UPDATE pattern as booking, and guarded at 0 so a
      // duplicate/racing cancel can never push currentBookings negative.
      const updatedRows = await tx.$queryRaw<SessionCapacityRow[]>(
        Prisma.sql`
          UPDATE "sessions"
          SET "currentBookings" = "currentBookings" - 1
          WHERE "id" = ${sessionId} AND "currentBookings" > 0
          RETURNING *
        `
      );

      if (updatedRows.length === 0) {
        const session = await tx.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error("SESSION_NOT_FOUND_ON_CANCEL");
        return session; // already at 0 — nothing to decrement, not an error
      }

      return updatedRows[0];
    });

    return NextResponse.json({
      message: "Réservation annulée",
      session: {
        ...result,
        isFull: result.currentBookings >= result.capacity,
        spotsLeft: Math.max(0, result.capacity - result.currentBookings),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_BOOKED") {
      return NextResponse.json({ error: "Vous n'avez pas réservé cette session" }, { status: 409 });
    }
    if (message === "SESSION_NOT_FOUND_ON_CANCEL") {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }
    console.error("Schedule book DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
