import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { PERMISSION_CATALOG, isValidPermissionKey } from "@/lib/permissions";
import { formatZodError, permissionUpdateSchema } from "@/lib/validation";

// Only ADMIN permissions are configurable. OWNER always has everything and
// MEMBER has none of these admin-panel permissions to begin with.
const CONFIGURABLE_ROLE = "ADMIN" as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });

    const rows = await prisma.rolePermission.findMany({
      where: { role: CONFIGURABLE_ROLE },
    });
    const overrides = new Map(rows.map((r: { key: string; allowed: boolean }) => [r.key, r.allowed]));

    const permissions = PERMISSION_CATALOG.map((p) => ({
      ...p,
      allowed: overrides.has(p.key) ? overrides.get(p.key) : true,
    }));

    const [adminCount, ownerCount] = await Promise.all([
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "OWNER" } }),
    ]);

    return NextResponse.json({ role: CONFIGURABLE_ROLE, permissions, adminCount, ownerCount });
  } catch (error) {
    console.error("Admin roles GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });
    const owner = auth.user;

    const rawBody = await request.json().catch(() => null);
    const parsed = permissionUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { key, allowed } = parsed.data;

    // isValidPermissionKey checks against the dynamic PERMISSION_CATALOG —
    // Zod validates shape/type, this validates the value is a real key.
    if (!isValidPermissionKey(key)) {
      return NextResponse.json({ error: "Permission inconnue" }, { status: 400 });
    }

    const row = await prisma.rolePermission.upsert({
      where: { role_key: { role: CONFIGURABLE_ROLE, key } },
      update: { allowed, updatedBy: owner.id },
      create: { role: CONFIGURABLE_ROLE, key, allowed, updatedBy: owner.id },
    });

    return NextResponse.json({ permission: row });
  } catch (error) {
    console.error("Admin roles PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
