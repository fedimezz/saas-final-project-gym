"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, CreditCard, CalendarDays, BookOpen,
  Bell, Newspaper, TrendingUp, Clock, Loader2,
  ArrowRight, AlertCircle, XCircle, Dumbbell,
  ShieldCheck, UserCog,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { useAuth } from "@/context/AuthContext";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiredSubscriptions: number;
  totalSessionsBooked: number;
  attendancesToday: number;
  unreadNotifications: number;
  revenueThisMonth: number;
  totalCoaches: number;
  totalAdmins: number;
  todaysReservations: number;
  todaysClasses: number;
}

const ADMIN_QUICK_ACTIONS = [
  { label: "Ajouter un membre",    href: "/admin/members",       icon: Users },
  { label: "Gérer le planning",     href: "/admin/schedule",      icon: CalendarDays },
  { label: "Valider abonnements",   href: "/admin/subscriptions", icon: CreditCard },
  { label: "Publier une annonce",   href: "/admin/news",          icon: Newspaper },
  { label: "Envoyer notification",  href: "/admin/notifications", icon: Bell },
  { label: "Voir réservations",     href: "/admin/bookings",      icon: BookOpen },
];

// Owner gets everything Admin gets, plus the business-level shortcuts.
const OWNER_QUICK_ACTIONS = [
  ...ADMIN_QUICK_ACTIONS,
  { label: "Gérer les admins",      href: "/admin/staff",         icon: UserCog },
  { label: "Voir les analytiques",  href: "/admin/analytics",     icon: TrendingUp },
];

// Safe number formatter — returns "0" instead of throwing if value is undefined/null
function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return value.toLocaleString("fr-FR");
}

export default function AdminOverviewPage() {
  const { userRole } = useAuth();
  const isOwner = userRole?.toUpperCase() === "OWNER";

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Erreur de chargement");
        return;
      }

      // Defensive: coerce all numeric fields to numbers to prevent
      // toLocaleString / arithmetic crashes if a field comes back undefined.
      setStats({
        totalMembers:         Number(json.totalMembers         ?? 0),
        activeMembers:        Number(json.activeMembers        ?? 0),
        newMembersThisMonth:  Number(json.newMembersThisMonth  ?? 0),
        activeSubscriptions:  Number(json.activeSubscriptions  ?? 0),
        pendingSubscriptions: Number(json.pendingSubscriptions ?? 0),
        expiredSubscriptions: Number(json.expiredSubscriptions ?? 0),
        totalSessionsBooked:  Number(json.totalSessionsBooked  ?? 0),
        attendancesToday:     Number(json.attendancesToday     ?? 0),
        unreadNotifications:  Number(json.unreadNotifications  ?? 0),
        revenueThisMonth:     Number(json.revenueThisMonth     ?? 0),
        totalCoaches:         Number(json.totalCoaches         ?? 0),
        totalAdmins:          Number(json.totalAdmins          ?? 0),
        todaysReservations:   Number(json.todaysReservations   ?? 0),
        todaysClasses:        Number(json.todaysClasses        ?? 0),
      });
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={44} className="animate-spin text-[var(--primary)]" />
          <p className="text-sm text-muted">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertCircle size={28} className="text-danger" />
        </div>
        <p className="text-muted text-center">{error || "Impossible de charger les données."}</p>
        <button
          onClick={fetchStats}
          className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const quickActions = isOwner ? OWNER_QUICK_ACTIONS : ADMIN_QUICK_ACTIONS;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">Vue d&apos;ensemble</h1>
        <p className="text-muted mt-1">
          {isOwner ? "Vue d'ensemble business du club." : "Tableau de bord opérationnel du club."}
        </p>
      </div>

      {/* KPIs — shared between Admin and Owner */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Membres actifs"
          value={formatNumber(stats.activeMembers)}
          icon={Users}
          color="blue"
          subtitle={`Sur ${formatNumber(stats.totalMembers)} inscrits`}
          trend={{ value: `+${stats.newMembersThisMonth} ce mois`, up: true }}
        />
        <StatCard
          title="Abonnements actifs"
          value={formatNumber(stats.activeSubscriptions)}
          icon={CreditCard}
          color="purple"
          subtitle={
            stats.pendingSubscriptions > 0
              ? `${stats.pendingSubscriptions} en attente`
              : "Tous à jour"
          }
        />
        <StatCard
          title="Abonnements expirés"
          value={formatNumber(stats.expiredSubscriptions)}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Présences aujourd'hui"
          value={formatNumber(stats.attendancesToday)}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Réservations aujourd'hui"
          value={formatNumber(stats.todaysReservations)}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Cours aujourd'hui"
          value={formatNumber(stats.todaysClasses)}
          icon={Dumbbell}
          color="green"
        />
        <StatCard
          title="Notifications non lues"
          value={formatNumber(stats.unreadNotifications)}
          icon={Bell}
          color="red"
        />

        {/* Owner-only: business/staff level KPIs — Admin doesn't get
            profit or staff-count visibility per the role permission matrix. */}
        {isOwner && (
          <>
            <StatCard
              title="Revenus ce mois"
              value={`${formatNumber(stats.revenueThisMonth)} TND`}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Total coachs"
              value={formatNumber(stats.totalCoaches)}
              icon={Dumbbell}
              color="purple"
            />
            <StatCard
              title="Total admins"
              value={formatNumber(stats.totalAdmins)}
              icon={ShieldCheck}
              color="blue"
            />
          </>
        )}
      </div>

      {/* Pending subscriptions alert */}
      {stats.pendingSubscriptions > 0 && (
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <CreditCard size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-primary">
                {stats.pendingSubscriptions} abonnement{stats.pendingSubscriptions > 1 ? "s" : ""} en attente
              </p>
              <p className="text-sm text-muted">
                Des membres attendent la validation de leur paiement.
              </p>
            </div>
          </div>
          <Link
            href="/admin/subscriptions?status=PENDING"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            Valider <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">Actions rapides</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl hover:shadow-md hover:border-[var(--primary)]/30 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                  <Icon size={20} className="text-[var(--primary)]" />
                </div>
                <span className="font-medium text-primary">{action.label}</span>
                <ArrowRight size={16} className="ml-auto text-muted group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
