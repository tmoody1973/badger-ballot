"use client";

import type { VoteData } from "@/types";

interface VoteRecordProps {
  readonly data: VoteData;
}

function getVoteStyle(vote: string) {
  if (["Nay", "Objected", "No"].includes(vote)) {
    return { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" };
  }
  if (["Yea", "Sponsored", "Yes"].includes(vote)) {
    return { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" };
  }
  return { bg: "#F9FAFB", text: "#374151", border: "var(--border)" };
}

export function VoteRecord({ data }: VoteRecordProps) {
  const style = getVoteStyle(data.vote);

  return (
    <div className="animate-slide-up rounded-xl border bg-surface p-4 shadow-sm"
         style={{ borderColor: "var(--border)" }}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <span
            className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono mb-2"
            style={{ backgroundColor: "var(--wi-blue-light)", color: "var(--wi-blue)" }}
          >
            VOTE
          </span>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{data.bill}</h4>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {data.context}
          </p>
          {data.date && (
            <p className="mt-2 text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
              {data.date} &middot; {data.source}
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-mono font-bold tracking-wider"
          style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
        >
          {data.vote.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
