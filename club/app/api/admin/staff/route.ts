// GET  /api/admin/staff — list all staff accounts (ADMIN + OWNER)
// POST /api/admin/staff — create a new staff account
// OWNER only — staff management is a higher trust boundary than regular
// member admin actions, so this deliberately uses requireOwner, not
// requireAdmin.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { hashPassword } from "@/lib/bcrypt";
import { emailSchema, formatZodError, nameSchema, passwordSchema, phoneSchema } from "@/lib/validation";

const createStaffSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  role: z.enum(["ADMIN", "OWNER"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    }

    const staff = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("List staff error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = createStaffSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, email: normalizedEmail, phone, password, role } = parsed.data;
    const staffRole = role === "OWNER" ? "OWNER" : "ADMIN";

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const staffMember = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone || null,
        password: hashedPassword,
        role: staffRole,
        isActive: true,
        emailVerified: new Date(), // staff accounts are created pre-verified by an owner
      },
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

    return NextResponse.json(staffMember, { status: 201 });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
