import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { PAGE_CONTENT_SCHEMA } from "@/lib/page-content-schema";
import { formatZodError, pageContentEnvelopeSchema } from "@/lib/validation";

// Returns every page defined in the schema, each with its field
// definitions and whatever the Owner has already saved for it (defaulting
// to {} for pages never touched). One call gives the admin editor
// everything it needs to render every page's form.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès refusé" }, { status: auth.status });

    const rows = await prisma.pageContent.findMany({
      where: { pageKey: { in: PAGE_CONTENT_SCHEMA.map((p) => p.pageKey) } },
    });
    const savedByPage = new Map(rows.map((r: { pageKey: string; content: unknown }) => [r.pageKey, r.content as Record<string, string>]));

    const pages = PAGE_CONTENT_SCHEMA.map((def) => ({
      pageKey: def.pageKey,
      label: def.label,
      fields: def.fields,
      previewPath: def.previewPath,
      content: savedByPage.get(def.pageKey) ?? {},
    }));

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Admin page-content GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return NextResponse.json({ error: "Accès réservé au propriétaire" }, { status: auth.status });
    const owner = auth.user;

    const rawBody = await request.json().catch(() => null);
    const parsed = pageContentEnvelopeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { pageKey, content } = parsed.data;
    const def = PAGE_CONTENT_SCHEMA.find((p) => p.pageKey === pageKey);
    if (!def) {
      return NextResponse.json({ error: "Page inconnue" }, { status: 400 });
    }

    // Only persist keys the schema actually declares for this page — drops
    // stray keys instead of letting the content blob grow unbounded.
    const allowedKeys = new Set(def.fields.map((f) => f.key));
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(content)) {
      if (allowedKeys.has(key) && typeof value === "string") clean[key] = value.trim();
    }

    const row = await prisma.pageContent.upsert({
      where: { pageKey },
      create: { pageKey, content: clean, updatedBy: owner.id },
      update: { content: clean, updatedBy: owner.id },
    });

    return NextResponse.json({ pageKey: row.pageKey, content: row.content });
  } catch (error) {
    console.error("Admin page-content PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
