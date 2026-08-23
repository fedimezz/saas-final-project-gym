import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, isAuthResponse } from "@/lib/auth-server";
import { formatZodError, planSchema } from "@/lib/validation";

// NOTE: swap this for your existing `requireAdmin` helper if you already
// have one — this inline check just guards against non-admin users using
// the same `requireUser` session helper the rest of the app uses.
async function requireAdmin(request: NextRequest) {
  const auth = await requireUser(request);
  if (isAuthResponse(auth)) return auth;
  if (auth.role !== "ADMIN" && auth.role !== "OWNER") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return auth;
}

// GET /api/admin/plans — list all plans (active + inactive)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const plans = await prisma.membershipPlan.findMany({ orderBy: { price: "asc" } });
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Admin plans GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/plans — create a plan
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = planSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, description, price, durationDays, features } = parsed.data;

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        description: description || null,
        price,
        durationDays,
        features: features ?? [],
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Admin plans POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
