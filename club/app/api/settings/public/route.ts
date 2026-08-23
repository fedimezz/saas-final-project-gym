import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const SETTINGS_ID = "singleton";

// Public, unauthenticated: only the branding fields (name/logo/color) are
// exposed here — never address/phone/email/etc. Used by ClubSettingsContext
// to render the real club identity everywhere (public navbar, admin sidebar,
// login/register pages) instead of the hardcoded "Le Club de Gammarth".
export async function GET() {
  try {
    const settings = await prisma.gymSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: {
        name: true, logoUrl: true, primaryColor: true,
        backgroundColor: true, backgroundColorDark: true, enabledPages: true,
        heroTitle: true, heroSubtitle: true, heroImageUrl: true,
      },
    });

    return NextResponse.json({
      name: settings?.name ?? "Le Club de Gammarth",
      logoUrl: settings?.logoUrl ?? null,
      primaryColor: settings?.primaryColor ?? "#0f172a",
      backgroundColor: settings?.backgroundColor ?? "#ffffff",
      backgroundColorDark: settings?.backgroundColorDark ?? "#0a0a0a",
      enabledPages: settings?.enabledPages ?? null,
      heroTitle: settings?.heroTitle ?? null,
      heroSubtitle: settings?.heroSubtitle ?? null,
      heroImageUrl: settings?.heroImageUrl ?? null,
    });
  } catch (error) {
    console.error("Public settings GET error:", error);
    // Never break rendering because of this endpoint — fall back to defaults.
    return NextResponse.json({
      name: "Le Club de Gammarth",
      logoUrl: null,
      primaryColor: "#0f172a",
      backgroundColor: "#ffffff",
      backgroundColorDark: "#0a0a0a",
      enabledPages: null,
      heroTitle: null,
      heroSubtitle: null,
      heroImageUrl: null,
    });
  }
}
