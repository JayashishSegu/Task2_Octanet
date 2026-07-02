import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "The best and worst websites you've roasted — hall of fame and hall of flame.",
};

export default function LeaderboardPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Leaderboard</h1>
      <p className="mb-8 text-muted-foreground">
        The highest and lowest scorers from your roasting sessions. Local to
        this browser — your shame list is safe.
      </p>
      <LeaderboardView />
    </div>
  );
}
