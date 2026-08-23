"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function RegisterPage() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions générales");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur d'inscription");
        setLoading(false);
        return;
      }

      // No session cookie is issued at registration anymore — the account
      // isn't authenticated until the emailed code is confirmed. Send the
      // new user straight to the verify page.
      window.location.href = `/user/verify?email=${encodeURIComponent(data.user.email)}`;
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


      <div className={`max-w-md w-full space-y-8 p-8 rounded-2xl shadow-2xl transition-all duration-500 ${
        isDark 
          ? "bg-neutral-900/90 backdrop-blur-sm border border-neutral-800" 
          : "bg-white/90 backdrop-blur-sm shadow-2xl"
      }`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl">💪</span>
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Le Club de Gammarth
          </h2>
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
            Créez votre compte
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-red-500 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Nom complet
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="exemple@leclub.com"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Téléphone
            </label>
            <div className="relative">
              <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="+216 XX XXX XXX"
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
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`w-full pl-10 pr-10 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Confirmer mot de passe
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label className={`ml-2 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              J&apos;accepte les{" "}
              <Link href="/terms" className="text-green-600 hover:text-green-700 font-medium">
                conditions générales
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              "Créer mon compte"
            )}
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
            Déjà un compte?{" "}
            <Link href="/user/login" className="text-green-600 hover:text-green-700 font-semibold">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
