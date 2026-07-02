"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink, Sparkles, Timer, FileCode2 } from "lucide-react";
import type { RoastReport } from "@/lib/types";
import { roastWebsite } from "@/app/actions/roast";
import { getCachedReport, saveReport } from "@/lib/storage";
import { LoadingRoast } from "./loading-roast";
import { ScoreGauge } from "./score-gauge";
import { CategoryGrid } from "./category-grid";
import { RoastLines } from "./roast-lines";
import { Improvements } from "./improvements";
import { Wins } from "./wins";
import { Verdict } from "./verdict";
import { ReportActions } from "./report-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UrlForm } from "@/components/url-form";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; report: RoastReport };

export function ReportView({ url }: { url: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  const analyze = useCallback(
    async (skipCache: boolean) => {
      setState({ status: "loading" });
      if (!skipCache) {
        const cached = getCachedReport(url);
        if (cached) {
          setState({ status: "done", report: cached });
          return;
        }
      }
      const result = await roastWebsite(url);
      if (result.ok) {
        saveReport(result.report);
        setState({ status: "done", report: result.report });
      } else {
        setState({ status: "error", message: result.error });
      }
    },
    [url]
  );

  useEffect(() => {
    void analyze(false);
  }, [analyze]);

  if (state.status === "loading") {
    return <LoadingRoast domain={domain} />;
  }

  if (state.status === "error") {
    return (
      <div className="container flex max-w-xl flex-col items-center gap-6 py-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Couldn&apos;t roast that one
          </h1>
          <p className="mt-2 text-muted-foreground">{state.message}</p>
        </div>
        <UrlForm size="sm" className="max-w-md" />
        <Button variant="ghost" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const { report } = state;

  return (
    <div className="print-report container max-w-5xl space-y-12 py-10">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass overflow-hidden">
          <CardContent className="flex flex-col items-center gap-8 p-6 sm:p-8 lg:flex-row">
            <ScoreGauge score={report.overallScore} grade={report.grade} />
            <div className="min-w-0 flex-1 text-center lg:text-left">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {report.domain}
                </h1>
                <a
                  href={report.finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Open ${report.domain} in a new tab`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {report.meta.title && (
                <p className="mb-2 truncate text-sm text-muted-foreground">
                  {report.meta.title}
                </p>
              )}
              <p className="mb-4 text-balance text-lg font-medium">
                &ldquo;{report.tagline}&rdquo;
              </p>
              <div className="mb-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <Badge variant="secondary" className="gap-1">
                  <Timer className="h-3 w-3" aria-hidden />
                  {report.meta.responseTimeMs}ms response
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileCode2 className="h-3 w-3" aria-hidden />
                  {report.meta.htmlSizeKb}KB HTML
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {report.meta.generator === "ai"
                    ? "AI-written roast"
                    : "Evidence engine"}
                </Badge>
                {report.meta.lighthouse?.performance !== null &&
                  report.meta.lighthouse !== null && (
                    <Badge variant="secondary">
                      Lighthouse perf: {report.meta.lighthouse.performance}
                    </Badge>
                  )}
              </div>
              <ReportActions report={report} onReanalyze={() => void analyze(true)} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Screenshot */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        aria-label="Website screenshot"
        className="no-print"
      >
        <div className="overflow-hidden rounded-xl border shadow-lg">
          <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden />
            <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden />
            <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden />
            <span className="ml-3 truncate rounded-md bg-background px-3 py-0.5 text-xs text-muted-foreground">
              {report.finalUrl}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.meta.screenshotUrl}
            alt={`Screenshot of ${report.domain}`}
            className="max-h-[480px] w-full bg-muted object-cover object-top"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).closest("section")?.classList.add("hidden");
            }}
          />
        </div>
      </motion.section>

      <CategoryGrid categories={report.categories} />
      <RoastLines roasts={report.roasts} />
      <Improvements improvements={report.improvements} />
      <Wins wins={report.wins} />
      <Verdict verdict={report.verdict} />

      <div className="no-print flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Roast another victim</h2>
        <UrlForm size="sm" className="max-w-md" />
      </div>
    </div>
  );
}
