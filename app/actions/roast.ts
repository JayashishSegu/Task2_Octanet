"use server";

import { collectSignals, AnalyzeError } from "@/lib/analyzer/fetch-site";
import { runChecks } from "@/lib/analyzer/checks";
import { fetchLighthouse } from "@/lib/analyzer/pagespeed";
import { buildHeuristicReport } from "@/lib/analyzer/heuristics";
import { generateAiReport } from "@/lib/ai/generate-report";
import { normalizeUrlInput } from "@/lib/utils";
import type { RoastResult } from "@/lib/types";

/**
 * Server Action: validate → fetch → analyze → roast.
 * 1. Validates and normalizes the URL (public http/https only).
 * 2. Fetches the live HTML and extracts ~40 real signals.
 * 3. Optionally pulls real Lighthouse metrics via PageSpeed Insights.
 * 4. Writes the roast with an LLM (Vercel AI SDK) grounded in the evidence,
 *    or falls back to the deterministic heuristic engine.
 */
export async function roastWebsite(rawUrl: string): Promise<RoastResult> {
  const normalized = normalizeUrlInput(rawUrl);
  if (!normalized) {
    return {
      ok: false,
      error:
        "That URL didn't survive validation. Try something like example.com or https://example.com.",
    };
  }

  try {
    const [signals, lighthouse] = await Promise.all([
      collectSignals(normalized),
      fetchLighthouse(normalized),
    ]);

    const checks = runChecks(signals);
    const aiReport = await generateAiReport(signals, checks, lighthouse);
    const report = aiReport ?? buildHeuristicReport(signals, lighthouse);

    return { ok: true, report };
  } catch (err) {
    if (err instanceof AnalyzeError) {
      return { ok: false, error: err.message };
    }
    console.error("[website-roast] analysis failed:", err);
    return {
      ok: false,
      error:
        "Something went wrong while analyzing that site. Give it another shot in a moment.",
    };
  }
}
