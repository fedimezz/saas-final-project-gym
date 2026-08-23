"use client";

import { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";

interface RealCoach {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  specialties: string[];
  activities: string[];
}

const ACTIVITY_LABELS: Record<string, string> = {
  BODYBUILDING: "Musculation", FITNESS: "Fitness", CARDIO: "Cardio",
  CROSSFIT: "CrossFit", YOGA: "Yoga", PILATES: "Pilates",
  BOXE: "Boxe", MMA: "MMA", AQUAGYM: "Aquagym",
  PADEL: "Padel", ZUMBA: "Zumba", SPINNING: "Spinning",
};

// Was 3 hardcoded fake coaches (name/photo/speciality baked into the
// component). Now pulled from the real Coach model so it always reflects
// who's actually on staff.
export default function CoachesSection() {
  const [coaches, setCoaches] = useState<RealCoach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/coaches/public");
        const data = await res.json();
        if (!cancelled) setCoaches(Array.isArray(data.coaches) ? data.coaches.slice(0, 3) : []);
      } catch {
        // section just won't render below
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // No coaches configured yet, or still loading — don't show an empty/fake section.
  if (loading || coaches.length === 0) return null;

  return (
    <section className="py-24 bg-white dark:bg-neutral-950 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            Nos Coachs
          </h2>

          <p className="mt-4 text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Une équipe expérimentée pour vous accompagner.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="
                overflow-hidden
                rounded-3xl
                bg-white
                dark:bg-neutral-900
                border
                border-transparent
                dark:border-neutral-800/60
                shadow-lg
                dark:shadow-none
                transition-all
                duration-300
                hover:-translate-y-2
              "
            >
              <div className="h-80 bg-gray-200 dark:bg-neutral-800 transition-colors duration-300 flex items-center justify-center">
                {coach.photoUrl ? (
                  <img
                    src={coach.photoUrl}
                    alt={coach.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Dumbbell size={40} className="text-gray-400 dark:text-neutral-700" />
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {coach.name}
                </h3>

                {(coach.specialties.length > 0 || coach.activities.length > 0) && (
                  <p className="mt-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    {coach.specialties.length > 0
                      ? coach.specialties.join(" · ")
                      : coach.activities.map((a) => ACTIVITY_LABELS[a] ?? a).join(" · ")}
                  </p>
                )}

                <a
                  href="/coaching"
                  className="
                    inline-block
                    mt-5
                    rounded-xl
                    bg-[#0E4B73]
                    hover:bg-[#1d5f90]
                    dark:bg-[#1d5f90]
                    dark:hover:bg-[#0E4B73]
                    px-5
                    py-3
                    text-white
                    font-medium
                    transition-colors
                    duration-300
                  "
                >
                  Voir Profil
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
