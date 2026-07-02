import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { RecentAnalyses } from "@/components/recent-analyses";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <RecentAnalyses />
      <Features />
    </>
  );
}
