"use client";

import { motion } from "framer-motion";
import {
  Accessibility,
  Gauge,
  LayoutDashboard,
  MousePointerClick,
  Palette,
  PenTool,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Type,
  Wrench,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: Palette,
    title: "Design & Visual Consistency",
    description:
      "Color discipline, typography choices, and whether your palette looks intentional or accidental.",
  },
  {
    icon: LayoutDashboard,
    title: "UX & Information Architecture",
    description:
      "Navigation, content structure, and how easily a stranger can find what they came for.",
  },
  {
    icon: Gauge,
    title: "Performance",
    description:
      "Response time, payload weight, render-blocking scripts, image formats — plus real Lighthouse metrics.",
  },
  {
    icon: Search,
    title: "SEO",
    description:
      "Titles, descriptions, headings, canonical, Open Graph, structured data, and indexability.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    description:
      "Alt text coverage, form labels, language declaration, link names, and keyboard sanity.",
  },
  {
    icon: ShieldCheck,
    title: "Trust Signals",
    description:
      "HTTPS, security headers, legal pages, contact info — everything users silently check.",
  },
  {
    icon: MousePointerClick,
    title: "Conversion & CTAs",
    description:
      "Whether your calls to action exist, stand out, and point somewhere worth going.",
  },
  {
    icon: PenTool,
    title: "Copywriting",
    description:
      "Readability scores, content depth, and link text that actually says something.",
  },
  {
    icon: Type,
    title: "Branding",
    description:
      "Favicon, social presence, share cards — how your brand shows up outside your own tab.",
  },
  {
    icon: Smartphone,
    title: "Mobile Responsiveness",
    description:
      "Viewport configuration and mobile-first readiness, because most of your traffic is a phone.",
  },
  {
    icon: Wrench,
    title: "Developer Quality",
    description:
      "Compression, deprecated tags, inline-style sprawl, charset — the plumbing users feel but never see.",
  },
  {
    icon: Sparkles,
    title: "The Roast Itself",
    description:
      "Witty, confident, Simon Cowell-grade commentary — every burn cites the evidence behind it.",
  },
];

export function Features() {
  return (
    <section className="container pb-24">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          One paste. <span className="text-gradient-fire">Eleven expert audits.</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          The world&apos;s most honest review panel — a UI/UX reviewer, SEO
          expert, accessibility auditor, performance engineer, conversion
          optimizer, and startup advisor. All with zero patience for excuses.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
          >
            <Card className="h-full transition-colors hover:border-orange-500/40">
              <CardHeader>
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/15 to-red-500/15 text-orange-500">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
