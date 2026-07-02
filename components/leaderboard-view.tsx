"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Flame, Skull, Trophy } from "lucide-react";
import { useHistory } from "@/hooks/use-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { scoreColor } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/types";

function Board({
  title,
  icon,
  entries,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  entries: HistoryEntry[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <ol className="space-y-2">
            {entries.map((entry, i) => (
              <motion.li
                key={entry.url}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <Link
                  href={`/roast?url=${encodeURIComponent(entry.url)}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                >
                  <span className="w-6 text-center font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.domain}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.tagline}
                    </p>
                  </div>
                  <span
                    className={`text-xl font-bold tabular-nums ${scoreColor(entry.overallScore)}`}
                  >
                    {entry.overallScore}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaderboardView() {
  const { history, loaded } = useHistory();

  if (!loaded) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <Trophy className="h-10 w-10 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">The leaderboard is empty</p>
          <p className="text-sm text-muted-foreground">
            Roast a few sites and the best and worst will show up here.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Flame className="h-4 w-4" /> Start roasting
          </Link>
        </Button>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => b.overallScore - a.overallScore);
  const best = sorted.slice(0, 8);
  const worst = [...sorted].reverse().slice(0, 8);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Board
        title="Hall of Fame"
        icon={<Crown className="h-5 w-5 text-amber-400" aria-hidden />}
        entries={best}
        emptyText="No winners yet."
      />
      <Board
        title="Hall of Flame"
        icon={<Skull className="h-5 w-5 text-red-500" aria-hidden />}
        entries={worst}
        emptyText="No disasters yet. Give it time."
      />
    </div>
  );
}
