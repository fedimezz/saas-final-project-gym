"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lock, Settings, Loader2, AlertCircle, Check, Upload, Building2,
  Phone, Mail, Link2, Camera, Music2, Palette, Sun, Moon, Eye, Image as ImageIcon, Type,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClubSettings } from "@/context/ClubSettingsContext";

// Wired to the already-built backend (app/api/admin/settings + the
// GymSettings singleton table) — the page used to be a static placeholder
// claiming no table existed, even though the schema/model/API were there.

const DAYS = [
  { key: "mon", label: "Lundi" },
  { key: "tue", label: "Mardi" },
  { key: "wed", label: "Mercredi" },
  { key: "thu", label: "Jeudi" },
  { key: "fri", label: "Vendredi" },
  { key: "sat", label: "Samedi" },
  { key: "sun", label: "Dimanche" },
];

// Keys must match PageKey in context/ClubSettingsContext.tsx and the
// pageKey props used by PagePublishGate on the real pages.
const PUBLIC_PAGES = [
  { key: "activites", label: "Activités", href: "/activites" },
  { key: "coaching", label: "Coaching", href: "/coaching" },
  { key: "offres", label: "Offres", href: "/offres" },
  { key: "actualites", label: "Actualités", href: "/actualites" },
  { key: "gallery", label: "Galerie", href: "/gallery" },
] as const;

interface WorkingHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

interface EnabledPages {
  [key: string]: boolean;
}

interface GymSettings {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  workingHours: WorkingHours | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  primaryColor: string | null;
  backgroundColor: string | null;
  backgroundColorDark: string | null;
  enabledPages: EnabledPages | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
}

const defaultHours: WorkingHours = Object.fromEntries(
    DAYS.map((d) => [d.key, { open: "08:00", close: "22:00", closed: d.key === "sun" }])
);

const defaultEnabledPages: EnabledPages = Object.fromEntries(
    PUBLIC_PAGES.map((p) => [p.key, true])
);

type TabKey = "identity" | "homepage" | "hours" | "pages" | "social";

const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "identity", label: "Identité", icon: Building2 },
  { key: "homepage", label: "Page d'accueil", icon: ImageIcon },
  { key: "hours", label: "Horaires", icon: Sun },
  { key: "pages", label: "Pages publiques", icon: Eye },
  { key: "social", label: "Réseaux sociaux", icon: Link2 },
];

export default function GymSettingsPage() {
  const { userRole } = useAuth();
  const { refresh: refreshClubSettings } = useClubSettings();
  const isOwner = userRole?.toUpperCase() === "OWNER";

  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("identity");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      const json = await res.json();
      if (res.ok) {
        setSettings({
          ...json.settings,
          workingHours: json.settings.workingHours ?? defaultHours,
          enabledPages: { ...defaultEnabledPages, ...(json.settings.enabledPages ?? {}) },
        });
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = <K extends keyof GymSettings>(key: K, value: GymSettings[K]) =>
      setSettings((s) => (s ? { ...s, [key]: value } : s));

  const togglePage = (key: string, value: boolean) =>
      setSettings((s) =>
          s ? { ...s, enabledPages: { ...(s.enabledPages ?? defaultEnabledPages), [key]: value } } : s
      );

  const setHour = (day: string, field: "open" | "close" | "closed", value: string | boolean) =>
      setSettings((s) =>
          s
              ? {
                ...s,
                workingHours: {
                  ...(s.workingHours ?? defaultHours),
                  [day]: { ...(s.workingHours?.[day] ?? defaultHours[day]), [field]: value },
                },
              }
              : s
      );

  const handleLogoSelect = async (file: File | undefined | null) => {
    if (!file || !settings) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body });
      const json = await res.json();
      if (res.ok) {
        set("logoUrl", json.url);
      } else {
        setError(json.error || "Échec du téléversement du logo");
      }
    } catch {
      setError("Erreur réseau lors du téléversement");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeroImageSelect = async (file: File | undefined | null) => {
    if (!file || !settings) return;
    setUploadingHero(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body });
      const json = await res.json();
      if (res.ok) {
        set("heroImageUrl", json.url);
      } else {
        setError(json.error || "Échec du téléversement de la photo");
      }
    } catch {
      setError("Erreur réseau lors du téléversement");
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    if (!settings.name.trim()) {
      setError("Le nom du club ne peut pas être vide.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (res.ok) {
        refreshClubSettings();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(json.error || "Erreur lors de l'enregistrement");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // Admin can view every tab (matches the read-only GET permission the API
  // already grants) but can't edit — only Owner can PUT. Rather than gating
  // the whole page, everything below is wrapped in a <fieldset disabled>,
  // which greys out and disables every input/button in one place.
  return (
      <div className="space-y-6 animate-fade-in pb-24">
        <div>
          <h1 className="text-3xl font-bold text-primary">Paramètres du club</h1>
          <p className="text-muted mt-1">Tout ce qui définit votre club sur le site, organisé par section.</p>
        </div>

        {!isOwner && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-600 text-sm">
              <Lock size={16} className="flex-shrink-0" />
              Lecture seule — seul le propriétaire peut modifier ces paramètres.
            </div>
        )}

        {!loading && settings && (
            <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                            activeTab === tab.key
                                ? "border-[var(--primary)] text-[var(--primary)]"
                                : "border-transparent text-muted hover:text-primary"
                        }`}
                    >
                      <Icon size={15} />
                      {tab.label}
                    </button>
                );
              })}
            </div>
        )}

        {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
            </div>
        ) : !settings ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
              <AlertCircle size={28} className="text-danger" />
              <p className="text-muted">{error || "Impossible de charger les paramètres."}</p>
            </div>
        ) : (
            <fieldset disabled={!isOwner} className="space-y-6 border-0 p-0 m-0 min-w-0">
              {/* Identity */}
              {activeTab === "identity" && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Building2 size={18} className="text-[var(--primary)]" />
                  <h2 className="font-semibold text-primary">Identité</h2>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Building2 size={22} className="text-muted" />
                    )}
                  </div>
                  <div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-muted/30 disabled:opacity-60"
                    >
                      {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingLogo ? "Envoi…" : "Changer le logo"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleLogoSelect(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Nom du club</label>
                    <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => set("name", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Palette size={11} /> Couleur principale
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                          type="color"
                          value={settings.primaryColor ?? "#0f172a"}
                          onChange={(e) => set("primaryColor", e.target.value)}
                          className="w-11 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                      />
                      <input
                          type="text"
                          value={settings.primaryColor ?? ""}
                          onChange={(e) => set("primaryColor", e.target.value)}
                          placeholder="#0f172a"
                          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Sun size={11} /> Fond (mode clair)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                          type="color"
                          value={settings.backgroundColor ?? "#ffffff"}
                          onChange={(e) => set("backgroundColor", e.target.value)}
                          className="w-11 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                      />
                      <input
                          type="text"
                          value={settings.backgroundColor ?? ""}
                          onChange={(e) => set("backgroundColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Moon size={11} /> Fond (mode sombre)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                          type="color"
                          value={settings.backgroundColorDark ?? "#0a0a0a"}
                          onChange={(e) => set("backgroundColorDark", e.target.value)}
                          className="w-11 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                      />
                      <input
                          type="text"
                          value={settings.backgroundColorDark ?? ""}
                          onChange={(e) => set("backgroundColorDark", e.target.value)}
                          placeholder="#0a0a0a"
                          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Adresse</label>
                    <input
                        type="text"
                        value={settings.address ?? ""}
                        onChange={(e) => set("address", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Phone size={11} /> Téléphone
                    </label>
                    <input
                        type="tel"
                        value={settings.phone ?? ""}
                        onChange={(e) => set("phone", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Mail size={11} /> Email
                    </label>
                    <input
                        type="email"
                        value={settings.email ?? ""}
                        onChange={(e) => set("email", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Homepage */}
              {activeTab === "homepage" && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon size={18} className="text-[var(--primary)]" />
                  <h2 className="font-semibold text-primary">Page d&apos;accueil</h2>
                </div>
                <p className="text-xs text-muted mb-4">
                  Photo et texte affichés en haut de la page d&apos;accueil. Sans photo, l&apos;animation 3D par défaut est utilisée.
                </p>

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-28 h-16 rounded-xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.heroImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={settings.heroImageUrl} alt="Photo d'accueil" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon size={20} className="text-muted" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                        onClick={() => heroFileInputRef.current?.click()}
                        disabled={uploadingHero}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-muted/30 disabled:opacity-60"
                    >
                      {uploadingHero ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingHero ? "Envoi…" : settings.heroImageUrl ? "Changer la photo" : "Ajouter une photo"}
                    </button>
                    {settings.heroImageUrl && (
                        <button
                            onClick={() => set("heroImageUrl", null)}
                            className="text-xs text-muted hover:text-danger px-2"
                        >
                          Retirer
                        </button>
                    )}
                    <input
                        ref={heroFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleHeroImageSelect(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Type size={11} /> Titre principal
                    </label>
                    <input
                        type="text"
                        value={settings.heroTitle ?? ""}
                        onChange={(e) => set("heroTitle", e.target.value)}
                        placeholder={settings.name}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Sous-titre</label>
                    <input
                        type="text"
                        value={settings.heroSubtitle ?? ""}
                        onChange={(e) => set("heroSubtitle", e.target.value)}
                        placeholder="L'excellence sportive dans un cadre d'exception"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Working hours */}
              {activeTab === "hours" && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-primary mb-4">Horaires d&apos;ouverture</h2>
                <div className="space-y-2">
                  {DAYS.map((d) => {
                    const h = settings.workingHours?.[d.key] ?? defaultHours[d.key];
                    return (
                        <div key={d.key} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                          <span className="w-24 text-sm text-primary font-medium flex-shrink-0">{d.label}</span>
                          {h.closed ? (
                              <span className="text-xs text-muted flex-1">Fermé</span>
                          ) : (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="time"
                                    value={h.open}
                                    onChange={(e) => setHour(d.key, "open", e.target.value)}
                                    className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-sm"
                                />
                                <span className="text-muted text-xs">à</span>
                                <input
                                    type="time"
                                    value={h.close}
                                    onChange={(e) => setHour(d.key, "close", e.target.value)}
                                    className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-sm"
                                />
                              </div>
                          )}
                          <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer flex-shrink-0">
                            <input
                                type="checkbox"
                                checked={h.closed}
                                onChange={(e) => setHour(d.key, "closed", e.target.checked)}
                                className="rounded"
                            />
                            Fermé
                          </label>
                        </div>
                    );
                  })}
                </div>
              </div>
              )}

              {/* Public pages */}
              {activeTab === "pages" && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={18} className="text-[var(--primary)]" />
                  <h2 className="font-semibold text-primary">Pages publiques</h2>
                </div>
                <p className="text-xs text-muted mb-4">
                  Désactiver une page la retire du menu et bloque l&apos;accès direct au lien — les visiteurs sont redirigés vers l&apos;accueil.
                </p>
                <div className="space-y-1">
                  {PUBLIC_PAGES.map((p) => {
                    const enabled = (settings.enabledPages ?? defaultEnabledPages)[p.key] !== false;
                    return (
                        <label
                            key={p.key}
                            className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/20 cursor-pointer border-b border-border last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-primary">{p.label}</p>
                            <p className="text-xs text-muted font-mono">{p.href}</p>
                          </div>
                          <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => togglePage(p.key, e.target.checked)}
                              className="w-5 h-5 rounded accent-[var(--primary)] cursor-pointer"
                          />
                        </label>
                    );
                  })}
                </div>
              </div>
              )}

              {/* Social links */}
              {activeTab === "social" && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-primary mb-4">Réseaux sociaux</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Link2 size={11} /> Facebook
                    </label>
                    <input
                        type="url"
                        value={settings.facebookUrl ?? ""}
                        onChange={(e) => set("facebookUrl", e.target.value)}
                        placeholder="https://facebook.com/…"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Camera size={11} /> Instagram
                    </label>
                    <input
                        type="url"
                        value={settings.instagramUrl ?? ""}
                        onChange={(e) => set("instagramUrl", e.target.value)}
                        placeholder="https://instagram.com/…"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Music2 size={11} /> TikTok
                    </label>
                    <input
                        type="url"
                        value={settings.tiktokUrl ?? ""}
                        onChange={(e) => set("tiktokUrl", e.target.value)}
                        placeholder="https://tiktok.com/@…"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                    />
                  </div>
                </div>
              </div>
              )}

              {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
                    <AlertCircle size={16} /> {error}
                  </div>
              )}
            </fieldset>
        )}

        {/* Sticky save bar — Owner only; Admin is view-only so there's nothing to save */}
        {isOwner && settings && !loading && (
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-card/95 backdrop-blur border-t border-border p-4 flex items-center justify-end gap-3 z-20">
              {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check size={16} /> Enregistré
            </span>
              )}
              <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
                Enregistrer les modifications
              </button>
            </div>
        )}
      </div>
  );
}