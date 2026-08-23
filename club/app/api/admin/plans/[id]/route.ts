import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, isAuthResponse } from "@/lib/auth-server";
import { formatZodError, planUpdateSchema } from "@/lib/validation";

// Price changes are business-sensitive (same tier as Promotions/Analytics),
// so only OWNER can edit or retire a plan. ADMIN can still read plans
// (GET on /api/admin/plans) to build subscribe-modal dropdowns.
async function requireOwner(request: NextRequest) {
  const auth = await requireUser(request);
  if (isAuthResponse(auth)) return auth;
  if (auth.role !== "OWNER") {
    return NextResponse.json({ error: "Accès refusé — réservé au propriétaire" }, { status: 403 });
  }
  return auth;
}

// PUT /api/admin/plans/[id] — edit a plan (name, description, price, durationDays, features, isActive)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const { id } = await params;
    const rawBody = await request.json().catch(() => null);
    const parsed = planUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, description, price, durationDays, features, isActive } = parsed.data;

    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(price !== undefined && { price }),
        ...(durationDays !== undefined && { durationDays }),
        ...(features !== undefined && { features }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Admin plan PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/plans/[id] — retire a plan. We never hard-delete a plan
// that has subscriptions attached (would orphan payment history), so this
// soft-deletes via isActive:false unless the plan has zero subscriptions ever.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const { id } = await params;
    const subCount = await prisma.subscription.count({ where: { planId: id } });

    if (subCount > 0) {
      const plan = await prisma.membershipPlan.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ plan, softDeleted: true });
    }

    await prisma.membershipPlan.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Admin plan DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
