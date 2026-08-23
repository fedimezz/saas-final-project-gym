"use client";

import Link from "next/link";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const plans = [
  {
    name: "Basic",
    price: "99 DT",
    period: "/mois",
    description: "Accès essentiel aux installations et équipements de base.",
    features: [
      "Accès libre à la salle de musculation",
      "Casier individuel sécurisé",
      "Planning hebdomadaire personnalisé",
      "Accès aux vestiaires premium",
    ],
    popular: false,
    icon: Zap,
  },
  {
    name: "Premium",
    price: "149 DT",
    period: "/mois",
    description: "Formule complète incluant cours collectifs et accès Padel.",
    features: [
      "Accès 7j/7 salle & cardio",
      "Réservation terrains de Padel",
      "Cours collectifs illimités",
      "Planning interactif via l'application",
      "1 séance bilan offert avec un coach",
    ],
    popular: true,
    icon: Sparkles,
  },
  {
    name: "VIP Elite",
    price: "249 DT",
    period: "/mois",
    description: "L'expérience ultime avec suivi privé et services exclusifs.",
    features: [
      "Accès illimité à toutes les infrastructures",
      "Terrains de Padel & Squash réservables",
      "Coaching privé dédié (2h/mois)",
      "Accès Espace Wellness & Sauna",
      "Support conciergerie VIP dédié",
    ],
    popular: false,
    icon: Crown,
  },
];

export default function PricingSection() {
  const { isLoggedIn } = useAuth();

  return (
    <section className="relative py-28 transition-colors duration-500 overflow-hidden bg-primary">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tarifs & Offres Exclusives</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Choisissez la formule d&apos;exception
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium">
            Des offres adaptées à chaque ambition avec accès numérique instantané.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`
                  relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1
                  ${
                    plan.popular
                      ? "bg-slate-900 text-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-[1.03]"
                      : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl backdrop-blur-md"
                  }
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 fill-slate-950" />
                    <span>Offre La Plus Prisée</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${plan.popular ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-500/10 text-emerald-500"}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${plan.popular ? "text-emerald-400" : "text-slate-500"}`}>
                      {plan.name}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black tracking-tight">
                    {plan.name}
                  </h3>
                  <p className={`text-xs mt-2 font-medium leading-relaxed ${plan.popular ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className={`text-xs font-semibold ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>{plan.period}</span>
                  </div>

                  <div className="my-8 border-t border-slate-200/20 dark:border-slate-800" />

                  <ul className="space-y-3.5 text-xs font-medium">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${plan.popular ? "bg-emerald-400 text-slate-950" : "bg-emerald-500/20 text-emerald-400"}`}>
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className={plan.popular ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={isLoggedIn ? "/dashboard/membership" : "/user/register"}
                  className={`
                    mt-10 w-full rounded-2xl py-3.5 font-extrabold text-xs tracking-wider uppercase transition duration-300 text-center block shadow-lg active:scale-95
                    ${
                      plan.popular
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30"
                        : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700/50"
                    }
                  `}
                >
                  {isLoggedIn ? "Voir mon abonnement" : "Sélectionner cette formule"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}