"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { useHistory } from "@/hooks/use-history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scoreColor } from "@/lib/utils";

export function RecentAnalyses() {
  const { history, loaded } = useHistory();

  if (!loaded || history.length === 0) return null;

  return (
    <section className="container pb-24" aria-labelledby="recent-heading">
      <div className="mb-6 flex items-center justify-between">
        <h2
          id="recent-heading"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Clock className="h-5 w-5 text-orange-500" aria-hidden />
          Recent roasts
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/history">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {history.slice(0, 6).map((entry) => (
          <Link
            key={entry.url}
            href={`/roast?url=${encodeURIComponent(entry.url)}`}
            className="group"
          >
            <Card className="transition-all group-hover:-translate-y-0.5 group-hover:border-orange-500/40 group-hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{entry.domain}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {entry.tagline}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor(entry.overallScore)}`}>
                    {entry.overallScore}
                  </p>
                  <p className="text-xs text-muted-foreground">/100</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
