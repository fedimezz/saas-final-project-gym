import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { hashPassword } from "@/lib/bcrypt";
import { emailSchema, formatZodError, nameSchema, passwordSchema, phoneSchema, shortTextSchema } from "@/lib/validation";

const createCoachSchema = z
  .object({
    name: nameSchema,
    bio: shortTextSchema(2000).optional(),
    photoUrl: z.string().trim().url("URL de photo invalide").optional().or(z.literal("")),
    specialties: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    phone: phoneSchema.optional().or(z.literal("")),
    createAccount: z.boolean().optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => !data.createAccount || (data.email && data.password), {
    message: "Email et mot de passe requis pour créer un compte",
    path: ["email"],
  });

// GET /api/admin/coaches — every coach (active + inactive), with their
// sessions in the currently active weekly plan attached so Admin/Owner get
// a real "who's teaching what, when" view without a separate lookup.
// Replaces the old read-only version of this route, which derived a coach
// "list" purely from grouping Session.coach free-text names — there was no
// real Coach entity to CRUD against yet.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });

  try {
    const coaches = await prisma.coach.findMany({
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        sessions: {
          where: { weeklyPlan: { isActive: true } },
          select: { id: true, activity: true, day: true, startTime: true, endTime: true, location: true },
          orderBy: [{ day: "asc" }, { startTime: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ coaches });
  } catch (error) {
    console.error("Admin coaches GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/coaches — create a coach profile. OWNER only, same trust
// boundary as /api/admin/staff, since creating one can also create a login
// account. `createAccount` + `email` + `password` are optional — a coach
// profile can exist purely for display (schedule/coaching page) without a
// login, and a login can be added later via PUT.
export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (!auth.ok) return NextResponse.json({ error: "Accès refusé — réservé au propriétaire" }, { status: auth.status });

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = createCoachSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, bio, photoUrl, specialties, phone, createAccount, email, password } = parsed.data;

    let userId: string | null = null;

    if (createAccount) {
      // The refine() above already guarantees email/password are present
      // when createAccount is true, but narrow the types explicitly.
      const normalizedEmail = email as string;
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
      }
      const hashedPassword = await hashPassword(password as string);
      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          phone: phone || null,
          role: "COACH",
          emailVerified: new Date(), // staff-created accounts don't need email verification
        },
      });
      userId = user.id;
    }

    const coach = await prisma.coach.create({
      data: {
        name,
        bio: bio || null,
        photoUrl: photoUrl || null,
        specialties: specialties ?? [],
        phone: phone || null,
        userId,
      },
    });

    return NextResponse.json({ coach }, { status: 201 });
  } catch (error) {
    console.error("Admin coaches POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
