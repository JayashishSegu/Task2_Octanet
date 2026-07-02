"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { UrlForm } from "@/components/url-form";
import { EXAMPLE_SITES } from "@/lib/examples";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated gradient aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-40 left-1/4 h-[30rem] w-[30rem] animate-aurora rounded-full bg-orange-500/20 blur-3xl dark:bg-orange-500/15" />
        <div className="absolute -top-20 right-1/4 h-[26rem] w-[26rem] animate-aurora rounded-full bg-red-500/15 blur-3xl [animation-delay:-5s] dark:bg-red-600/10" />
        <div className="absolute top-40 left-1/2 h-[22rem] w-[22rem] animate-aurora rounded-full bg-amber-400/15 blur-3xl [animation-delay:-9s] dark:bg-amber-500/10" />
      </div>

      <div className="container flex flex-col items-center gap-8 pb-20 pt-16 text-center sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-500" aria-hidden />
            If Simon Cowell reviewed websites
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl"
        >
          Your website is probably fine.
          <br />
          <span className="text-gradient-fire">Let&apos;s find out how fine.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-balance text-lg text-muted-foreground"
        >
          Paste a URL and get a brutally honest, technically accurate roast —
          design, UX, SEO, performance, accessibility, trust, and conversion,
          scored 0–100. Every burn backed by real evidence from your live site.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-2xl"
        >
          <UrlForm autoFocus />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-sm text-muted-foreground">Try roasting:</span>
          {EXAMPLE_SITES.map((site) => (
            <Link
              key={site.url}
              href={`/roast?url=${encodeURIComponent(site.url)}`}
              className="rounded-full border border-border/70 bg-background/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur transition-colors hover:border-orange-500/50 hover:text-foreground"
            >
              {site.label}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
