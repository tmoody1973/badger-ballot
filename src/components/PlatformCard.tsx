"use client";

import { CitationLink } from "./CitationLink";

export interface PlatformPositionData {
  readonly issue: string;
  readonly position: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly candidate: string;
}

interface PlatformCardProps {
  readonly data: PlatformPositionData;
}

export function PlatformCard({ data }: PlatformCardProps) {
  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow"
      role="article"
      aria-label={`${data.candidate}'s position on ${data.issue}`}
    >
      <span className="inline-block rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono mb-2 bg-[var(--party-nonpartisan-bg)] text-[var(--party-nonpartisan)]">
        POSITION
      </span>
      <h4 className="text-base font-heading text-foreground">{data.issue}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {data.position}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        <CitationLink source={data.source} sourceUrl={data.sourceUrl} />
      </p>
    </div>
  );
}
