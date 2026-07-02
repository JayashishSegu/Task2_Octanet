"use client";

import { Wrench } from "lucide-react";
import type { Improvement, Priority } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<Priority, string> = {
  Critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  High: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Low: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
};

export function Improvements({ improvements }: { improvements: Improvement[] }) {
  if (improvements.length === 0) {
    return (
      <section aria-labelledby="improvements-heading">
        <h2
          id="improvements-heading"
          className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Wrench className="h-5 w-5 text-orange-500" aria-hidden />
          Improvement report
        </h2>
        <p className="text-muted-foreground">
          Nothing actionable found — every check we ran came back clean.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="improvements-heading">
      <h2
        id="improvements-heading"
        className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight"
      >
        <Wrench className="h-5 w-5 text-orange-500" aria-hidden />
        Improvement report
        <span className="text-sm font-normal text-muted-foreground">
          ({improvements.length} items, most severe first)
        </span>
      </h2>
      <Accordion
        type="multiple"
        className="rounded-xl border bg-card px-4 shadow-sm"
      >
        {improvements.map((item, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className={cn(i === improvements.length - 1 && "border-b-0")}
          >
            <AccordionTrigger className="gap-3 hover:no-underline">
              <span className="flex flex-1 items-center gap-3 text-left">
                <Badge
                  variant="outline"
                  className={cn("shrink-0", PRIORITY_STYLES[item.priority])}
                >
                  {item.priority}
                </Badge>
                <span className="font-medium">{item.issue}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <dl className="space-y-2.5 pl-1 text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Why it matters</dt>
                  <dd>{item.whyItMatters}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">How to fix</dt>
                  <dd>{item.howToFix}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Expected impact</dt>
                  <dd>{item.expectedImpact}</dd>
                </div>
              </dl>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
