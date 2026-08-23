import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ClubSettingsProvider } from "@/context/ClubSettingsContext";
import { LanguageProvider } from "@/context/LanguageContext";
import RootShell from "@/components/layout/RootShell";

export const metadata: Metadata = {
  title: "Le Club Gammarth",
  description: "Premium Sports Club Dashboard",
};

// This runs synchronously, before React hydrates and before first paint.
// It reads the SAME storage key / fallback logic as readStoredTheme() in
// ThemeContext.tsx — keep these two in sync if you ever change one.
//
// Why this exists: ThemeProvider's React state always starts at "light"
// (required, so server and client render the same markup and avoid a
// hydration mismatch). Without this script, a returning visitor with dark
// mode saved would see a flash of light mode for a frame or two until
// ThemeProvider's mount effect corrects it. This script sets the "dark"
// class directly on <html> immediately, outside of React entirely, so
// there's no flash and no hydration mismatch (React never claims to have
// rendered "dark" — the class is just sitting there independently of it).
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

// Same rationale as themeInitScript above: sets <html lang>/dir before
// paint so an Arabic-preferring guest doesn't see a flash of LTR layout.
// LanguageProvider's mount effect re-applies this once it knows whether
// the visitor is logged in (and may override with their saved account
// preference), this is just the pre-paint guess from localStorage.
const langInitScript = `
(function () {
  try {
    var lang = localStorage.getItem("lang") || "FR";
    document.documentElement.lang = lang.toLowerCase();
    document.documentElement.dir = lang === "AR" ? "rtl" : "ltr";
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: langInitScript }} />
      </head>
      <body className="bg-primary text-primary">
        <ThemeProvider>
          <ClubSettingsProvider>
            <AuthProvider>
              <LanguageProvider>
                <RootShell>{children}</RootShell>
              </LanguageProvider>
            </AuthProvider>
          </ClubSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}