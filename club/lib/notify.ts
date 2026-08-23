// src/lib/notify.ts
//
// Single entry point for "tell user(s) something happened, both
// persistently (DB row, so the bell still shows it after a refresh or for
// users who were offline) and live (SSE push, so connected users see it
// instantly without refreshing)."
//
// Deliberately mirrors your existing Notification model fields exactly —
// title / message / type / data — so nothing else in your schema needs to
// change.

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { broadcastToUser } from "@/lib/sse";

interface NotifyInput {
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
}

/** Notify a single user. */
export async function notifyUser(userId: string, input: NotifyInput) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: input.title,
      message: input.message,
      type: input.type,
      data: input.data ? (input.data as unknown as Prisma.InputJsonValue) : undefined,
    },
  });

  broadcastToUser(userId, "notification", notification);
  return notification;
}

/**
 * Notify many users at once (e.g. "all members"). Each user gets their
 * own Notification row (so each can independently mark theirs read/unread
 * later), then each gets their own SSE push.
 *
 * For a gym-sized member list (tens to low thousands) a Promise.all loop
 * is fine. If your membership grows into the tens of thousands, switch
 * the write to prisma.notification.createMany and re-fetch by a batch
 * marker instead of creating one row per await.
 */
export async function notifyUsers(userIds: string[], input: NotifyInput) {
  if (userIds.length === 0) return [];

  const notifications = await Promise.all(
    userIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title: input.title,
          message: input.message,
          type: input.type,
          data: input.data ? (input.data as unknown as Prisma.InputJsonValue) : undefined,
        },
      })
    )
  );

  for (const n of notifications) {
    broadcastToUser(n.userId, "notification", n);
  }

  return notifications;
}

/** Notify every member in the system (all roles, all active states). */
export async function notifyAllMembers(input: NotifyInput) {
  const members = await prisma.user.findMany({
    select: { id: true },
  });
  return notifyUsers(members.map((m) => m.id), input);
}
