// DELETE /api/admin/notifications/clear-all — removes every notification
// row in the system. Used by the "Supprimer tout" button in the admin
// "Notifications récentes" panel.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });

    const result = await prisma.notification.deleteMany({});

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Admin notifications clear-all DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
