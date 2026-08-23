"use client";

import Image from "next/image";
import { useEditableContent } from "@/hooks/useEditableContent";

const sports = [
  {
    title: "Cardio & Musculation",
    imageKey: "sport1Image",
    defaultImage: "/images/sports/musculation.jpg",
    description:
      "State-of-the-art Technogym equipment and spacious training zones.",
  },
  {
    title: "Fitness Studio",
    imageKey: "sport2Image",
    defaultImage: "/images/sports/fitness.jpg",
    description:
      "Dynamic group classes led by certified coaches.",
  },
  {
    title: "Football Club",
    imageKey: "sport3Image",
    defaultImage: "/images/sports/football.jpg",
    description:
      "Professional football pitch designed for training and competitive matches.",
  },
  {
    title: "Swimming Pool",
    imageKey: "sport4Image",
    defaultImage: "/images/sports/pool.jpg",
    description:
      "Aquatic fitness and relaxation in a luxurious setting.",
  },
];

export default function SportsSection() {
  const { img } = useEditableContent("home");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-5xl font-bold">
            Sports Areas
          </h2>

          <p className="mt-4 text-gray-500">
            Discover our premium facilities.
          </p>
        </div>

        <div className="mt-16 space-y-12">
          {sports.map((sport, index) => (
            <div
              key={sport.title}
              className={`
                grid
                gap-10
                items-center
                md:grid-cols-2
                ${
                  index % 2 === 1
                    ? "md:[&>*:first-child]:order-2"
                    : ""
                }
              `}
            >
              <div className="relative h-[350px] overflow-hidden rounded-3xl">
                <Image
                  src={img(sport.imageKey, sport.defaultImage)}
                  alt={sport.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h3 className="text-3xl font-bold">
                  {sport.title}
                </h3>

                <p className="mt-4 text-lg text-gray-600">
                  {sport.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
