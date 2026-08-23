import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/bcrypt";
import { changePasswordSchema, formatZodError } from "@/lib/validation";

// PUT /api/dashboard/profile/password  { currentPassword, newPassword }
//
// Shared by both app/dashboard/profile/page.tsx and app/admin/profile/page.tsx
// — any logged-in user (member, admin, or owner) changing their own password.
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.status === 401 ? "Non authentifié" : "Accès refusé" },
        { status: auth.status }
      );
    }
    const payload = { id: auth.user.id };

    const rawBody = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "Ce compte utilise la connexion Google et n'a pas de mot de passe local à modifier.",
        },
        { status: 400 }
      );
    }

    const validPassword = await verifyPassword(currentPassword, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: payload.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error("Profile password PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
