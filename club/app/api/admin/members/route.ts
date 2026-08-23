// GET  /api/admin/members?search=&page= — paginated, searchable member list (ADMIN + OWNER)
// POST /api/admin/members — create a new member (ADMIN + OWNER)
//
// NOTE: this file was missing entirely, which is why the members page in the
// admin dashboard was getting a 404 (and the client tried to JSON.parse the
// Next.js HTML 404 page, producing "Unexpected token '<'").
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/bcrypt";
import { hasPermission } from "@/lib/permissions";
import { emailSchema, formatZodError, nameSchema, passwordSchema, phoneSchema } from "@/lib/validation";

const PAGE_SIZE = 20;

const createMemberSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim();
    const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const where = {
      role: "MEMBER" as const,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              status: true,
              endDate: true,
              plan: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    const members = users.map((u) => {
      const sub = u.subscriptions[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        subscription: sub
          ? { status: sub.status, planName: sub.plan.name, endDate: sub.endDate }
          : null,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return NextResponse.json({
      members,
      pagination: { page, totalPages, total, pageSize: PAGE_SIZE },
    });
  } catch (error) {
    console.error("List members error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });
    }
    if (!(await hasPermission(auth.user, "members.write"))) {
      return NextResponse.json({ error: "Permission requise : ajouter/modifier des membres" }, { status: 403 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = createMemberSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, email: normalizedEmail, phone, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const member = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone || null,
        password: hashedPassword,
        role: "MEMBER",
        isActive: true,
        emailVerified: new Date(), // created directly by staff, so pre-verified
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

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
