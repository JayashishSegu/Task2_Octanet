import type { HistoryEntry, RoastReport } from "./types";

const HISTORY_KEY = "website-roast:history";
const REPORT_PREFIX = "website-roast:report:";
const MAX_HISTORY = 30;

const isBrowser = () => typeof window !== "undefined";

export function getHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: RoastReport): void {
  if (!isBrowser()) return;
  try {
    const entry: HistoryEntry = {
      url: report.url,
      domain: report.domain,
      overallScore: report.overallScore,
      grade: report.grade,
      tagline: report.tagline,
      analyzedAt: report.analyzedAt,
    };
    const history = getHistory().filter((h) => h.url !== report.url);
    history.unshift(entry);
    const trimmed = history.slice(0, MAX_HISTORY);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    window.localStorage.setItem(
      REPORT_PREFIX + report.url,
      JSON.stringify(report)
    );
    // Evict cached reports that fell out of history.
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key?.startsWith(REPORT_PREFIX) &&
        !trimmed.some((h) => REPORT_PREFIX + h.url === key)
      ) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    /* storage full or unavailable — history is a nice-to-have */
  }
}

export function getCachedReport(url: string): RoastReport | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(REPORT_PREFIX + url);
    return raw ? (JSON.parse(raw) as RoastReport) : null;
  } catch {
    return null;
  }
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key === HISTORY_KEY || key?.startsWith(REPORT_PREFIX)) keys.push(key);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
