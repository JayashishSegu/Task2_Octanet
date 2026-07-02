"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LINES = [
  "Fetching the site…",
  "Reading the HTML so you don't have to…",
  "Judging the metadata…",
  "Counting images without alt text…",
  "Timing the server (it knows what it did)…",
  "Hunting for the call to action…",
  "Checking if Google would even notice this site…",
  "Sharpening the roast…",
  "Consulting the panel of imaginary experts…",
  "Writing burns with citations…",
];

export function LoadingRoast({ domain }: { domain: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setStep((s) => Math.min(s + 1, STATUS_LINES.length - 1)),
      2200
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container max-w-5xl py-10" aria-busy="true">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-xl shadow-orange-500/30">
          <Flame className="h-8 w-8 animate-flame-flicker text-white" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">
          Roasting <span className="text-gradient-fire">{domain}</span>
        </h1>
        <div
          role="status"
          aria-live="polite"
          className="h-6 text-muted-foreground"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {STATUS_LINES[step]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Skeleton dashboard */}
      <div className="space-y-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row">
            <Skeleton className="h-52 w-52 rounded-full" />
            <div className="w-full flex-1 space-y-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
