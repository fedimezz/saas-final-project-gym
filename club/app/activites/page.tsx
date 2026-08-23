"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dumbbell, Droplets, Swords, Footprints, Gamepad2, Baby } from "lucide-react";
import PagePublishGate from "@/components/layout/PagePublishGate";
import { useEditableContent } from "@/hooks/useEditableContent";

const activities = [
  {
    name: "Fitness",
    icon: Dumbbell,
    href: "/activites/fitness",
    color: "from-pink-500 to-rose-500",
    bgImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    description: "Cardio, musculation, cours collectifs"
  },
  {
    name: "Piscine",
    icon: Droplets,
    href: "/activites/piscine",
    color: "from-blue-500 to-cyan-500",
    bgImage: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&h=400&fit=crop",
    description: "Natation, aquagym, aquabike"
  },
  {
    name: "Fight Club",
    icon: Swords,
    href: "/activites/fight-club",
    color: "from-red-600 to-orange-600",
    bgImage: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=400&fit=crop",
    description: "Boxe, MMA, self-défense"
  },
  {
    name: "Foot à 5",
    icon: Footprints,
    href: "/activites/foot-a-5",
    color: "from-green-500 to-emerald-500",
    bgImage: "https://images.unsplash.com/photo-1575361204800-a2ed9e25f5ef?w=600&h=400&fit=crop",
    description: "Tournois, entraînements"
  },
  {
    name: "Squash",
    icon: Gamepad2,
    href: "/activites/squash",
    color: "from-purple-500 to-indigo-500",
    bgImage: "https://images.unsplash.com/photo-1509475826633-fed577a2c71b?w=600&h=400&fit=crop",
    description: "Terrain professionnel"
  },
  {
    name: "Kids",
    icon: Baby,
    href: "/activites/kids",
    color: "from-yellow-500 to-amber-500",
    bgImage: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&h=400&fit=crop",
    description: "Activités pour enfants 4-12 ans"
  }
];

export default function ActivitiesPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { t, img } = useEditableContent("activites");
  const heroImage = img("heroImage", "");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDarkMode(savedTheme === "dark");
    
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <PagePublishGate pageKey="activites">
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? "bg-neutral-950" : "bg-gradient-to-b from-gray-50 to-white"}`}>
      <section className={`relative py-16 text-center ${heroImage ? "overflow-hidden" : ""}`}>
        {heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${heroImage ? "text-white" : isDarkMode ? "text-white" : "text-gray-900"}`}>
              <span className={heroImage ? "text-green-400" : "text-green-600"}>{t("heroTitle", "Une trentaine d'activités différentes !")}</span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-6 max-w-3xl mx-auto leading-relaxed ${heroImage ? "text-white/90" : isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>
              {t(
                "heroSubtitle",
                "Que vous cherchiez à vous sculpter, vous dessiner, vous tonifier ou encore simplement vous amuser et vous défouler, une grande diversité de disciplines s'offrent à vous..."
              )}
            </p>
            
            <p className={`text-lg italic ${heroImage ? "text-white/70" : isDarkMode ? "text-neutral-500" : "text-gray-500"}`}>
              &quot;{t("heroQuote", "Parce que le sport n'a pas d'âge, sont également mis à votre disposition des cours pour enfants.")}&quot;
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity, index) => (
              <Link href={activity.href} key={activity.name}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                >
                  <div className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl ${isDarkMode ? "bg-neutral-900" : "bg-white"}`}>
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={activity.bgImage}
                        alt={activity.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? "from-neutral-900 via-transparent" : "from-black/60 via-transparent"}`}></div>
                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${activity.color} flex items-center justify-center`}>
                          <activity.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">{activity.name}</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className={`text-sm mb-3 ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}>
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                          En savoir plus
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
    </PagePublishGate>
  );
}