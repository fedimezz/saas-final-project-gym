"use client";

import { useState, useEffect, useCallback } from "react";

// Use in any public page: const { t, img } = useEditableContent("activites");
// Then replace hardcoded copy with t("heroTitle", "the current hardcoded text")
// and hardcoded image src with img("heroImage", "/the/current/path.jpg").
// Falls back to the given default until the Owner sets a value in
// /admin/content, and again if fetching fails — never blocks rendering.
export function useEditableContent(pageKey: string) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/content/public/${pageKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.content) setContent(json.content);
      })
      .catch(() => {
        // Keep defaults on failure.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pageKey]);

  const t = useCallback(
    (key: string, fallback: string) => {
      const v = content[key];
      return v && v.trim() ? v : fallback;
    },
    [content]
  );

  // For "gallery"-type fields: the Owner's saved value is a JSON array of
  // photo URLs. Falls back to the given default list until set, and again
  // if the stored value is missing/corrupt — never throws.
  const list = useCallback(
    (key: string, fallback: string[]): string[] => {
      const v = content[key];
      if (!v) return fallback;
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
      } catch {
        return fallback;
      }
    },
    [content]
  );

  return { t, img: t, list, content, loading };
}
