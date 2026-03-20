"use client";

import type { FactCheckData } from "@/types";

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
    <div className="animate-slide-up rounded-xl border bg-surface p-4 shadow-sm"
         style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono"
          style={{ backgroundColor: "#FEF2F2", color: "var(--status-error)" }}
        >
          FACT CHECK
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
          {data.source} &middot; {data.year}
        </span>
      </div>

      <blockquote
        className="mb-3 border-l-4 pl-3 text-sm italic"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        &ldquo;{data.claim}&rdquo;
      </blockquote>

      <div className="flex items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {data.rating.toUpperCase()}
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
          &mdash; {data.candidate}
        </span>
      </div>
    </div>
  );
}
