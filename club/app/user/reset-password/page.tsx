"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();

  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const linkInvalid = !email || !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Lien invalide ou expiré");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/user/login"), 2000);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}
    >
      <div
        className={`max-w-md w-full space-y-8 p-8 rounded-2xl shadow-2xl ${
          isDark
            ? "bg-neutral-900/90 backdrop-blur-sm border border-neutral-800"
            : "bg-white/90 backdrop-blur-sm shadow-2xl"
        }`}
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🔒</span>
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Nouveau mot de passe
          </h2>
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
            Choisissez un nouveau mot de passe pour votre compte
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-red-500 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {linkInvalid ? (
          <div className="text-center space-y-4">
            <p className={`${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Ce lien de réinitialisation est invalide. Demandez-en un nouveau.
            </p>
            <Link
              href="/user/forgot-password"
              className="inline-block w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : success ? (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <p className={`${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Mot de passe réinitialisé. Redirection vers la connexion…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
