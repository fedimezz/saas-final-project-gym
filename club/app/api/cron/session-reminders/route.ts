// src/app/api/cron/session-reminders/route.ts
//
// Meant to be hit once a day by a scheduler (e.g. Vercel Cron at 07:00) —
// not by users. It finds every session happening today, across whichever
// WeeklyPlan is active, and creates an in-app Notification for each user
// who has booked one of those sessions.
//
// Protected by CRON_SECRET so it can't be triggered by random requests.
//
// vercel.json:
// {
//   "crons": [{ "path": "/api/cron/session-reminders", "schedule": "0 7 * * *" }]
// }

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionDate, isToday, todayAsDayOfWeek } from "@/lib/session-date";
import { sendSms, sessionReminderSms } from "@/lib/sms";

export async function GET(request: NextRequest) {
  try {
    // ── Auth: only the scheduler should be able to call this ──────────
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
    }

    const now = new Date();
    const todayDow = todayAsDayOfWeek(now);
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // ── Find weekly plans whose date range covers today ────────────────
    // (normally just the one "active" plan, but we don't rely solely on
    // isActive in case of overlap/migration windows)
    const candidatePlans = await prisma.weeklyPlan.findMany({
      where: {
        isArchived: false,
        weekStart: { lte: now },
        weekEnd: { gte: now },
      },
      include: {
        sessions: {
          where: { day: todayDow },
          include: {
            userSessions: {
              where: { isCancelled: false },
              include: { user: { include: { preferences: true } } },
            },
          },
        },
      },
    });

    // Keep only sessions that really fall today (guards against a plan
    // whose weekStart isn't exactly a Monday).
    const todaysSessions = candidatePlans.flatMap((plan) =>
      plan.sessions.filter((session) => isToday(getSessionDate(plan.weekStart, session.day), now))
    );

    // ── Batch the "already sent today" check into ONE query instead of
    // one findFirst per booking (that was N+1 — for a full class list this
    // could be dozens of sequential round-trips every single run). ──────
    const sessionIds = todaysSessions.map((s) => s.id);
    const alreadySentPairs = new Set<string>();
    if (sessionIds.length > 0) {
      const existing = await prisma.notification.findMany({
        where: {
          type: "SESSION_REMINDER",
          sentAt: { gte: todayStart },
          userId: { in: [...new Set(todaysSessions.flatMap((s) => s.userSessions.map((us) => us.userId)))] },
        },
        select: { userId: true, data: true },
      });
      for (const n of existing) {
        const sessionId = (n.data as { sessionId?: string } | null)?.sessionId;
        if (sessionId) alreadySentPairs.add(`${n.userId}:${sessionId}`);
      }
    }

    let notificationsCreated = 0;
    let smsSent = 0;

    for (const session of todaysSessions) {
      for (const booking of session.userSessions) {
        if (alreadySentPairs.has(`${booking.userId}:${session.id}`)) continue;

        await prisma.notification.create({
          data: {
            userId: booking.userId,
            title: "Session aujourd'hui",
            message: `Rappel : votre session ${session.activity} a lieu aujourd'hui de ${session.startTime} à ${session.endTime} avec ${session.coach}.`,
            type: "SESSION_REMINDER",
            data: {
              sessionId: session.id,
              activity: session.activity,
              startTime: session.startTime,
              endTime: session.endTime,
              location: session.location,
            },
          },
        });
        notificationsCreated += 1;

        // Optional SMS on top of the in-app notification, only for users
        // who opted in and have a phone number on file.
        const prefs = booking.user.preferences;
        if (prefs?.smsNotifications && booking.user.phone) {
          try {
            await sendSms({
              to: booking.user.phone,
              body: sessionReminderSms(session.activity, session.startTime),
            });
            smsSent += 1;
          } catch (err) {
            console.error(`SMS reminder failed for user ${booking.userId}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      sessionsProcessed: todaysSessions.length,
      notificationsCreated,
      smsSent,
    });
  } catch (error) {
    console.error("Session reminders cron error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}