"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import HeroSection from "@/components/home/HeroSection";
import ClubIntro from "@/components/home/ClubIntro";
import SportsSection from "@/components/home/SportsSection";
import RelaxSection from "@/components/home/RelaxSection";
import GallerySection from "@/components/home/GallerySection";
import CalendarPreview from "@/components/home/CalendarPreview";
import CoachesSection from "@/components/home/CoachesSection";
import PricingSection from "@/components/home/PricingSection";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <>
      <HeroSection />
      <ClubIntro />
      <SportsSection />
      <RelaxSection />
      <GallerySection />
      <CalendarPreview />
      <CoachesSection />
      <PricingSection />
      <CTASection />
    </>
  );
}