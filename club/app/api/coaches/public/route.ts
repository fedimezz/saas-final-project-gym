import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public, unauthenticated: active coaches only, no email/phone/userId —
// just what a visitor should see (name, photo, bio, specialties, and which
// activities they currently teach in the active weekly plan).
export async function GET() {
  try {
    const coaches = await prisma.coach.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        bio: true,
        photoUrl: true,
        specialties: true,
        sessions: {
          where: { weeklyPlan: { isActive: true } },
          select: { activity: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const shaped = coaches.map((c) => ({
      id: c.id,
      name: c.name,
      bio: c.bio,
      photoUrl: c.photoUrl,
      specialties: c.specialties,
      activities: Array.from(new Set(c.sessions.map((s) => s.activity))),
    }));

    return NextResponse.json({ coaches: shaped });
  } catch (error) {
    console.error("Public coaches GET error:", error);
    return NextResponse.json({ coaches: [] });
  }
}
