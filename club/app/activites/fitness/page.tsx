"use client";

import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, Dumbbell, Heart, Star, CheckCircle, Award, Users, Music, Sparkles } from "lucide-react";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useAuth } from "@/context/AuthContext";

export default function FitnessPage() {
  const router = useRouter();
  const { isDark: isDarkMode } = useTheme();
  const { t, img } = useEditableContent("activite-fitness");
  const { isLoggedIn } = useAuth();

  const handleReserve = () => {
    if (!isLoggedIn) router.push("/login");
    else router.push("/dashboard/calendar");
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? "bg-neutral-950" : "bg-gradient-to-b from-gray-50 to-white"}`}>
      <div className="container mx-auto px-4 py-6">
        <Link href="/activites" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isDarkMode ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <ArrowLeft className="h-4 w-4" /> Retour aux activités
        </Link>
      </div>

      <section className="relative h-[50vh] overflow-hidden">
        <img src={img("heroImage", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop")} alt="Fitness" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? "from-neutral-950" : "from-white"} via-transparent`}></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-lg mx-auto mb-4">
            <Dumbbell className="h-12 w-12 text-white" />
          </div>
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{t("heroTitle", "Fitness")}</h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("heroSubtitle", "Améliorez votre condition physique avec nos programmes variés")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>À propos du Fitness</h2>
                <p className={`mb-4 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about1", "Nos cours de fitness sont conçus pour tous les niveaux, des débutants aux sportifs confirmés. Que vous cherchiez à perdre du poids, vous tonifier ou simplement rester en forme, nos coachs vous accompagnent dans votre progression.")}</p>
                <p className={`leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about2", "Avec plus de 15 cours par semaine, vous trouverez forcément un créneau qui correspond à votre emploi du temps.")}</p>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Les bienfaits</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {["Amélioration de l'endurance", "Renforcement musculaire", "Perte de poids", "Réduction du stress", "Meilleure posture", "Énergie au quotidien"].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{benefit}</span></div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Horaires des cours</h2>
                <div className="space-y-3">
                  {[{ day: "Lundi", time: "09:00 - 10:00", coach: "Sarah" }, { day: "Lundi", time: "18:00 - 19:00", coach: "Karim" }, { day: "Mercredi", time: "10:00 - 11:00", coach: "Leila" }, { day: "Mercredi", time: "19:00 - 20:00", coach: "Ahmed" }, { day: "Vendredi", time: "09:00 - 10:00", coach: "Sarah" }, { day: "Samedi", time: "11:00 - 12:00", coach: "Karim" }].map((schedule, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 border-b ${isDarkMode ? "border-neutral-800" : "border-gray-100"}`}>
                      <div className="flex items-center gap-4"><Calendar className="h-5 w-5 text-green-500" /><div><p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{schedule.day}</p><p className={`text-sm ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}>Coach: {schedule.coach}</p></div></div>
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
                  {[{ icon: Clock, label: "Durée", value: "45-60 min" }, { icon: User, label: "Niveau", value: "Débutant à Avancé" }, { icon: Heart, label: "Intensité", value: "Modérée à Élevée" }, { icon: Users, label: "Places max", value: "20 personnes" }].map((info, i) => (
                    <div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><info.icon className="h-4 w-4 text-green-500" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{info.label}</span></div><span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{info.value}</span></div>
                  ))}
                </div>
                <button onClick={handleReserve} className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200">Réserver un cours</button>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Nos Coachs</h3>
                {[{ name: "Sarah Ben Ali", specialty: "Coach Fitness & Cardio", icon: "S", color: "from-pink-500 to-rose-500" }, { name: "Karim Mansouri", specialty: "Coach Musculation", icon: "K", color: "from-blue-500 to-cyan-500" }, { name: "Leila Trabelsi", specialty: "Coach Zumba", icon: "L", color: "from-orange-500 to-yellow-500" }].map((coach, i) => (
                  <div key={i} className="flex items-center gap-3 mt-3"><div className={`w-10 h-10 rounded-full bg-gradient-to-r ${coach.color} flex items-center justify-center text-white font-bold`}>{coach.icon}</div><div><p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{coach.name}</p><p className={`text-sm ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}>{coach.specialty}</p></div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}