import type { SiteSignals } from "./signals";
import { runChecks, type CheckResult } from "./checks";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  type CategoryKey,
  type CategoryScore,
  type Improvement,
  type LighthouseSummary,
  type Priority,
  type RoastLine,
  type RoastReport,
  type Verdict,
} from "@/lib/types";
import { clampScore, scoreGrade } from "@/lib/utils";

const PRIORITY_ORDER: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function categoryScores(
  checks: CheckResult[],
  lighthouse: LighthouseSummary | null
): CategoryScore[] {
  return CATEGORY_KEYS.map((key) => {
    const relevant = checks.filter((c) => c.categories.includes(key));
    const total = relevant.reduce((sum, c) => sum + c.weight, 0);
    const earned = relevant
      .filter((c) => c.passed)
      .reduce((sum, c) => sum + c.weight, 0);
    let score = total > 0 ? (earned / total) * 100 : 70;

    // Blend in real Lighthouse data when available — it's ground truth.
    if (lighthouse) {
      if (key === "performance" && lighthouse.performance !== null) {
        score = score * 0.35 + lighthouse.performance * 0.65;
      }
      if (key === "accessibility" && lighthouse.accessibility !== null) {
        score = score * 0.5 + lighthouse.accessibility * 0.5;
      }
      if (key === "seo" && lighthouse.seo !== null) {
        score = score * 0.6 + lighthouse.seo * 0.4;
      }
      if (key === "developerQuality" && lighthouse.bestPractices !== null) {
        score = score * 0.6 + lighthouse.bestPractices * 0.4;
      }
    }

    const failed = relevant.filter((c) => !c.passed);
    const passedChecks = relevant.filter((c) => c.passed);
    const explanation = buildCategoryExplanation(key, score, failed, passedChecks);
    const worst = [...failed].sort((a, b) => b.weight - a.weight)[0];

    return {
      key,
      name: CATEGORY_LABELS[key],
      score: clampScore(score),
      explanation,
      evidence: (failed.length > 0 ? failed : passedChecks)
        .slice(0, 4)
        .map((c) => c.evidence),
      suggestedFix:
        worst?.improvement?.howToFix ??
        (failed.length === 0
          ? "Nothing urgent — keep doing whatever you're doing here."
          : "Address the flagged issues above."),
    };
  });
}

function buildCategoryExplanation(
  key: CategoryKey,
  score: number,
  failed: CheckResult[],
  passed: CheckResult[]
): string {
  const name = CATEGORY_LABELS[key];
  if (failed.length === 0) {
    return `${name} is in genuinely good shape — all ${passed.length} checks we ran here passed.`;
  }
  const issueList = failed
    .slice(0, 3)
    .map((c) => c.improvement?.issue ?? c.id)
    .join("; ");
  if (score >= 70) {
    return `${name} is solid overall, but we caught ${failed.length} issue${failed.length === 1 ? "" : "s"}: ${issueList}.`;
  }
  if (score >= 45) {
    return `${name} is a mixed bag — ${failed.length} of ${failed.length + passed.length} checks failed, including: ${issueList}.`;
  }
  return `${name} needs real work: ${failed.length} of ${failed.length + passed.length} checks failed, led by: ${issueList}.`;
}

const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  design: 1,
  ux: 1.2,
  accessibility: 1,
  performance: 1.2,
  seo: 1.2,
  trust: 1,
  branding: 0.8,
  copywriting: 0.9,
  conversion: 1.1,
  developerQuality: 0.9,
  visualConsistency: 0.7,
};

function overallScore(categories: CategoryScore[]): number {
  const totalWeight = categories.reduce(
    (sum, c) => sum + CATEGORY_WEIGHTS[c.key],
    0
  );
  const weighted = categories.reduce(
    (sum, c) => sum + c.score * CATEGORY_WEIGHTS[c.key],
    0
  );
  return clampScore(weighted / totalWeight);
}

function buildRoasts(checks: CheckResult[], s: SiteSignals): RoastLine[] {
  const failed = checks
    .filter((c) => !c.passed && c.roast)
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.improvement?.priority ?? "Low"] -
          PRIORITY_ORDER[b.improvement?.priority ?? "Low"] || b.weight - a.weight
    );
  const roasts = failed.slice(0, 8).map((c) => ({
    line: c.roast as string,
    basedOn: c.evidence,
  }));
  if (roasts.length === 0) {
    roasts.push({
      line: `We came to roast ${s.domain} and left with a compliment sandwich that's all bread. Every automated check passed. Disgusting. Well done.`,
      basedOn: "All applicable checks passed.",
    });
  }
  return roasts;
}

function buildImprovements(checks: CheckResult[]): Improvement[] {
  return checks
    .filter((c) => !c.passed && c.improvement)
    .map((c) => c.improvement as Improvement)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 14);
}

function buildWins(checks: CheckResult[]): string[] {
  const wins = checks
    .filter((c) => c.passed && c.win)
    .sort((a, b) => b.weight - a.weight)
    .map((c) => c.win as string)
    .slice(0, 10);
  if (wins.length === 0) {
    wins.push(
      "The site is online and reachable. Given everything else in this report, let's call that a foundation."
    );
  }
  return wins;
}

function buildVerdict(
  score: number,
  categories: CategoryScore[],
  s: SiteSignals,
  criticalCount: number
): Verdict {
  const cat = (k: CategoryKey) =>
    categories.find((c) => c.key === k)?.score ?? 50;
  const grade = scoreGrade(score);

  const summary =
    score >= 80
      ? `${s.domain} scores ${score}/100 (${grade}) — a genuinely well-built site. The fundamentals are strong across performance, SEO, and trust; the remaining issues are polish, not surgery. This is what "shipped by people who care" looks like, and it shows.`
      : score >= 60
        ? `${s.domain} lands at ${score}/100 (${grade}) — a competent site with real gaps. The bones are fine, but ${criticalCount > 0 ? `${criticalCount} critical issue${criticalCount === 1 ? "" : "s"} and ` : ""}a series of unforced errors are leaving traffic, trust, and conversions on the table. A focused week of fixes would move this a full grade.`
        : score >= 40
          ? `${s.domain} comes in at ${score}/100 (${grade}) — this site is actively working against itself. Multiple fundamentals failed${criticalCount > 0 ? `, including ${criticalCount} critical issue${criticalCount === 1 ? "" : "s"}` : ""}. The good news: most of what's broken here is cheap to fix and the fix list below is basically a to-do list to respectability.`
          : `${s.domain} scores ${score}/100 (${grade}). We don't say this lightly: the site needs a rebuild-level intervention. Core requirements — the kind users and Google both silently judge — are missing. Treat the improvement report below as a rescue plan, starting with the Critical items.`;

  return {
    summary,
    wouldYouLaunchThis:
      score >= 75
        ? "Yes — this is launch-quality. Ship it and iterate on the polish items."
        : score >= 55
          ? "Soft launch, maybe. Fix the Critical and High items first — they're visible to every visitor."
          : "Not yet. Launching this now means paying for traffic that bounces off broken fundamentals.",
    wouldInvestorsTrustIt:
      cat("trust") >= 70 && score >= 65
        ? "Yes — the trust signals (legal pages, HTTPS, contact info) read as a real operation."
        : cat("trust") >= 50
          ? "They'd hesitate. The trust layer is thin — legal pages, team visibility, and security posture need shoring up before due diligence."
          : "No. The missing trust signals read as 'weekend project', and investors pattern-match on exactly that.",
    wouldUsersStay:
      cat("ux") >= 70 && cat("performance") >= 60
        ? "Mostly yes — navigation and speed are good enough that users can get what they came for."
        : cat("performance") < 50
          ? "Many won't make it past the loading. Speed is the silent bounce machine, and this site feeds it."
          : "Some will, but the friction points in UX and content give them reasons to leave before converting.",
    wouldGoogleLoveIt:
      cat("seo") >= 75
        ? "Yes — metadata, structure, and indexability are in good shape. Google can read this site clearly."
        : cat("seo") >= 50
          ? "Google tolerates it. The basics are half-done; completing titles, descriptions, and structure would meaningfully improve visibility."
          : "No. With these SEO gaps, Google barely knows this site exists — and what it can see, it can't rank confidently.",
  };
}

function buildTagline(score: number, s: SiteSignals): string {
  if (score >= 85) return `Annoyingly good. We tried to roast ${s.domain} and mostly found compliments.`;
  if (score >= 70) return `Solid, with a side of missed opportunities.`;
  if (score >= 55) return `A decent site wearing several small disasters.`;
  if (score >= 40) return `The potential is there. The execution called in sick.`;
  return `This isn't a website, it's a cautionary tale with a domain name.`;
}

export function buildHeuristicReport(
  signals: SiteSignals,
  lighthouse: LighthouseSummary | null
): RoastReport {
  const checks = runChecks(signals);
  const categories = categoryScores(checks, lighthouse);
  const score = overallScore(categories);
  const improvements = buildImprovements(checks);
  const criticalCount = improvements.filter(
    (i) => i.priority === "Critical"
  ).length;

  return {
    url: signals.url,
    finalUrl: signals.finalUrl,
    domain: signals.domain,
    analyzedAt: new Date().toISOString(),
    overallScore: score,
    grade: scoreGrade(score),
    tagline: buildTagline(score, signals),
    categories,
    roasts: buildRoasts(checks, signals),
    improvements,
    wins: buildWins(checks),
    verdict: buildVerdict(score, categories, signals, criticalCount),
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
      generator: "heuristic",
      lighthouse,
    },
  };
}
