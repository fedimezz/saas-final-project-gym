"use client";

import { useEditableContent } from "@/hooks/useEditableContent";

export default function ClubIntro() {
  const { t } = useEditableContent("home");
  const stats = [
    {
      value: "1500+",
      label: "m² Sports Area",
    },
    {
      value: "50+",
      label: "Weekly Classes",
    },
    {
      value: "10+",
      label: "Professional Coaches",
    },
    {
      value: "1000+",
      label: "Members",
    },
  ];

  return (
    <section className="bg-[#0E4B73] py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t("introTitle", "A Unique Sports Experience")}
          </h2>

          <p className="mt-6 text-lg text-white/80 max-w-3xl mx-auto">
            {t(
              "introText",
              "Le Club Gammarth offers a premium sports experience combining fitness, wellness, swimming pools, padel courts, restaurant, beach access and professional coaching."
            )}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="
                rounded-3xl
                bg-white/10
                p-8
                text-center
                backdrop-blur
              "
            >
              <h3 className="text-4xl font-bold text-[#D8E219]">
                {stat.value}
              </h3>

              <p className="mt-2 text-white/90">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}