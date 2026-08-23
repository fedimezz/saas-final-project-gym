// PUT    /api/admin/staff/[id] — update a staff account (role, active state, profile)
// DELETE /api/admin/staff/[id] — remove a staff account
// OWNER only.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { formatZodError, nameSchema, phoneSchema } from "@/lib/validation";

const updateStaffSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional().or(z.literal("")),
  role: z.enum(["ADMIN", "OWNER"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    }
    const { id } = await params;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || !["ADMIN", "OWNER"].includes(target.role)) {
      return NextResponse.json({ error: "Membre du personnel introuvable" }, { status: 404 });
    }

    // An owner can't demote or deactivate themselves — that would leave
    // no one able to manage staff. Force that to happen via another owner.
    if (target.id === auth.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre compte ici" },
        { status: 400 }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = updateStaffSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, phone, role, isActive } = parsed.data;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone || null;
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    }
    const { id } = await params;

    if (id === auth.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || !["ADMIN", "OWNER"].includes(target.role)) {
      return NextResponse.json({ error: "Membre du personnel introuvable" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
