"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, userRole, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleUpper = userRole?.toUpperCase() ?? null;
  const isAuthorized =
    isLoggedIn && (roleUpper === "ADMIN" || roleUpper === "OWNER");

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      router.replace("/user/login");
      return;
    }

    if (!isAuthorized) {
      router.replace("/dashboard");
    }
  }, [isLoading, isLoggedIn, isAuthorized, router]);

  // As with the dashboard layout, this is a fast client-side UX check.
  // The actual access control for /admin/* happens in proxy.ts, which
  // verifies the httpOnly cookie's JWT before the request ever reaches here.
  if (isLoading || !isAuthorized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-primary z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[var(--primary)]" />
          <p className="text-sm text-muted">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-primary overflow-hidden">
      <AdminSidebar
        role={roleUpper as "ADMIN" | "OWNER"}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          onMobileMenu={() => setMobileOpen(true)}
          role={roleUpper as "ADMIN" | "OWNER"}
        />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
