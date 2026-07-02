import type { Metadata } from "next";
import { HistoryView } from "@/components/history-view";

export const metadata: Metadata = {
  title: "History",
  description: "Your recent website roasts, stored privately in your browser.",
};

export default function HistoryPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">History</h1>
      <p className="mb-8 text-muted-foreground">
        Every site you&apos;ve roasted, newest first. Stored locally in your
        browser — nobody else sees your victims.
      </p>
      <HistoryView />
    </div>
  );
}
