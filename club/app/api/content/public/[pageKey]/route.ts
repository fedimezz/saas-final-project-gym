import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PAGE_CONTENT_SCHEMA } from "@/lib/page-content-schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageKey: string }> }
) {
  const { pageKey } = await params;

  // Reject page keys that aren't in the schema rather than doing a lookup
  // for an arbitrary string — keeps this endpoint from being a generic
  // "read any row" probe.
  if (!PAGE_CONTENT_SCHEMA.some((p) => p.pageKey === pageKey)) {
    return NextResponse.json({ content: {} });
  }

  try {
    const row = await prisma.pageContent.findUnique({ where: { pageKey } });
    return NextResponse.json({ content: row?.content ?? {} });
  } catch (error) {
    console.error("Public page-content GET error:", error);
    return NextResponse.json({ content: {} });
  }
}
