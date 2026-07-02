import type { LighthouseSummary } from "@/lib/types";

const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const PSI_TIMEOUT_MS = 30_000;

/**
 * Fetch real Lighthouse metrics from the Google PageSpeed Insights API.
 * Returns null (never throws) when no API key is configured or the call fails —
 * the heuristic engine degrades gracefully without it.
 */
export async function fetchLighthouse(
  url: string
): Promise<LighthouseSummary | null> {
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({ url, key, strategy: "mobile" });
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", c);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PSI_TIMEOUT_MS);
  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const cats = data?.lighthouseResult?.categories ?? {};
    const audits = data?.lighthouseResult?.audits ?? {};
    const pct = (v: unknown) =>
      typeof v === "number" ? Math.round(v * 100) : null;
    const num = (v: unknown) => (typeof v === "number" ? v : null);
    return {
      performance: pct(cats.performance?.score),
      accessibility: pct(cats.accessibility?.score),
      bestPractices: pct(cats["best-practices"]?.score),
      seo: pct(cats.seo?.score),
      lcpMs: num(audits["largest-contentful-paint"]?.numericValue),
      cls: num(audits["cumulative-layout-shift"]?.numericValue),
      tbtMs: num(audits["total-blocking-time"]?.numericValue),
      fcpMs: num(audits["first-contentful-paint"]?.numericValue),
      speedIndexMs: num(audits["speed-index"]?.numericValue),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
