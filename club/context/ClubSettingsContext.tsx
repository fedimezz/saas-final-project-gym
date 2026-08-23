"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

export type PageKey = "activites" | "coaching" | "offres" | "actualites" | "gallery";

type EnabledPages = Record<PageKey, boolean>;

interface ClubSettings {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  backgroundColor: string;
  backgroundColorDark: string;
  enabledPages: EnabledPages;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
}

interface ClubSettingsContextType extends ClubSettings {
  loading: boolean;
  refresh: () => void;
  isPageEnabled: (key: PageKey) => boolean;
}

const DEFAULT_ENABLED_PAGES: EnabledPages = {
  activites: true,
  coaching: true,
  offres: true,
  actualites: true,
  gallery: true,
};

const DEFAULTS: ClubSettings = {
  name: "Le Club de Gammarth",
  logoUrl: null,
  primaryColor: "#10b981",
  backgroundColor: "#ffffff",
  backgroundColorDark: "#090d16",
  enabledPages: DEFAULT_ENABLED_PAGES,
  heroTitle: null,
  heroSubtitle: null,
  heroImageUrl: null,
};

const ClubSettingsContext = createContext<ClubSettingsContextType>({
  ...DEFAULTS,
  loading: true,
  refresh: () => {},
  isPageEnabled: () => true,
});

function shade(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return hex;
  const num = parseInt(clean, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const mix = (channel: number) =>
    amount >= 0
      ? Math.round(channel + (255 - channel) * amount)
      : Math.round(channel * (1 + amount));
  r = Math.min(255, Math.max(0, mix(r)));
  g = Math.min(255, Math.max(0, mix(g)));
  b = Math.min(255, Math.max(0, mix(b)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function applyBrandColor(hex: string) {
  if (!hex) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", hex, "important");
  root.style.setProperty("--primary-dark", shade(hex, -0.2), "important");
  root.style.setProperty("--primary-light", shade(hex, 0.2), "important");
}

function applyBackgroundColor(hex: string) {
  if (!hex) return;
  document.documentElement.style.setProperty("--bg-primary", hex, "important");
}

function normalizeEnabledPages(raw: unknown): EnabledPages {
  if (!raw || typeof raw !== "object") return DEFAULT_ENABLED_PAGES;
  const src = raw as Partial<Record<PageKey, boolean>>;
  return {
    activites: src.activites !== false,
    coaching: src.coaching !== false,
    offres: src.offres !== false,
    actualites: src.actualites !== false,
    gallery: src.gallery !== false,
  };
}

export function ClubSettingsProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState<ClubSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/public");
      if (res.ok) {
        const json = await res.json();
        const next: ClubSettings = {
          name: json.name || DEFAULTS.name,
          logoUrl: json.logoUrl ?? null,
          primaryColor: json.primaryColor || DEFAULTS.primaryColor,
          backgroundColor: json.backgroundColor || DEFAULTS.backgroundColor,
          backgroundColorDark: json.backgroundColorDark || DEFAULTS.backgroundColorDark,
          enabledPages: normalizeEnabledPages(json.enabledPages),
          heroTitle: json.heroTitle || null,
          heroSubtitle: json.heroSubtitle || null,
          heroImageUrl: json.heroImageUrl || null,
        };
        setSettings(next);
        applyBrandColor(next.primaryColor);
      }
    } catch {
      // Keep defaults on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    applyBackgroundColor(isDark ? settings.backgroundColorDark : settings.backgroundColor);
  }, [isDark, settings.backgroundColor, settings.backgroundColorDark]);

  const isPageEnabled = useCallback(
    (key: PageKey) => settings.enabledPages[key] !== false,
    [settings.enabledPages]
  );

  return (
    <ClubSettingsContext.Provider value={{ ...settings, loading, refresh: fetchSettings, isPageEnabled }}>
      {children}
    </ClubSettingsContext.Provider>
  );
}

export function useClubSettings() {
  return useContext(ClubSettingsContext);
}
