"use client";

import Image from "next/image";
import { useEditableContent } from "@/hooks/useEditableContent";

const relax = [
  {
    title: "Restaurant",
    imageKey: "relax1Image",
    defaultImage: "/images/relax/restaurant.jpg",
    description:
      "Premium lounge restaurant with terrace and pool view.",
  },
  {
    title: "Pool & Terraces",
    imageKey: "relax2Image",
    defaultImage: "/images/relax/terrasses.jpg",
    description:
      "Elegant outdoor areas for relaxation and social activities.",
  },
  {
    title: "Beach Access",
    imageKey: "relax3Image",
    defaultImage: "/images/relax/plage.jpg",
    description:
      "Direct access to one of Gammarth's most beautiful beaches.",
  },
];

export default function RelaxSection() {
  const { img } = useEditableContent("home");

  return (
    /* 1. Remplacement de bg-slate-50 par bg-slate-50 dark:bg-neutral-900 
      2. Ajout de text-gray-900 dark:text-white pour s'assurer que le titre s'adapte 
    */
    <section className="bg-slate-50 dark:bg-neutral-950 py-24 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            Relaxation Areas
          </h2>
        </div>

        <div className="mt-16 space-y-8">
          {relax.map((item) => (
            /* Changement de la carte blanche : 
              - bg-white devient bg-white dark:bg-neutral-900
              - shadow-sm devient dark:shadow-none ou dark:border dark:border-neutral-800 pour rester élégant
            */
            <div
              key={item.title}
              className="
                grid
                gap-6
                md:grid-cols-[320px_1fr]
                rounded-3xl
                bg-white
                dark:bg-neutral-900
                p-6
                shadow-sm
                dark:shadow-none
                dark:border
                dark:border-neutral-800/50
                transition-all
                duration-300
              "
            >
              <div className="relative h-[220px] overflow-hidden rounded-2xl">
                <Image
                  src={img(item.imageKey, item.defaultImage)}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                {/* Titre de la carte s'adapte en blanc */}
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {item.title}
                </h3>

                {/* Le paragraphe passe d'un gris foncé à un gris clair lisible sur fond noir */}
                <p className="mt-4 text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}