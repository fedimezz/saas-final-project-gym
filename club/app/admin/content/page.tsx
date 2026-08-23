"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, Loader2, AlertCircle, Check, Save, Upload, Image as ImageIcon, FileText, ExternalLink, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { ContentField } from "@/lib/page-content-schema";

interface PageEntry {
  pageKey: string;
  label: string;
  fields: ContentField[];
  content: Record<string, string>;
  previewPath: string;
}

export default function PageContentAdmin() {
  const { userRole } = useAuth();
  const isOwner = userRole?.toUpperCase() === "OWNER";

  const [pages, setPages] = useState<PageEntry[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewNonce, setPreviewNonce] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUpload = useRef<{ key: string; mode: "image" | "gallery-add" } | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/page-content", { credentials: "include" });
      const json = await res.json();
      if (res.ok) {
        setPages(json.pages);
        setActiveKey((k) => k ?? json.pages[0]?.pageKey ?? null);
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const active = pages.find((p) => p.pageKey === activeKey) ?? null;

  const setField = (key: string, value: string) => {
    setPages((prev) =>
        prev.map((p) => (p.pageKey === activeKey ? { ...p, content: { ...p.content, [key]: value } } : p))
    );
  };

  // "gallery" fields store their value as a JSON array of photo URLs.
  const getGalleryList = (field: ContentField): string[] => {
    if (!active) return [];
    const raw = active.content[field.key] ?? field.defaultValue;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const setGalleryList = (key: string, urls: string[]) => {
    setField(key, JSON.stringify(urls));
  };

  const removeGalleryImage = (field: ContentField, index: number) => {
    const current = getGalleryList(field);
    setGalleryList(field.key, current.filter((_, i) => i !== index));
  };

  const handleImageSelect = async (file: File | undefined | null) => {
    const pending = pendingUpload.current;
    if (!file || !pending) return;
    const { key, mode } = pending;
    setUploadingKey(key);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body });
      const json = await res.json();
      if (res.ok) {
        if (mode === "gallery-add") {
          const field = active?.fields.find((f) => f.key === key);
          if (field) setGalleryList(key, [...getGalleryList(field), json.url]);
        } else {
          setField(key, json.url);
        }
      } else {
        setError(json.error || "Échec du téléversement");
      }
    } catch {
      setError("Erreur réseau lors du téléversement");
    } finally {
      setUploadingKey(null);
      pendingUpload.current = null;
    }
  };

  const handleSave = async () => {
    if (!active) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/page-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pageKey: active.pageKey, content: active.content }),
      });
      const json = await res.json();
      if (res.ok) {
        setSaved(true);
        setPreviewNonce((n) => n + 1); // reload the preview iframe with the freshly saved content
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

  if (!isOwner) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock size={28} className="text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-primary">Réservé au propriétaire</p>
            <p className="text-sm text-muted mt-1">Le contenu des pages n&apos;est modifiable que par le rôle OWNER.</p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6 animate-fade-in pb-24">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-primary">Contenu des pages</h1>
            <p className="text-muted mt-1">Textes et photos affichés sur le site public, page par page.</p>
          </div>
          {active && (
              <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowPreview((v) => !v)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-muted/30"
                >
                  {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPreview ? "Masquer l'aperçu" : "Voir la page"}
                </button>
                <a
                    href={active.previewPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-muted/30"
                >
                  <ExternalLink size={14} /> Ouvrir dans un nouvel onglet
                </a>
              </div>
          )}
        </div>

        {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
            </div>
        ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
              <AlertCircle size={28} className="text-danger" />
              <p className="text-muted">Aucune page éditable pour le moment.</p>
            </div>
        ) : (
            <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-[220px_1fr_1fr]" : "lg:grid-cols-[220px_1fr]"}`}>
              {/* Page selector */}
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {pages.map((p) => (
                    <button
                        key={p.pageKey}
                        onClick={() => setActiveKey(p.pageKey)}
                        className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                            activeKey === p.pageKey
                                ? "bg-[var(--primary)] text-white"
                                : "text-muted hover:bg-muted/20"
                        }`}
                    >
                      {p.label}
                    </button>
                ))}
              </div>

              {/* Field editor */}
              {active && (
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                    <h2 className="font-semibold text-primary">{active.label}</h2>

                    {active.fields.map((f) => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            {f.type === "image" || f.type === "gallery" ? <ImageIcon size={11} /> : <FileText size={11} />} {f.label}
                          </label>

                          {f.type === "image" ? (
                              <div className="flex items-center gap-4">
                                <div className="w-28 h-16 rounded-xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {(active.content[f.key] || f.defaultValue) ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                          src={active.content[f.key] || f.defaultValue}
                                          alt={f.label}
                                          className="w-full h-full object-cover"
                                      />
                                  ) : (
                                      <ImageIcon size={18} className="text-muted" />
                                  )}
                                </div>
                                <button
                                    onClick={() => {
                                      pendingUpload.current = { key: f.key, mode: "image" };
                                      fileInputRef.current?.click();
                                    }}
                                    disabled={uploadingKey === f.key}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-muted/30 disabled:opacity-60"
                                >
                                  {uploadingKey === f.key ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                  {uploadingKey === f.key ? "Envoi…" : "Changer la photo"}
                                </button>
                              </div>
                          ) : f.type === "gallery" ? (
                              <div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                                  {getGalleryList(f).map((url, i) => (
                                      <div key={`${f.key}-${i}`} className="relative group aspect-video rounded-xl overflow-hidden border border-border bg-muted/30">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`${f.label} ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeGalleryImage(f, i)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                            aria-label="Supprimer cette photo"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                  ))}
                                </div>
                                <button
                                    onClick={() => {
                                      pendingUpload.current = { key: f.key, mode: "gallery-add" };
                                      fileInputRef.current?.click();
                                    }}
                                    disabled={uploadingKey === f.key}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-muted/30 disabled:opacity-60"
                                >
                                  {uploadingKey === f.key ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                  {uploadingKey === f.key ? "Envoi…" : "Ajouter une photo"}
                                </button>
                                <p className="text-[11px] text-muted mt-1.5">{getGalleryList(f).length} photo(s) — survolez une photo pour la supprimer.</p>
                              </div>
                          ) : f.type === "textarea" ? (
                              <textarea
                                  value={active.content[f.key] ?? ""}
                                  onChange={(e) => setField(f.key, e.target.value)}
                                  placeholder={f.defaultValue}
                                  rows={3}
                                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
                              />
                          ) : (
                              <input
                                  type="text"
                                  value={active.content[f.key] ?? ""}
                                  onChange={(e) => setField(f.key, e.target.value)}
                                  placeholder={f.defaultValue}
                                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                              />
                          )}
                        </div>
                    ))}
                  </div>
              )}

              {/* Live preview */}
              {active && showPreview && (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wide">Aperçu — {active.previewPath}</span>
                      <button
                          onClick={() => setPreviewNonce((n) => n + 1)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-muted/30 transition-colors"
                          aria-label="Actualiser l'aperçu"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                    <div className="relative flex-1 min-h-[520px] bg-muted/10">
                      <iframe
                          key={`${active.pageKey}-${previewNonce}`}
                          src={active.previewPath}
                          className="w-full h-full min-h-[520px] border-0"
                          title={`Aperçu — ${active.label}`}
                      />
                    </div>
                    <p className="text-xs text-muted px-4 py-2 border-t border-border">
                      Enregistrez vos modifications puis actualisez pour les voir ici.
                    </p>
                  </div>
              )}
            </div>
        )}

        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleImageSelect(e.target.files?.[0]);
              e.target.value = "";
            }}
        />

        {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
        )}

        {!loading && pages.length > 0 && (
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
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Enregistrer les modifications
              </button>
            </div>
        )}
      </div>
  );
}
