"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, History, Trophy, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RANDOM_ROAST_POOL } from "@/lib/examples";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/history", label: "History", icon: History },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const randomRoast = () => {
    const url =
      RANDOM_ROAST_POOL[Math.floor(Math.random() * RANDOM_ROAST_POOL.length)];
    router.push(`/roast?url=${encodeURIComponent(url)}`);
  };

  return (
    <header className="no-print sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
            <Flame className="h-4 w-4 animate-flame-flicker" />
          </span>
          <span className="text-lg">
            Website<span className="text-gradient-fire">Roast</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                pathname === href && "bg-accent text-accent-foreground"
              )}
            >
              <Link href={href}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={randomRoast}
            aria-label="Roast a random website"
          >
            <Shuffle className="h-4 w-4" />
            <span className="hidden sm:inline">Random</span>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
