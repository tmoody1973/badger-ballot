"use client";

import type { FactCheckData } from "@/types";
import { CitationLink } from "./CitationLink";

interface FactCheckBadgeProps {
  readonly data: FactCheckData;
}

const RATING_COLORS: Record<string, { bg: string; text: string }> = {
  "True": { bg: "#F0FDF4", text: "#166534" },
  "Mostly True": { bg: "#F0FDF4", text: "#166534" },
  "Half True": { bg: "#FEFCE8", text: "#854D0E" },
  "Mostly False": { bg: "#FFF7ED", text: "#9A3412" },
  "False": { bg: "#FEF2F2", text: "#991B1B" },
  "Pants on Fire": { bg: "#FEF2F2", text: "#991B1B" },
  "Verified": { bg: "#F5F3FF", text: "#5B21B6" },
  "Unverified": { bg: "#F9FAFB", text: "#374151" },
  "Needs Context": { bg: "#FEFCE8", text: "#854D0E" },
};

function getRatingColor(rating: string) {
  return RATING_COLORS[rating] ?? { bg: "#F9FAFB", text: "#374151" };
}

export function FactCheckBadge({ data }: FactCheckBadgeProps) {
  const color = getRatingColor(data.rating);

  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
      role="article"
      aria-label={`Fact check: ${data.claim}, rated ${data.rating}`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono bg-[var(--party-r-bg)] text-[var(--status-error)]">
          FACT CHECK
        </span>
        <span className="text-xs text-muted-foreground">
          <CitationLink source={data.source} sourceUrl={data.sourceUrl} /> &middot; {data.year}
        </span>
      </div>

      <blockquote className="mb-4 border-l-4 border-border pl-4 text-base italic text-foreground leading-relaxed">
        &ldquo;{data.claim}&rdquo;
      </blockquote>

      <div className="flex items-center gap-3">
        <span
          className="rounded-base border-2 border-border px-3 py-1 text-xs font-mono font-bold tracking-wider"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {data.rating.toUpperCase()}
        </span>
        <span className="text-sm font-mono text-muted-foreground">
          &mdash; {data.candidate}
        </span>
      </div>
    </div>
  );
}
