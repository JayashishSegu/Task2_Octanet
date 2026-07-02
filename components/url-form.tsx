"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeUrlInput, cn } from "@/lib/utils";

export function UrlForm({
  size = "lg",
  autoFocus = false,
  className,
}: {
  size?: "lg" | "sm";
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrlInput(value);
    if (!normalized) {
      setError("Enter a valid website URL — e.g. example.com");
      return;
    }
    setError(null);
    setSubmitting(true);
    router.push(`/roast?url=${encodeURIComponent(normalized)}`);
  };

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <div
        className={cn(
          "glass flex w-full items-center gap-2 rounded-2xl p-2 shadow-xl shadow-orange-500/5 transition-shadow focus-within:shadow-orange-500/15",
          size === "sm" && "rounded-xl p-1.5"
        )}
      >
        <LinkIcon
          className="ml-3 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <label htmlFor="roast-url" className="sr-only">
          Website URL to roast
        </label>
        <Input
          id="roast-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          autoFocus={autoFocus}
          placeholder="Paste any website URL… e.g. stripe.com"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          className={cn(
            "border-0 bg-transparent shadow-none focus-visible:ring-0",
            size === "lg" && "h-12 text-base"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? "roast-url-error" : undefined}
        />
        <Button
          type="submit"
          size={size === "lg" ? "lg" : "default"}
          disabled={submitting}
          className="shrink-0 bg-gradient-to-r from-orange-500 to-red-600 font-semibold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.02] hover:from-orange-600 hover:to-red-700"
        >
          <Flame className="h-4 w-4" aria-hidden />
          <span>{submitting ? "Heating up…" : "Roast it"}</span>
        </Button>
      </div>
      {error && (
        <p
          id="roast-url-error"
          role="alert"
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  );
}
