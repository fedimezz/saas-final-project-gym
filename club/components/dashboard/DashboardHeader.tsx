"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, ChevronDown, X, LogOut, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardLinks, coachLinks, isLinkActive } from "@/lib/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id:string; title:string; message:string; isRead:boolean; sentAt:string}>>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const pathname = usePathname();
  const { logout, isLoggedIn, userRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const links = userRole?.toUpperCase() === "COACH" ? coachLinks : dashboardLinks;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications) {
        const target = event.target as HTMLElement;
        if (!target.closest(".notifications-dropdown")) {
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/dashboard/notifications?limit=5", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      } catch {
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadNotifications();
  }, [isLoggedIn]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    // Goes through AuthContext so the httpOnly cookie is cleared via
    // /api/auth/logout and every localStorage key is removed consistently.
    // The previous version only cleared "token"/"role" directly and never
    // touched the cookie, leaving the session valid until natural expiry.
    logout();
    window.location.href = "/";
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 bg-primary border-b border-border lg:pl-72">
        <div className="flex items-center justify-between px-6 h-16">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? (
              <X size={20} className="text-primary" />
            ) : (
              <Menu size={20} className="text-primary" />
            )}
          </button>

          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-primary">Le Club</h1>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Basculer le thème"
            >
              {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-primary" />}
            </button>

            <div className="relative notifications-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-muted transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-muted" />
                {!loadingNotifications && notifications.some((item) => !item.isRead) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full ring-2 ring-[var(--bg-primary)]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-primary">Notifications</h3>
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-primary hover:underline"
                    >
                      Tout voir
                    </Link>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-3 text-sm text-muted">Chargement...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-3 text-sm text-muted">Aucune notification</div>
                    ) : (
                      notifications.map((item) => (
                        <NotificationItem
                          key={item.id}
                          title={item.title}
                          time={new Date(item.sentAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          unread={!item.isRead}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 cursor-pointer hover:bg-muted rounded-lg p-2 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">
                ?
              </div>
              <ChevronDown size={16} className="text-muted hidden sm:block" />
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-72 bg-primary border-r border-border z-50 lg:hidden animate-slide-in overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-primary">Le Club</h2>
              <p className="text-xs text-muted -mt-1">de Gammarth</p>
            </div>
            <nav className="p-4 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${
                        active
                          ? "bg-nav-active text-white shadow-sm"
                          : "text-muted hover:bg-muted hover:text-primary"
                      }
                    `}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function NotificationItem({ title, time, unread }: { title: string; time: string; unread?: boolean }) {
  return (
    <div className={`p-3 hover:bg-muted transition-colors cursor-pointer border-b border-border last:border-0 ${unread ? "bg-muted/40" : ""}`}>
      <div className="flex items-start gap-2">
        {unread && <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-danger" />}
        <div className="flex-1">
          <p className="text-sm text-primary">{title}</p>
          <p className="text-xs text-muted mt-1">{time}</p>
        </div>
      </div>
    </div>
  );
}
