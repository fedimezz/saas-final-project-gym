"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, TrendingUp, TrendingDown, Users, Lock, AlertCircle,
  Wallet, CalendarCheck, PieChart as PieChartIcon,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import StatCard from "@/components/admin/StatCard";

interface AnalyticsData {
  totalMembers: number;
  activeSubscriptions: number;
  newMembersThisMonth: number;
  memberGrowthPct: number | null;
  revenueThisMonth: number;
  revenueLastMonth: number;
  attendanceLast30Days: number;
  planBreakdown: { planId: string; planName: string; activeSubscriptions: number }[];
  revenueByMonth: { label: string; revenue: number }[];
}

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#a855f7"];

function ChartTooltip({ active, payload, label, suffix }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lg text-xs">
      {label && <p className="font-semibold text-primary mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-muted">
          {p.name ? `${p.name}: ` : ""}
          <span className="font-semibold text-primary">{p.value.toLocaleString("fr-FR")}{suffix ?? ""}</span>
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { userRole } = useAuth();
  const isOwner = userRole?.toUpperCase() === "OWNER";

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", { credentials: "include" });
      const json = await res.json();
      if (res.ok) setData(json);
      else setError(json.error || "Erreur de chargement");
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) fetchAnalytics();
    else setLoading(false);
  }, [isOwner, fetchAnalytics]);

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Lock size={28} className="text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-primary">Réservé au propriétaire</p>
          <p className="text-sm text-muted mt-1">
            Les analytiques business (revenus, croissance) ne sont visibles que par le rôle OWNER.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <AlertCircle size={28} className="text-danger" />
        <p className="text-muted">{error || "Impossible de charger les analytiques."}</p>
      </div>
    );
  }

  const revenueDelta = data.revenueThisMonth - data.revenueLastMonth;
  const revenueDeltaPct = data.revenueLastMonth > 0
    ? Math.round((revenueDelta / data.revenueLastMonth) * 100)
    : null;

  const pieData = data.planBreakdown.map((p) => ({ name: p.planName, value: p.activeSubscriptions }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">Analytiques</h1>
        <p className="text-muted mt-1">Revenus, croissance et répartition des abonnements.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenus ce mois"
          value={`${data.revenueThisMonth.toLocaleString("fr-FR")} TND`}
          icon={Wallet}
          color="green"
          subtitle={`${data.revenueLastMonth.toLocaleString("fr-FR")} TND le mois dernier`}
          trend={
            revenueDeltaPct !== null
              ? { value: `${revenueDeltaPct > 0 ? "+" : ""}${revenueDeltaPct}%`, up: revenueDeltaPct >= 0 }
              : undefined
          }
        />
        <StatCard
          title="Nouveaux membres"
          value={String(data.newMembersThisMonth)}
          icon={Users}
          color="blue"
          trend={
            data.memberGrowthPct !== null
              ? { value: `${data.memberGrowthPct > 0 ? "+" : ""}${data.memberGrowthPct}%`, up: data.memberGrowthPct >= 0 }
              : undefined
          }
        />
        <StatCard
          title="Abonnements actifs"
          value={String(data.activeSubscriptions)}
          icon={PieChartIcon}
          color="purple"
          subtitle={`${data.totalMembers} membres au total`}
        />
        <StatCard
          title="Présences (30j)"
          value={String(data.attendanceLast30Days)}
          icon={data.memberGrowthPct !== null && data.memberGrowthPct < 0 ? TrendingDown : TrendingUp}
          color="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-primary flex items-center gap-2">
              <TrendingUp size={17} className="text-[var(--primary)]" />
              Revenus des 6 derniers mois
            </h2>
          </div>
          <p className="text-xs text-muted mb-4">Total payé, par mois</p>
          <div className="h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByMonth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground, #94a3b8)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground, #94a3b8)" fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} width={40} />
                <Tooltip content={<ChartTooltip suffix=" TND" />} cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="revenue" name="Revenus" stroke="var(--primary)" strokeWidth={2.5}
                  fill="url(#revenueFill)" dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-primary flex items-center gap-2 mb-1">
            <PieChartIcon size={17} className="text-[var(--primary)]" />
            Répartition par plan
          </h2>
          <p className="text-xs text-muted mb-2">Abonnements actifs</p>
          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted text-sm">Aucun abonnement actif.</p>
            </div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3">
                {pieData.map((p, i) => {
                  const pct = data.activeSubscriptions > 0 ? Math.round((p.value / data.activeSubscriptions) * 100) : 0;
                  return (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-primary truncate">{p.name}</span>
                      </span>
                      <span className="text-muted flex-shrink-0 ml-2">{p.value} · {pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-3">
        <CalendarCheck size={18} className="text-[var(--primary)] flex-shrink-0" />
        <p className="text-sm text-muted">
          Les tendances sont calculées par rapport au mois précédent. Les revenus n&apos;incluent que les paiements marqués « Payé ».
        </p>
      </div>
    </div>
  );
}
