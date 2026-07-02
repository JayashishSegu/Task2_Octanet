export type Priority = "Low" | "Medium" | "High" | "Critical";

export const CATEGORY_KEYS = [
  "design",
  "ux",
  "accessibility",
  "performance",
  "seo",
  "trust",
  "branding",
  "copywriting",
  "conversion",
  "developerQuality",
  "visualConsistency",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  design: "Design",
  ux: "UX",
  accessibility: "Accessibility",
  performance: "Performance",
  seo: "SEO",
  trust: "Trust",
  branding: "Branding",
  copywriting: "Copywriting",
  conversion: "Conversion",
  developerQuality: "Developer Quality",
  visualConsistency: "Visual Consistency",
};

export interface CategoryScore {
  key: CategoryKey;
  name: string;
  score: number;
  explanation: string;
  evidence: string[];
  suggestedFix: string;
}

export interface RoastLine {
  line: string;
  basedOn: string;
}

export interface Improvement {
  issue: string;
  whyItMatters: string;
  howToFix: string;
  expectedImpact: string;
  priority: Priority;
}

export interface Verdict {
  summary: string;
  wouldYouLaunchThis: string;
  wouldInvestorsTrustIt: string;
  wouldUsersStay: string;
  wouldGoogleLoveIt: string;
}

export interface LighthouseSummary {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  fcpMs: number | null;
  speedIndexMs: number | null;
}

export interface RoastReport {
  url: string;
  finalUrl: string;
  domain: string;
  analyzedAt: string;
  overallScore: number;
  grade: string;
  tagline: string;
  categories: CategoryScore[];
  roasts: RoastLine[];
  improvements: Improvement[];
  wins: string[];
  verdict: Verdict;
  meta: {
    title: string | null;
    description: string | null;
    screenshotUrl: string;
    faviconUrl: string;
    responseTimeMs: number;
    htmlSizeKb: number;
    generator: "ai" | "heuristic";
    lighthouse: LighthouseSummary | null;
  };
}

export type RoastResult =
  | { ok: true; report: RoastReport }
  | { ok: false; error: string };

export interface HistoryEntry {
  url: string;
  domain: string;
  overallScore: number;
  grade: string;
  tagline: string;
  analyzedAt: string;
}
