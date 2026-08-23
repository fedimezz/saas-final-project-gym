"use client";

import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, Baby, Heart, CheckCircle, Users, Smile, Gift, Sparkles } from "lucide-react";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useAuth } from "@/context/AuthContext";

export default function KidsPage() {
  const router = useRouter();
  const { isDark: isDarkMode } = useTheme();
  const { t, img } = useEditableContent("activite-kids");
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
        <img src={img("heroImage", "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&h=600&fit=crop")} alt="Kids" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? "from-neutral-950" : "from-white"} via-transparent`}></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg mx-auto mb-4"><Baby className="h-12 w-12 text-white" /></div>
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{t("heroTitle", "Kids")}</h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("heroSubtitle", "Activités ludiques et sportives pour les 4-12 ans")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>À propos des Kids</h2>
                <p className={`mb-4 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about1", "Des cours spécialement conçus pour les enfants dans une ambiance ludique et sécurisée. Initiation au sport et développement des capacités motrices.")}</p>
                <p className={`leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>{t("about2", "Parce que le sport n'a pas d'âge, vos enfants s'amuseront tout en apprenant les bases de plusieurs disciplines.")}</p>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Les activités</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {["Éveil sportif", "Gymnastique", "Baby Gym", "Multi-sports", "Coordination", "Jeux collectifs"].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{activity}</span></div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Horaires des cours</h2>
                <div className="space-y-3">
                  {[{ day: "Mardi", time: "16:00 - 17:00", age: "4-6 ans" }, { day: "Mercredi", time: "14:00 - 15:00", age: "7-9 ans" }, { day: "Jeudi", time: "16:30 - 17:30", age: "10-12 ans" }, { day: "Samedi", time: "09:00 - 10:00", age: "4-6 ans" }, { day: "Samedi", time: "10:30 - 11:30", age: "7-9 ans" }].map((schedule, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 border-b ${isDarkMode ? "border-neutral-800" : "border-gray-100"}`}>
                      <div className="flex items-center gap-4"><Calendar className="h-5 w-5 text-green-500" /><div><p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{schedule.day} - {schedule.age} ans</p></div></div>
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
                  {[{ icon: Clock, label: "Durée", value: "45-60 min" }, { icon: Smile, label: "Âges", value: "4-12 ans" }, { icon: Users, label: "Places max", value: "12 enfants" }, { icon: Gift, label: "Goûter", value: "Inclus" }, { icon: Sparkles, label: "Encadrement", value: "Diplômés" }].map((info, i) => (
                    <div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><info.icon className="h-4 w-4 text-green-500" /><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>{info.label}</span></div><span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{info.value}</span></div>
                  ))}
                </div>
                <button onClick={handleReserve} className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-amber-600 transition">Inscrire mon enfant</button>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-lg"}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Tarifs Kids</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>Cours à l&apos;unité</span><span className={`font-bold text-green-600`}>25 DT</span></div>
                  <div className="flex items-center justify-between"><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>Carnet 10 cours</span><span className={`font-bold text-green-600`}>200 DT</span></div>
                  <div className="flex items-center justify-between"><span className={isDarkMode ? "text-neutral-400" : "text-gray-600"}>Abonnement mensuel</span><span className={`font-bold text-green-600`}>80 DT/mois</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}