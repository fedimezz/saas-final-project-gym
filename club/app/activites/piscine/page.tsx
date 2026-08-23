"use client";

import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, Droplets, Heart, CheckCircle, Users, Thermometer, Shield, Award } from "lucide-react";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useAuth } from "@/context/AuthContext";

export default function PiscinePage() {
  const router = useRouter();
  const { isDark: isDarkMode } = useTheme();
  const { t, img } = useEditableContent("activite-piscine");
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
        <img src={img("heroImage", "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&h=600&fit=crop")} alt="Piscine" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? "from-neutral-950" : "from-white"} via-transparent`}></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg mx-auto mb-4"><Droplets className="h-12 w-12 text-white" /></div>
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{t("heroTitle", "Piscine")}</h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("heroSubtitle", "Natation, aquagym et aquabike pour tous les niveaux")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>À propos de la Piscine</h2>
                <p className={`mb-4 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about1", "Notre piscine semi-olympique de 25m est chauffée toute l'année. Idéale pour la natation loisir, l'aquagym ou l'entraînement intensif.")}</p>
                <p className={`leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about2", "Des cours collectifs et particuliers sont dispensés par des maîtres-nageurs diplômés.")}</p>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Les bienfaits</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {["Sport sans impact", "Travail complet du corps", "Amélioration cardio", "Renforcement musculaire", "Souplesse articulaire", "Relaxation"].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{benefit}</span></div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Horaires des cours</h2>
                <div className="space-y-3">
                  {[{ day: "Mardi", time: "14:00 - 15:00", coach: "Amel", type: "Aquagym" }, { day: "Jeudi", time: "16:00 - 17:00", coach: "Nabil", type: "Natation" }, { day: "Samedi", time: "10:00 - 11:00", coach: "Amel", type: "Aquabike" }, { day: "Dimanche", time: "09:00 - 10:00", coach: "Nabil", type: "Cours enfants" }].map((schedule, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 border-b ${isDarkMode ? "border-neutral-800" : "border-gray-100"}`}>
                      <div className="flex items-center gap-4"><Calendar className="h-5 w-5 text-green-500" /><div><p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{schedule.day} - {schedule.type}</p><p className={`text-sm ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}>Coach: {schedule.coach}</p></div></div>
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
                  {[{ icon: Clock, label: "Durée", value: "45-60 min" }, { icon: Thermometer, label: "Température", value: "28°C" }, { icon: User, label: "Niveau", value: "Débutant à Avancé" }, { icon: Heart, label: "Intensité", value: "Faible à Modérée" }, { icon: Users, label: "Places max", value: "15 personnes" }].map((info, i) => (
                    <div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><info.icon className="h-4 w-4 text-green-500" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{info.label}</span></div><span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{info.value}</span></div>
                  ))}
                </div>
                <button onClick={handleReserve} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition">Réserver un cours</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}