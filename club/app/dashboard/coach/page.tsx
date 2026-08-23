"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Clock, MapPin, Users, Check, Undo2, ChevronDown } from "lucide-react";

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Lundi", TUESDAY: "Mardi", WEDNESDAY: "Mercredi", THURSDAY: "Jeudi",
  FRIDAY: "Vendredi", SATURDAY: "Samedi", SUNDAY: "Dimanche",
};
const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const ACTIVITY_LABELS: Record<string, string> = {
  BODYBUILDING: "Musculation", FITNESS: "Fitness", CARDIO: "Cardio",
  CROSSFIT: "CrossFit", YOGA: "Yoga", PILATES: "Pilates",
  BOXE: "Boxe", MMA: "MMA", AQUAGYM: "Aquagym",
  PADEL: "Padel", ZUMBA: "Zumba", SPINNING: "Spinning",
};

interface CoachSession {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  capacity: number;
  currentBookings: number;
}

interface RosterMember {
  userId: string;
  name: string;
  avatar: string | null;
  checkedIn: boolean;
}

export default function CoachDashboardPage() {
  const [coachName, setCoachName] = useState("");
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [roster, setRoster] = useState<Record<string, RosterMember[]>>({});
  const [loadingRoster, setLoadingRoster] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/coach/sessions", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setCoachName(data.coach?.name ?? "");
        setSessions(data.sessions ?? []);
      } else {
        setError(data.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const toggleExpand = async (sessionId: string) => {
    if (expanded === sessionId) {
      setExpanded(null);
      return;
    }
    setExpanded(sessionId);
    if (!roster[sessionId]) {
      setLoadingRoster(sessionId);
      try {
        const res = await fetch(`/api/dashboard/coach/sessions/${sessionId}/roster`, { credentials: "include" });
        const data = await res.json();
        if (res.ok) setRoster((r) => ({ ...r, [sessionId]: data.roster ?? [] }));
      } catch {
        // roster stays empty — the section will show "aucun inscrit"
      } finally {
        setLoadingRoster(null);
      }
    }
  };

  const toggleCheckIn = async (sessionId: string, userId: string, currentlyCheckedIn: boolean) => {
    setTogglingUserId(userId);
    try {
      const res = await fetch("/api/dashboard/coach/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, userId, undo: currentlyCheckedIn }),
      });
      if (res.ok) {
        setRoster((r) => ({
          ...r,
          [sessionId]: r[sessionId].map((m) => (m.userId === userId ? { ...m, checkedIn: !currentlyCheckedIn } : m)),
        }));
      }
    } catch {
      // no-op — member's checkbox just won't have moved, they can retry
    } finally {
      setTogglingUserId(null);
    }
  };

  const sessionsByDay = DAY_ORDER.map((day) => ({
    day,
    sessions: sessions.filter((s) => s.day === day),
  })).filter((d) => d.sessions.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {coachName ? `Bonjour, ${coachName}` : "Mon planning"}
        </h1>
        <p className="text-muted mt-1">Vos séances de la semaine et le pointage des présences.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted">
          Aucune séance ne vous est assignée cette semaine.
        </div>
      ) : (
        <div className="space-y-6">
          {sessionsByDay.map(({ day, sessions: daySessions }) => (
            <div key={day}>
              <h2 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">{DAY_LABEL[day]}</h2>
              <div className="space-y-2">
                {daySessions.map((s) => (
                  <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleExpand(s.id)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-primary">{ACTIVITY_LABELS[s.activity] ?? s.activity}</p>
                        <div className="flex items-center gap-3 text-xs text-muted mt-1">
                          <span className="flex items-center gap-1"><Clock size={12} />{s.startTime}–{s.endTime}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} />{s.location}</span>
                          <span className="flex items-center gap-1"><Users size={12} />{s.currentBookings}/{s.capacity}</span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-muted transition-transform ${expanded === s.id ? "rotate-180" : ""}`} />
                    </button>

                    {expanded === s.id && (
                      <div className="border-t border-border p-4">
                        {loadingRoster === s.id ? (
                          <div className="flex justify-center py-6">
                            <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
                          </div>
                        ) : !roster[s.id] || roster[s.id].length === 0 ? (
                          <p className="text-sm text-muted text-center py-2">Aucun membre inscrit pour l&apos;instant.</p>
                        ) : (
                          <div className="space-y-2">
                            {roster[s.id].map((m) => (
                              <div key={m.userId} className="flex items-center gap-3">
                                {m.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                    {m.name?.[0]?.toUpperCase() ?? "?"}
                                  </div>
                                )}
                                <span className="flex-1 text-sm text-primary truncate">{m.name}</span>
                                <button
                                  onClick={() => toggleCheckIn(s.id, m.userId, m.checkedIn)}
                                  disabled={togglingUserId === m.userId}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                                    m.checkedIn
                                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                      : "border border-border text-muted hover:bg-neutral-50 dark:hover:bg-neutral-900"
                                  }`}
                                >
                                  {m.checkedIn ? <Undo2 size={13} /> : <Check size={13} />}
                                  {m.checkedIn ? "Annuler" : "Présent"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
