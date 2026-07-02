"use client";

import { motion } from "framer-motion";
import { Trophy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Wins({ wins }: { wins: string[] }) {
  return (
    <section aria-labelledby="wins-heading">
      <h2
        id="wins-heading"
        className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight"
      >
        <Trophy className="h-5 w-5 text-emerald-500" aria-hidden />
        The wins
        <span className="text-sm font-normal text-muted-foreground">
          (credit where it&apos;s due)
        </span>
      </h2>
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent">
        <CardContent className="p-5">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {wins.map((win, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex gap-2.5"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-3 w-3 text-emerald-500" aria-hidden />
                </span>
                <span className="text-sm">{win}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
