"use client";

import Image from "next/image";
import GalleryCategory from "@/components/gallery/GalleryCategory";
import PagePublishGate from "@/components/layout/PagePublishGate";
import { useEditableContent } from "@/hooks/useEditableContent";

export default function GalleryPage() {
  const { t, img, list } = useEditableContent("gallery");

  return (
    <PagePublishGate pageKey="gallery">
    <main>

      {/* Hero */}

      <section className="relative h-[60vh]">
        <Image
          src={img("heroImage", "/images/gallery/hero.jpg")}
          alt="Gallery"
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex h-full items-center justify-center">
          <h1 className="text-6xl font-bold text-white">
            {t("heroTitle", "Gallery")}
          </h1>
        </div>
      </section>

      <GalleryCategory
        title="Fitness"
        description="Premium fitness facilities."
        images={list("galleryFitness", [
          "/images/gallery/gallery1.jpg",
          "/images/gallery/gallery2.jpg",
          "/images/gallery/gallery3.jpg",
          "/images/gallery/gallery4.jpg",
          "/images/gallery/gallery5.jpg",
          "/images/gallery/gallery6.jpg",
        ])}
      />

      <GalleryCategory
        title="Padel"
        description="Professional padel courts."
        images={list("galleryPadel", [
          "/images/gallery/courts-de-squash.jpg",
          "/images/gallery/salle-de-biking.jpg",
          "/images/gallery/vestiaires.jpg",
          "/images/gallery/salle-de-cross-training.jpg",
        ])}
      />

      <GalleryCategory
        title="Swimming Pool"
        description="Relax and train."
        images={list("galleryPool", [
          "/images/sports/pool.jpg",
          "/images/relax/plage.jpg",
          "/images/relax/terrasses.jpg",
        ])}
      />

    </main>
    </PagePublishGate>
  );
}