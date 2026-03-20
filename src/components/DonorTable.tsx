"use client";

import type { DonorTableData } from "@/types";
import { CitationLink } from "./CitationLink";

interface DonorTableProps {
  readonly data: DonorTableData;
}

export function DonorTable({ data }: DonorTableProps) {
  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
      role="article"
      aria-label={`Campaign donors for ${data.candidate}`}
    >
      <div className="flex justify-between items-baseline mb-4">
        <span className="rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono bg-[var(--party-measure-bg)] text-[var(--party-measure)]">
          DONORS
        </span>
        <span className="text-xs text-muted-foreground">
          <CitationLink source={data.source} sourceUrl={data.sourceUrl} />
        </span>
      </div>

      {data.totalRaised && (
        <p className="text-2xl font-mono font-heading mb-4 text-foreground">
          {data.totalRaised}
        </p>
      )}

      <div className="space-y-2.5">
        {data.donors.map((donor, i) => (
          <div
            key={`${donor.name}-${i}`}
            className="flex justify-between items-center rounded-base border-2 border-border px-4 py-3 bg-background"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {donor.name}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {donor.type} &middot; {donor.cycle}
              </p>
            </div>
            <span className="shrink-0 ml-4 text-base font-mono font-bold text-foreground">
              {donor.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
