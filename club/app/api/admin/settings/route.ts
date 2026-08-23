import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { formatZodError, gymSettingsSchema } from "@/lib/validation";

const SETTINGS_ID = "singleton";

async function getOrCreateSettings() {
  const existing = await prisma.gymSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return prisma.gymSettings.create({ data: { id: SETTINGS_ID } });
}

export async function GET(request: NextRequest) {
  try {
    // Admins can read the gym settings (e.g. to display working hours,
    // contact info) even though only the Owner can change them.
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });

    const settings = await getOrCreateSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });
    const owner = auth.user;

    const rawBody = await request.json().catch(() => null);
    const parsed = gymSettingsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const {
      name, logoUrl, address, phone, email,
      workingHours, facebookUrl, instagramUrl, tiktokUrl, primaryColor,
      backgroundColor, backgroundColorDark, enabledPages,
      heroTitle, heroSubtitle, heroImageUrl,
    } = parsed.data;

    await getOrCreateSettings();

    const settings = await prisma.gymSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
        ...(address !== undefined && { address: address || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(workingHours !== undefined && { workingHours: workingHours as Prisma.InputJsonValue }),
        ...(facebookUrl !== undefined && { facebookUrl: facebookUrl || null }),
        ...(instagramUrl !== undefined && { instagramUrl: instagramUrl || null }),
        ...(tiktokUrl !== undefined && { tiktokUrl: tiktokUrl || null }),
        ...(primaryColor !== undefined && { primaryColor: primaryColor || null }),
        ...(backgroundColor !== undefined && { backgroundColor: backgroundColor || null }),
        ...(backgroundColorDark !== undefined && { backgroundColorDark: backgroundColorDark || null }),
        ...(enabledPages !== undefined && { enabledPages: enabledPages as Prisma.InputJsonValue }),
        ...(heroTitle !== undefined && { heroTitle: heroTitle || null }),
        ...(heroSubtitle !== undefined && { heroSubtitle: heroSubtitle || null }),
        ...(heroImageUrl !== undefined && { heroImageUrl: heroImageUrl || null }),
        updatedBy: owner.id,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin settings PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
