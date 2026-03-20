"use client";

import type { VoteData } from "@/types";
import { CitationLink } from "./CitationLink";

interface VoteRecordProps {
  readonly data: VoteData;
}

function getVoteStyle(vote: string) {
  if (["Nay", "Objected", "No"].includes(vote)) {
    return { bg: "#FEF2F2", text: "#991B1B" };
  }
  if (["Yea", "Sponsored", "Yes"].includes(vote)) {
    return { bg: "#F0FDF4", text: "#166534" };
  }
  return { bg: "#F9FAFB", text: "#374151" };
}

export function VoteRecord({ data }: VoteRecordProps) {
  const style = getVoteStyle(data.vote);

  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
      role="article"
      aria-label={`Vote: ${data.bill}, ${data.vote}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <span className="inline-block rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono mb-3 bg-wi-blue-light text-wi-blue">
            VOTE
          </span>
          <h4 className="text-base font-heading text-foreground">{data.bill}</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {data.context}
          </p>
          <p className="mt-2.5 text-xs text-muted-foreground">
            {data.date && <>{data.date} &middot; </>}
            <CitationLink source={data.source} sourceUrl={data.sourceUrl} />
          </p>
        </div>
        <span
          className="shrink-0 rounded-base border-2 border-border px-4 py-2 text-sm font-mono font-bold tracking-wider"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {data.vote.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
