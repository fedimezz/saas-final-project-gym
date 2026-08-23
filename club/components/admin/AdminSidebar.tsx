"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, BookOpen,
  CreditCard, Newspaper, Bell, LogOut, ShieldCheck,
  BarChart3, X, UserCircle, Home, UserCog, Dumbbell,
  ChevronDown, FileBarChart, Tag, KeyRound, Settings, FileEdit, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClubSettings } from "@/context/ClubSettingsContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { name: "Tableau de bord", href: "/admin",               icon: LayoutDashboard },
  { name: "Membres",         href: "/admin/members",        icon: Users },
  {
    name: "Équipe", href: "/admin/staff", icon: UserCog,
    children: [
      { name: "Admins",  href: "/admin/staff",         icon: ShieldCheck, ownerOnly: true },
      { name: "Coachs",  href: "/admin/staff/coaches",  icon: Dumbbell },
    ],
  },
  { name: "Planning",        href: "/admin/schedule",       icon: CalendarDays },
  { name: "Réservations",    href: "/admin/bookings",       icon: BookOpen },
  {
    name: "Adhésions", href: "/admin/subscriptions", icon: CreditCard,
    children: [
      { name: "Abonnements",     href: "/admin/subscriptions",  icon: CreditCard },
      { name: "Offres & tarifs", href: "/admin/plans",          icon: Tag, ownerOnly: true },
    ],
  },
  { name: "Annonces",        href: "/admin/news",           icon: Newspaper },
  { name: "Notifications",   href: "/admin/notifications",  icon: Bell },
  { name: "Rapports",        href: "/admin/reports",        icon: FileBarChart },
  { name: "Analytiques",     href: "/admin/analytics",      icon: BarChart3, ownerOnly: true },
  { name: "Promotions",      href: "/admin/promotions",     icon: Tag, ownerOnly: true },
  { name: "Rôles & permissions", href: "/admin/roles",      icon: KeyRound, ownerOnly: true },
  { name: "Paramètres du club",  href: "/admin/settings",   icon: Settings },
  { name: "Contenu des pages",   href: "/admin/content",    icon: FileEdit, ownerOnly: true },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function filterByRole(items: NavItem[], role: "ADMIN" | "OWNER"): NavItem[] {
  return items
    .filter((item) => !item.ownerOnly || role === "OWNER")
    .map((item) =>
      item.children ? { ...item, children: filterByRole(item.children, role) } : item
    )
    .filter((item) => !item.children || item.children.length > 0);
}

interface Props {
  role: "ADMIN" | "OWNER";
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ role, mobileOpen, onClose }: Props) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { name: clubName, logoUrl } = useClubSettings();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const visibleLinks = filterByRole(NAV, role);
  const onProfile = pathname.startsWith("/admin/profile");

  const handleLogout = () => {
    logout();
    onClose?.();
    window.location.href = "/";
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(pathname, item.href);

    if (item.children) {
      const groupActive = item.children.some((c) => isActive(pathname, c.href));
      const isOpen = openGroup === item.name || groupActive;
      const Icon = item.icon;
      return (
        <div key={item.name}>
          <button
            type="button"
            onClick={() => setOpenGroup(isOpen ? null : item.name)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-xs font-semibold ${
              groupActive
                ? "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Icon size={17} className={`flex-shrink-0 ${groupActive ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"}`} />
            <span className="font-semibold">{item.name}</span>
            <ChevronDown
              size={14}
              className={`ml-auto text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isOpen && (
            <div className="ml-4 pl-3.5 border-l border-slate-200 dark:border-slate-800/80 space-y-1 mt-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const childActive = isActive(pathname, child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 group text-xs font-medium ${
                      childActive
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <ChildIcon size={15} className={`flex-shrink-0 ${childActive ? "text-slate-950" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"}`} />
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-xs ${
          active
            ? "bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
        }`}
      >
        <Icon size={17} className={`flex-shrink-0 ${active ? "text-slate-950" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"}`} />
        <span>{item.name}</span>
        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50/80 dark:bg-[#090d16]/90 backdrop-blur-xl">
      {/* Header / Logo */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-700/50 shadow-md">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={clubName} className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck size={18} className="text-emerald-400" />
            )}
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-slate-100 text-xs tracking-tight flex items-center gap-1">
              Administration <Sparkles size={11} className="text-emerald-400" />
            </p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{clubName}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span className="text-[11px] font-extrabold uppercase tracking-wider">{role} PRIVILEGE</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {visibleLinks.map(renderItem)}
      </nav>

      {/* Footer controls */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1 flex-shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <Home size={16} className="text-slate-400" />
          Retour au site public
        </Link>
        <Link
          href="/admin/profile"
          onClick={onClose}
          className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold ${
            onProfile
              ? "bg-emerald-500 text-slate-950 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <UserCircle size={16} className={onProfile ? "text-slate-950" : "text-slate-400"} />
          Mon profil admin
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-bold"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 border-r border-slate-200 dark:border-slate-800/80 z-20 flex-col shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 dark:border-slate-800 z-50 lg:hidden animate-slide-in flex flex-col shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
