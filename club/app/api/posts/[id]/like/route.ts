import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, isAuthResponse } from "@/lib/auth-server";

// POST /api/posts/[id]/like — toggle: like if not already liked, unlike if
// already liked. Any logged-in member/admin/owner can like an announcement.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request);
    if (isAuthResponse(auth)) return auth;
    const userId = auth.id;

    const { id: postId } = await params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.like.create({ data: { userId, postId } });
    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Post like POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
