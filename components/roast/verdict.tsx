"use client";

import { motion } from "framer-motion";
import { Gavel, Rocket, Briefcase, Users, Search } from "lucide-react";
import type { Verdict as VerdictType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

const QUESTIONS = [
  { key: "wouldYouLaunchThis", label: "Would you launch this?", icon: Rocket },
  { key: "wouldInvestorsTrustIt", label: "Would investors trust it?", icon: Briefcase },
  { key: "wouldUsersStay", label: "Would users stay?", icon: Users },
  { key: "wouldGoogleLoveIt", label: "Would Google love it?", icon: Search },
] as const;

export function Verdict({ verdict }: { verdict: VerdictType }) {
  return (
    <section aria-labelledby="verdict-heading" className="print-break-avoid">
      <h2
        id="verdict-heading"
        className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight"
      >
        <Gavel className="h-5 w-5 text-orange-500" aria-hidden />
        Final verdict
      </h2>
      <Card className="glass overflow-hidden">
        <CardContent className="p-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-base leading-relaxed sm:text-lg"
          >
            {verdict.summary}
          </motion.p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {QUESTIONS.map(({ key, label, icon: Icon }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="rounded-lg border bg-background/50 p-4"
              >
                <p className="mb-1.5 flex items-center gap-2 font-semibold">
                  <Icon className="h-4 w-4 text-orange-500" aria-hidden />
                  {label}
                </p>
                <p className="text-sm text-muted-foreground">{verdict[key]}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
