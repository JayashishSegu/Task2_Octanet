"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { RoastLine } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

export function RoastLines({ roasts }: { roasts: RoastLine[] }) {
  return (
    <section aria-labelledby="roast-heading">
      <h2
        id="roast-heading"
        className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight"
      >
        <Flame className="h-5 w-5 text-orange-500" aria-hidden />
        The roast
      </h2>
      <div className="space-y-3">
        {roasts.map((roast, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="print-break-avoid"
          >
            <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/[0.06] to-transparent">
              <CardContent className="p-4 sm:p-5">
                <p className="text-base font-medium leading-relaxed sm:text-lg">
                  <span aria-hidden>🔥 </span>
                  &ldquo;{roast.line}&rdquo;
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">Based on:</span> {roast.basedOn}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
