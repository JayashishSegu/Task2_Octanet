import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { SiteSignals } from "@/lib/analyzer/signals";
import type { CheckResult } from "@/lib/analyzer/checks";
import type { LighthouseSummary, RoastReport } from "@/lib/types";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/types";
import { clampScore, scoreGrade } from "@/lib/utils";

const prioritySchema = z.enum(["Low", "Medium", "High", "Critical"]);

const aiReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  tagline: z
    .string()
    .describe("One witty line summarizing the whole review, Simon Cowell style"),
  categories: z.array(
    z.object({
      key: z.enum(CATEGORY_KEYS),
      score: z.number().min(0).max(100),
      explanation: z
        .string()
        .describe("2-3 sentence honest assessment grounded ONLY in the evidence"),
      evidence: z
        .array(z.string())
        .describe("Direct observations from the provided data that justify the score"),
      suggestedFix: z.string().describe("The single most impactful fix for this category"),
    })
  ),
  roasts: z.array(
    z.object({
      line: z
        .string()
        .describe("Witty, funny, confident roast line — never toxic, always accurate"),
      basedOn: z.string().describe("The exact observation this roast is based on"),
    })
  ),
  improvements: z.array(
    z.object({
      issue: z.string(),
      whyItMatters: z.string(),
      howToFix: z.string(),
      expectedImpact: z.string(),
      priority: prioritySchema,
    })
  ),
  wins: z
    .array(z.string())
    .describe("Genuinely good things observed — celebrate them specifically"),
  verdict: z.object({
    summary: z.string().describe("One-paragraph final verdict"),
    wouldYouLaunchThis: z.string(),
    wouldInvestorsTrustIt: z.string(),
    wouldUsersStay: z.string(),
    wouldGoogleLoveIt: z.string(),
  }),
});

/**
 * LLM-written roast via the Vercel AI SDK (any OpenAI-compatible endpoint).
 * The model is grounded strictly in collected signals + deterministic check
 * results; it writes the comedy, the evidence writes the facts.
 * Returns null when no API key is configured or generation fails.
 */
export async function generateAiReport(
  signals: SiteSignals,
  checks: CheckResult[],
  lighthouse: LighthouseSummary | null
): Promise<RoastReport | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = createOpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const model = openai(process.env.OPENAI_MODEL || "gpt-4o-mini");

  const failedChecks = checks
    .filter((c) => !c.passed)
    .map((c) => ({ id: c.id, evidence: c.evidence, categories: c.categories }));
  const passedChecks = checks
    .filter((c) => c.passed)
    .map((c) => ({ id: c.id, evidence: c.evidence, categories: c.categories }));

  try {
    const { object } = await generateObject({
      model,
      schema: aiReportSchema,
      maxRetries: 1,
      system: [
        "You are 'Website Roast' — the world's best UI/UX reviewer, developer, SEO expert, accessibility auditor, conversion optimizer, branding expert, copywriter, and startup advisor rolled into one, with the delivery of Simon Cowell reviewing websites.",
        "Rules you must never break:",
        "1. NEVER invent a problem. Every criticism, score, and roast line must be traceable to the provided evidence (signals, check results, Lighthouse data). If the data doesn't show it, you don't say it.",
        "2. Be witty, funny, and confident — never toxic or insulting to people. Roast the website, not its makers.",
        "3. Be technically accurate. You're funny BECAUSE you're right.",
        "4. Celebrate real wins specifically. A roast with no fairness is just noise.",
        `5. Produce a score for ALL ${CATEGORY_KEYS.length} categories: ${CATEGORY_KEYS.map((k) => `${k} (${CATEGORY_LABELS[k]})`).join(", ")}.`,
        "6. Scores must be consistent with the evidence: many failed checks in a category = low score; all passed = high score. Lighthouse scores, when present, are ground truth for performance/accessibility/seo.",
        "7. Provide 5-8 roast lines, each citing its observation in basedOn.",
        "8. Improvements: for every real issue give whyItMatters, howToFix, expectedImpact, and a priority (Low/Medium/High/Critical), ordered most severe first.",
      ].join("\n"),
      prompt: [
        `Roast this website: ${signals.finalUrl}`,
        "",
        "== RAW SIGNALS (collected live from the page) ==",
        JSON.stringify(signals, null, 1),
        "",
        "== FAILED CHECKS (real problems, verified) ==",
        JSON.stringify(failedChecks, null, 1),
        "",
        "== PASSED CHECKS (real strengths, verified) ==",
        JSON.stringify(passedChecks, null, 1),
        "",
        lighthouse
          ? `== LIGHTHOUSE (Google PageSpeed, mobile) ==\n${JSON.stringify(lighthouse, null, 1)}`
          : "== LIGHTHOUSE == not available for this run; rely on the signals and checks.",
      ].join("\n"),
    });

    const categories = CATEGORY_KEYS.map((key) => {
      const found = object.categories.find((c) => c.key === key);
      return {
        key,
        name: CATEGORY_LABELS[key],
        score: clampScore(found?.score ?? 60),
        explanation: found?.explanation ?? "No specific findings for this category.",
        evidence: found?.evidence ?? [],
        suggestedFix: found?.suggestedFix ?? "No fix required.",
      };
    });

    const overall = clampScore(object.overallScore);

    return {
      url: signals.url,
      finalUrl: signals.finalUrl,
      domain: signals.domain,
      analyzedAt: new Date().toISOString(),
      overallScore: overall,
      grade: scoreGrade(overall),
      tagline: object.tagline,
      categories,
      roasts: object.roasts.slice(0, 8),
      improvements: object.improvements.slice(0, 14),
      wins: object.wins.slice(0, 10),
      verdict: object.verdict,
      meta: {
        title: signals.title,
        description: signals.metaDescription,
        screenshotUrl: `https://image.thum.io/get/width/1200/crop/900/noanimate/${encodeURIComponent(
          signals.finalUrl
        )}`,
        faviconUrl:
          signals.faviconUrl ??
          `https://www.google.com/s2/favicons?domain=${signals.domain}&sz=64`,
        responseTimeMs: signals.responseTimeMs,
        htmlSizeKb: signals.htmlSizeKb,
        generator: "ai",
        lighthouse,
      },
    };
  } catch (err) {
    console.error("[website-roast] AI generation failed, using heuristics:", err);
    return null;
  }
}
