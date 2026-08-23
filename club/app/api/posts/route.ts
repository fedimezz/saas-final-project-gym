import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notifyAllMembers } from "@/lib/notify";
import { hasPermission } from "@/lib/permissions";
import { formatZodError, postSchema } from "@/lib/validation";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { isPublished: true },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      likes: { select: { userId: true } },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  const admin = auth.user;

  if (!(await hasPermission(admin, "announcements.manage"))) {
    return NextResponse.json({ error: "Permission requise : gérer les annonces" }, { status: 403 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { title, content, mediaUrl, mediaType, musicUrl } = parsed.data;

  const post = await prisma.post.create({
    data: {
      authorId: admin.id,
      title: title || null,
      content,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      musicUrl: musicUrl || null,
    },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      likes: true,
      comments: true,
    },
  });

  // 🔔 Notify all members instantly via SSE + persist in DB bell
  await notifyAllMembers({
    title: "📰 Nouvelle actualité",
    message: title
      ? `"${title}" — ${content.slice(0, 80)}${content.length > 80 ? "…" : ""}`
      : content.slice(0, 100) + (content.length > 100 ? "…" : ""),
    type: "NEWS",
    data: { postId: post.id },
  });

  return NextResponse.json(post, { status: 201 });
}