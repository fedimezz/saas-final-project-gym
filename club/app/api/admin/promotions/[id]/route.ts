import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { formatZodError, promotionUpdateSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });

    const { id } = await params;
    const rawBody = await request.json().catch(() => null);
    const parsed = promotionUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { title, description, discountType, discountValue, startDate, endDate, maxUses, isActive } = parsed.data;

    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Promotion introuvable" }, { status: 404 });

    // Enforce percent<=100 against the merged (existing + incoming) values,
    // since a PATCH can send discountValue without discountType or vice versa.
    const mergedType = discountType ?? existing.discountType;
    const mergedValue = discountValue ?? existing.discountValue;
    if (mergedType === "PERCENT" && Number(mergedValue) > 100) {
      return NextResponse.json({ error: "Un pourcentage ne peut pas dépasser 100" }, { status: 400 });
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(maxUses !== undefined && { maxUses }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error("Admin promotions PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });

    const { id } = await params;
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Promotion introuvable" }, { status: 404 });

    await prisma.promotion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin promotions DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
