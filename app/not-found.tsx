import Link from "next/link";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex max-w-xl flex-col items-center gap-6 py-32 text-center">
      <p className="text-7xl font-extrabold text-gradient-fire">404</p>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ironically, a broken link on a website-reviewing website would be
          very roastable. Good thing this one is intentional.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Flame className="h-4 w-4" /> Back to roasting
        </Link>
      </Button>
    </div>
  );
}
