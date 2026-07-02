"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Flame, Trash2 } from "lucide-react";
import { useHistory } from "@/hooks/use-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { scoreColor } from "@/lib/utils";

export function HistoryView() {
  const { history, loaded, clear } = useHistory();

  if (!loaded) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <Clock className="h-10 w-10 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">No roasts yet</p>
          <p className="text-sm text-muted-foreground">
            Your analyses are stored privately in this browser.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Flame className="h-4 w-4" /> Roast your first site
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={clear}>
          <Trash2 className="h-4 w-4" /> Clear history
        </Button>
      </div>
      <div className="space-y-3">
        {history.map((entry, i) => (
          <motion.div
            key={entry.url}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
          >
            <Link href={`/roast?url=${encodeURIComponent(entry.url)}`} className="group block">
              <Card className="transition-all group-hover:-translate-y-0.5 group-hover:border-orange-500/40 group-hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{entry.domain}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {entry.tagline}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(entry.analyzedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-3xl font-bold tabular-nums ${scoreColor(entry.overallScore)}`}>
                      {entry.overallScore}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      grade {entry.grade}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
