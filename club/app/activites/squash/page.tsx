"use client";

import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, Gamepad2, Heart, CheckCircle, Users, Trophy, Target, Award } from "lucide-react";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useAuth } from "@/context/AuthContext";

export default function SquashPage() {
  const router = useRouter();
  const { isDark: isDarkMode } = useTheme();
  const { t, img } = useEditableContent("activite-squash");
  const { isLoggedIn } = useAuth();

  const handleReserve = () => {
    if (!isLoggedIn) router.push("/login");
    else router.push("/dashboard/calendar");
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? "bg-neutral-950" : "bg-gradient-to-b from-gray-50 to-white"}`}>
      <div className="container mx-auto px-4 py-6">
        <Link href="/activites" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <ArrowLeft className="h-4 w-4" /> Retour aux activités
        </Link>
      </div>

      <section className="relative h-[50vh] overflow-hidden">
        <img src={img("heroImage", "https://images.unsplash.com/photo-1509475826633-fed577a2c71b?w=1200&h=600&fit=crop")} alt="Squash" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? "from-neutral-950" : "from-white"} via-transparent`}></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg mx-auto mb-4"><Gamepad2 className="h-12 w-12 text-white" /></div>
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{t("heroTitle", "Squash")}</h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("heroSubtitle", "Terrain professionnel pour joueurs de tous niveaux")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>À propos du Squash</h2>
                <p className={`mb-4 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about1", "Notre terrain de squash est certifié pour la compétition. Mur en verre, parquet et éclairage professionnel.")}</p>
                <p className={`leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about2", "Cours particuliers et tournois organisés régulièrement.")}</p>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Les avantages</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {["Terrain pro", "Cours particuliers", "Tournois mensuels", "Location raquettes", "Prêt de balles", "Climatisation"].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{benefit}</span></div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Horaires</h2>
                <div className="space-y-3">
                  {[{ day: "Lundi", time: "12:00 - 20:00", type: "Accès libre" }, { day: "Mercredi", time: "14:00 - 16:00", type: "Cours débutants" }, { day: "Vendredi", time: "18:00 - 20:00", type: "Tournoi" }, { day: "Samedi", time: "09:00 - 12:00", type: "Cours enfants" }].map((schedule, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 border-b ${isDarkMode ? "border-neutral-800" : "border-gray-100"}`}>
                      <div className="flex items-center gap-4"><Calendar className="h-5 w-5 text-green-500" /><div><p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{schedule.day} - {schedule.type}</p></div></div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-green-500" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{schedule.time}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`p-6 rounded-2xl sticky top-24 ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Informations</h3>
                <div className="space-y-4">
                  {[{ icon: Clock, label: "Durée", value: "45 min" }, { icon: Award, label: "Certification", value: "Internationale" }, { icon: User, label: "Joueurs", value: "2-4 pers" }, { icon: Target, label: "Location", value: "Raquettes dispo" }, { icon: Trophy, label: "Tournois", value: "Mensuels" }].map((info, i) => (
                    <div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><info.icon className="h-4 w-4 text-green-500" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{info.label}</span></div><span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{info.value}</span></div>
                  ))}
                </div>
                <button onClick={handleReserve} className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition">Réserver un terrain</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}