import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { formatZodError, promotionSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });

    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Admin promotions GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });
    const owner = auth.user;

    const rawBody = await request.json().catch(() => null);
    const parsed = promotionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { code, title, description, discountType, discountValue, startDate, endDate, maxUses, isActive } = parsed.data;

    const normalizedCode = code.toUpperCase();

    const existing = await prisma.promotion.findUnique({ where: { code: normalizedCode } });
    if (existing) {
      return NextResponse.json({ error: "Ce code promo existe déjà" }, { status: 409 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        code: normalizedCode,
        title,
        description: description || null,
        discountType,
        discountValue,
        startDate: startDate ?? new Date(),
        endDate: endDate ?? null,
        maxUses: maxUses ?? null,
        isActive: isActive ?? true,
        createdBy: owner.id,
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error("Admin promotions POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
