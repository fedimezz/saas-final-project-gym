// src/app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { adminNotificationSchema, cuidSchema, formatZodError } from "@/lib/validation";

// POST /api/admin/notifications
// { title, message, type, target: "ALL" | "ACTIVE" | userId[], channels?: string[] }
//
// `channels` controls how the notification SHOULD be delivered. Right now
// only SITE is actually wired up (creates a Notification row, shown in the
// bell). EMAIL and SMS are recorded on the row for every notification so
// the data/UI is ready — but no email/SMS is actually sent yet. Hook your
// provider (Resend, Twilio, etc.) into the TODO block below when ready.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;
    if (!(await hasPermission(admin, "notifications.send"))) {
      return NextResponse.json({ error: "Permission requise : envoyer des notifications" }, { status: 403 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = adminNotificationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { title, message, type, target, channels } = parsed.data;

    const selectedChannels: string[] = channels && channels.length > 0 ? channels : ["SITE"];

    let userIds: string[] = [];

    if (target === "ALL") {
      const users = await prisma.user.findMany({
        where: { role: "MEMBER" },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (target === "ACTIVE") {
      const users = await prisma.user.findMany({
        where: {
          role: "MEMBER",
          isActive: true,
          subscriptions: { some: { status: "ACTIVE", endDate: { gt: new Date() } } },
        },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (Array.isArray(target)) {
      // One or more specific user IDs, chosen via the member picker
      const users = await prisma.user.findMany({
        where: { id: { in: target } },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
      if (userIds.length === 0) {
        return NextResponse.json({ error: "Aucun membre valide sélectionné" }, { status: 404 });
      }
    } else {
      // Backwards-compatible: a single userId as a plain string
      const user = await prisma.user.findUnique({ where: { id: target } });
      if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      userIds = [target];
    }

    if (userIds.length === 0) {
      return NextResponse.json({ message: "Aucun destinataire trouvé", count: 0 });
    }

    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type: type ?? "INFO",
        channels: selectedChannels,
      })),
    });

    // ── TODO: envoi réel EMAIL / SMS ──────────────────────────────────
    // if (selectedChannels.includes("EMAIL")) { /* ex: appel à Resend */ }
    // if (selectedChannels.includes("SMS"))   { /* ex: appel à Twilio */ }
    // Pour l'instant seul SITE est actif (ligne createMany ci-dessus).

    return NextResponse.json(
      { message: `Notification envoyée à ${result.count} membre(s)`, count: result.count },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin notifications POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/admin/notifications — recent sent notifications (last 50)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;

    const recent = await prisma.notification.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ notifications: recent });
  } catch (error) {
    console.error("Admin notifications GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/notifications?id=xxx — admin deletes any notification
// (used by the "recent notifications" panel's delete button)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;

    const id = request.nextUrl.searchParams.get("id");
    const parsedId = cuidSchema.safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "id requis" }, { status: 400 });

    await prisma.notification.delete({ where: { id: parsedId.data } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin notifications DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}