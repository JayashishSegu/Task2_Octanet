import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportView } from "@/components/roast/report-view";
import { normalizeUrlInput } from "@/lib/utils";

export const maxDuration = 60;

type SearchParams = Promise<{ url?: string | string[] }>;

export async function generateMetadata(props: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { url } = await props.searchParams;
  const raw = Array.isArray(url) ? url[0] : url;
  const normalized = raw ? normalizeUrlInput(raw) : null;
  const domain = normalized ? new URL(normalized).hostname.replace(/^www\./, "") : null;
  return {
    title: domain ? `Roast of ${domain}` : "Roast Report",
    description: domain
      ? `Brutally honest, evidence-based review of ${domain} — design, UX, SEO, performance, accessibility, and conversion, scored 0–100.`
      : "Brutally honest, evidence-based website review.",
    robots: { index: false },
  };
}

export default async function RoastPage(props: { searchParams: SearchParams }) {
  const { url } = await props.searchParams;
  const raw = Array.isArray(url) ? url[0] : url;
  const normalized = raw ? normalizeUrlInput(raw) : null;

  if (!normalized) {
    redirect("/");
  }

  return <ReportView url={normalized} />;
}
