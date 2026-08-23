// src/lib/session-date.ts
//
// Sessions store `day` as a DayOfWeek enum (MONDAY..SUNDAY) and belong to a
// WeeklyPlan that has a concrete weekStart date. This file is the single
// place that turns that pair into a real calendar Date — every other part
// of the app (UI, cron job, etc.) should go through here instead of doing
// its own offset math, so the "Monday = index 0" assumption only lives once.

import { DayOfWeek } from "@prisma/client";

// Index matches the order WeeklyPlan.weekStart is assumed to represent
// (i.e. weekStart IS the Monday of that week).
const DAY_OFFSET: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

/**
 * Returns the real calendar Date for a session, given the Monday
 * (weekStart) of its WeeklyPlan and its DayOfWeek.
 *
 * The time-of-day on the returned Date is midnight UTC of that day —
 * callers that need the session's start time should combine this with
 * `session.startTime` themselves (see `getSessionDateTime`).
 */
export function getSessionDate(weekStart: Date | string, day: DayOfWeek): Date {
  const base = new Date(weekStart);
  const result = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate())
  );
  result.setUTCDate(result.getUTCDate() + DAY_OFFSET[day]);
  return result;
}

/**
 * Same as getSessionDate, but also applies the session's startTime
 * ("HH:mm" string) so the result is the exact moment the session begins.
 */
export function getSessionDateTime(
  weekStart: Date | string,
  day: DayOfWeek,
  startTime: string
): Date {
  const date = getSessionDate(weekStart, day);
  const [hours, minutes] = startTime.split(":").map(Number);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Maps today's real-world weekday to the DayOfWeek enum, e.g. for finding
 * "today's sessions" regardless of which WeeklyPlan they belong to.
 */
export function todayAsDayOfWeek(reference: Date = new Date()): DayOfWeek {
  // JS getUTCDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const jsDay = reference.getUTCDay();
  const ORDER: DayOfWeek[] = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
  ];
  return ORDER[jsDay];
}

/**
 * French long-form date label for display, e.g. "lundi 6 juillet 2026".
 */
export function formatSessionDateFR(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Returns true if the given calendar date is today (UTC day comparison —
 * matches how WeeklyPlan/Session boundaries are stored).
 */
export function isToday(date: Date, reference: Date = new Date()): boolean {
  return (
    date.getUTCFullYear() === reference.getUTCFullYear() &&
    date.getUTCMonth() === reference.getUTCMonth() &&
    date.getUTCDate() === reference.getUTCDate()
  );
}