import Link from "next/link";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="no-print border-t border-border/60 py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-500" aria-hidden />
          Website Roast — brutally honest, evidence-based website reviews.
        </p>
        <nav className="flex items-center gap-5" aria-label="Footer">
          <Link href="/" className="transition-colors hover:text-foreground">
            Roast a site
          </Link>
          <Link
            href="/history"
            className="transition-colors hover:text-foreground"
          >
            History
          </Link>
          <Link
            href="/leaderboard"
            className="transition-colors hover:text-foreground"
          >
            Leaderboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}
