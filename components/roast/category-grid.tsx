"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { CategoryScore } from "@/lib/types";
import { CategoryRing } from "./category-ring";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function CategoryCard({
  category,
  index,
}: {
  category: CategoryScore;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `category-panel-${category.key}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: (index % 4) * 0.06 }}
      className="print-break-avoid"
    >
      <Card className="h-full overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-accent/50"
        >
          <CategoryRing score={category.score} delay={(index % 4) * 0.06} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{category.name}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {category.explanation}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t px-4 py-4 text-sm">
                <p>{category.explanation}</p>
                {category.evidence.length > 0 && (
                  <div>
                    <p className="mb-1.5 font-medium text-muted-foreground">
                      Evidence
                    </p>
                    <ul className="space-y-1">
                      {category.evidence.map((e, i) => (
                        <li key={i} className="flex gap-2 text-muted-foreground">
                          <span className="text-orange-500" aria-hidden>
                            •
                          </span>
                          <span className="break-words">{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2 rounded-lg bg-amber-500/10 p-3">
                  <Lightbulb
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                    aria-hidden
                  />
                  <p>
                    <span className="font-medium">Suggested fix: </span>
                    {category.suggestedFix}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export function CategoryGrid({ categories }: { categories: CategoryScore[] }) {
  return (
    <section aria-labelledby="categories-heading">
      <h2
        id="categories-heading"
        className="mb-4 text-xl font-semibold tracking-tight"
      >
        Category scores
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, i) => (
          <CategoryCard key={category.key} category={category} index={i} />
        ))}
      </div>
    </section>
  );
}
