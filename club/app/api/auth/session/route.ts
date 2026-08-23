import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const auth = await requireUser(request);
    if (!auth.ok) {
        return NextResponse.json({ user: null }, { status: auth.status });
    }
    return NextResponse.json({
        user: { id: auth.user.id, email: auth.user.email, role: auth.user.role, name: auth.user.name },
    });
}