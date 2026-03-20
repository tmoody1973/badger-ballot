"use client";

import type { EndorsementData } from "@/types";

interface EndorsementCardProps {
  readonly data: EndorsementData;
}

export function EndorsementCard({ data }: EndorsementCardProps) {
  return (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span className="inline-block rounded-base border-2 border-border px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono mb-2 bg-[var(--party-d-bg)] text-[var(--party-d)]">
            ENDORSEMENT
          </span>
          <h4 className="text-sm font-heading text-foreground">{data.endorser}</h4>
          <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">
            {data.type}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {data.context}
          </p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          for {data.candidate}
        </span>
      </div>
    </div>
  );
}
