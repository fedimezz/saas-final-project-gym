import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { hashPassword } from "@/lib/bcrypt";
import { coachUpdateSchema, formatZodError } from "@/lib/validation";

// PUT /api/admin/coaches/[id] — edit a coach profile. OWNER only.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (!auth.ok) return NextResponse.json({ error: "Accès refusé — réservé au propriétaire" }, { status: auth.status });

  try {
    const { id } = await params;
    const rawBody = await request.json().catch(() => null);
    const parsed = coachUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, bio, photoUrl, specialties, phone, isActive, createAccount, email, password } = parsed.data;

    const existing = await prisma.coach.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coach introuvable" }, { status: 404 });
    }

    let userId = existing.userId;

    // Attach a login account to a coach that didn't have one yet.
    if (createAccount && !existing.userId) {
      if (!email) {
        return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
      }
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name || existing.name,
          email,
          password: hashedPassword,
          phone: phone || existing.phone,
          role: "COACH",
          emailVerified: new Date(),
        },
      });
      userId = user.id;
    }

    const coach = await prisma.coach.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
        ...(specialties !== undefined && { specialties }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(isActive !== undefined && { isActive }),
        userId,
      },
    });

    // Keep every session's free-text display name (Session.coach) in sync
    // when the coach is renamed, since older code paths still read it.
    if (name !== undefined && name !== existing.name) {
      await prisma.session.updateMany({ where: { coachId: id }, data: { coach: name } });
    }

    return NextResponse.json({ coach });
  } catch (error) {
    console.error("Admin coach PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/coaches/[id] — retire a coach. Never hard-deletes one
// with sessions attached (would orphan the schedule); deactivates instead.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (!auth.ok) return NextResponse.json({ error: "Accès refusé — réservé au propriétaire" }, { status: auth.status });

  try {
    const { id } = await params;
    const sessionCount = await prisma.session.count({ where: { coachId: id } });

    if (sessionCount > 0) {
      const coach = await prisma.coach.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ coach, softDeleted: true });
    }

    await prisma.coach.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Admin coach DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
