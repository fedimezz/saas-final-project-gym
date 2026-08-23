"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  isLoggedIn: boolean;
  userRole: string | null;
  user: StoredUser | null;
  isLoading: boolean;
  login: (role: string, user?: StoredUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Custom event name used to notify other components in the SAME tab that
// auth state changed. The native "storage" event only fires in OTHER tabs,
// so without this, the Navbar wouldn't update instantly after login/logout
// in the tab where the action happened.
const AUTH_CHANGE_EVENT = "auth-change";

function readAuthFromStorage(): { role: string | null; user: StoredUser | null } {
  if (typeof window === "undefined") {
    return { role: null, user: null };
  }
  const role = localStorage.getItem("role");
  const rawUser = localStorage.getItem("user");
  let user: StoredUser | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as StoredUser;
    } catch {
      // Corrupted value — clear it rather than crash on every render.
      localStorage.removeItem("user");
      user = null;
    }
  }
  return { role, user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { role, user: storedUser } = readAuthFromStorage();
    setUserRole(role);
    setUser(storedUser);
    setIsLoading(false);

    const syncFromStorage = () => {
      const { role: r, user: u } = readAuthFromStorage();
      setUserRole(r);
      setUser(u);
    };

    // Cross-tab sync.
    window.addEventListener("storage", syncFromStorage);
    // Same-tab sync (fired by login()/logout() below).
    window.addEventListener(AUTH_CHANGE_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncFromStorage);
    };
  }, []);

  const login = useCallback((role: string, userData?: StoredUser) => {
    // Note: the httpOnly auth cookie is set by the server response itself
    // (Set-Cookie header from /api/auth/login or /api/auth/register).
    // localStorage here is only a convenience mirror for instant client UI
    // (Navbar, Sidebar) — it is never used for actual route protection, and
    // deliberately never stores the JWT itself (that lived here before —
    // it's what let any XSS anywhere in the app steal the token and
    // authenticate as the user via the Authorization header fallback).
    localStorage.setItem("role", role);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    setUserRole(role);
    setUser(userData ?? null);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    setUserRole(null);
    setUser(null);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));

    // Clear the httpOnly cookie server-side. Fire-and-forget: even if this
    // request fails, the local UI state is already cleared, and the cookie
    // will simply expire naturally per AUTH_COOKIE_OPTIONS maxAge.
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {
      /* network error during logout is non-fatal for the UI */
    });
  }, []);

  const value: AuthContextValue = {
    isLoggedIn: Boolean(userRole),
    userRole,
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
