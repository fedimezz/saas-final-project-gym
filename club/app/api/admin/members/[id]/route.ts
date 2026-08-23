import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { formatZodError, nameSchema, phoneSchema } from "@/lib/validation";

const memberPatchSchema = z.object({
  action: z.enum(["block", "suspend", "reactivate", "edit"]),
  name: nameSchema.optional(),
  phone: phoneSchema.optional().or(z.literal("")),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    const admin = auth.user;

    const { id } = await params;
    const rawBody = await request.json().catch(() => null);
    const parsed = memberPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { action, name, phone } = parsed.data;

    const requiredPermission = action === "edit" ? "members.write" : "members.suspend";
    if (!(await hasPermission(admin, requiredPermission))) {
      return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

    if (admin.role === "ADMIN" && ["ADMIN", "OWNER"].includes(target.role)) {
      return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "block":
      case "suspend":
        updateData = { isActive: false };
        break;
      case "reactivate":
        updateData = { isActive: true };
        break;
      case "edit":
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone || null;
        break;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, isActive: true, role: true },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Admin member PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deleting a member is Owner-only — Admin can suspend/reactivate but
    // not permanently delete (see the role permission matrix).
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });

    const { id } = await params;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

    if (["ADMIN", "OWNER"].includes(target.role)) {
      return NextResponse.json({ error: "Impossible de supprimer un admin" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin member DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}