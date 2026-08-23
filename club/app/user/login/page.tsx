// src/app/login/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Connexion Google annulée.",
  google_not_configured: "La connexion Google n'est pas disponible pour le moment.",
  google_state_mismatch: "La session a expiré, veuillez réessayer.",
  google_token_failed: "Erreur lors de la connexion avec Google.",
  google_userinfo_failed: "Erreur lors de la connexion avec Google.",
  google_email_unverified: "Votre email Google n'est pas vérifié.",
  google_error: "Une erreur est survenue avec la connexion Google.",
  account_disabled: "Votre compte a été désactivé. Contactez l'administrateur.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn, userRole, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Surface any error Google's callback redirected back with.
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(GOOGLE_ERROR_MESSAGES[oauthError] || "Une erreur est survenue.");
    }
  }, [searchParams]);

  // If already logged in, redirect based on role.
  useEffect(() => {
    if (isLoading) return;
    if (isLoggedIn && userRole) {
      const role = userRole.toUpperCase();
      if (role === "ADMIN" || role === "OWNER") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, isLoggedIn, userRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          window.location.href = `/user/verify?email=${encodeURIComponent(data.email || email)}`;
          return;
        }
        setError(data.error || "Erreur de connexion");
        setLoading(false);
        return;
      }

      // The httpOnly auth cookie is already set by the server response
      // (Set-Cookie header). login() mirrors role/user into localStorage
      // for instant UI sync and notifies the rest of the app via context.
      login(data.user.role, data.user);

      const role = String(data.user.role).toUpperCase();
      const destination = role === "ADMIN" || role === "OWNER" ? "/admin" : "/dashboard";

      // Use a full navigation (not router.push) immediately after login.
      // router.push is a soft, client-side navigation — Next.js can serve
      // it from an existing prefetch/router cache entry for that route,
      // which may have been populated BEFORE the auth cookie existed.
      // proxy.ts then sees no cookie on that cached entry and bounces
      // back to /login, which is exactly the "login succeeds but redirects
      // back to login" symptom. A hard navigation forces a brand-new
      // request that the browser attaches the fresh cookie to, and that
      // proxy.ts verifies for real.
      window.location.href = destination;
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isDark 
        ? "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" 
        : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
    }`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${
          isDark ? "bg-green-900/20" : "bg-green-200/30"
        } animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${
          isDark ? "bg-blue-900/20" : "bg-blue-200/30"
        } animate-pulse delay-1000`}></div>
      </div>

      <div className={`max-w-md w-full space-y-8 p-8 rounded-2xl shadow-2xl ${
        isDark ? "bg-neutral-900/90 backdrop-blur-sm border border-neutral-800" : "bg-white/90 backdrop-blur-sm shadow-2xl"
      }`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl">💪</span>
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Le Club de Gammarth</h2>
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>Connectez-vous à votre compte</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-red-500 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} 
                placeholder="exemple@leclub.com" 
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Mot de passe
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={`w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"}`} 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? 
                  <EyeOff className="h-5 w-5 text-gray-400" /> : 
                  <Eye className="h-5 w-5 text-gray-400" />
                }
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" 
              />
              <span className={`ml-2 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                Se souvenir de moi
              </span>
            </label>
            <Link href="/user/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium">
              Mot de passe oublié?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 
              "Se connecter"
            }
          </button>
        </form>

        <div className="flex items-center gap-3 my-2">
          <div className={`h-px flex-1 ${isDark ? "bg-neutral-700" : "bg-gray-200"}`} />
          <span className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-400"}`}>ou</span>
          <div className={`h-px flex-1 ${isDark ? "bg-neutral-700" : "bg-gray-200"}`} />
        </div>

        <a
          href="/api/auth/google"
          className={`w-full flex items-center justify-center gap-3 py-2 rounded-lg border font-medium transition-all duration-200 ${
            isDark
              ? "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24Z" />
            <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.75l4.01-3.11Z" />
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.63l4.01 3.11C6.22 6.88 8.87 4.75 12 4.75Z" />
          </svg>
          Continuer avec Google
        </a>

        <div className="text-center">
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
            Pas encore de compte? 
            <Link href="/user/register" className="text-green-600 hover:text-green-700 font-semibold ml-1">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
