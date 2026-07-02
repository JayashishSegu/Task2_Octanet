"use client";

import { useState } from "react";
import { Check, Copy, FileDown, RefreshCw, Share2 } from "lucide-react";
import type { RoastReport } from "@/lib/types";
import { reportToMarkdown } from "@/lib/report-text";
import { useClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";

export function ReportActions({
  report,
  onReanalyze,
}: {
  report: RoastReport;
  onReanalyze: () => void;
}) {
  const { copied: reportCopied, copy: copyReport } = useClipboard();
  const { copied: linkCopied, copy: copyLink } = useClipboard();
  const [shared, setShared] = useState(false);

  const shareUrl = () =>
    `${window.location.origin}/roast?url=${encodeURIComponent(report.url)}`;

  const share = async () => {
    const url = shareUrl();
    const shareData = {
      title: `Website Roast — ${report.domain} scored ${report.overallScore}/100`,
      text: report.tagline,
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    await copyLink(url);
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <FileDown className="h-4 w-4" />
        Export PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyReport(reportToMarkdown(report))}
      >
        {reportCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        {reportCopied ? "Copied!" : "Copy report"}
      </Button>
      <Button variant="outline" size="sm" onClick={share}>
        {linkCopied || shared ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {linkCopied ? "Link copied!" : shared ? "Shared!" : "Share link"}
      </Button>
      <Button variant="outline" size="sm" onClick={onReanalyze}>
        <RefreshCw className="h-4 w-4" />
        Re-roast
      </Button>
    </div>
  );
}
