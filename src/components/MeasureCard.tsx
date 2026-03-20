"use client";

import type { MeasureData } from "@/types";

interface MeasureCardProps {
  readonly data: MeasureData;
}

export function MeasureCard({ data }: MeasureCardProps) {
  return (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
      <span className="inline-block rounded-base border-2 border-border px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono mb-3 bg-[var(--party-measure-bg)] text-[var(--party-measure)]">
        BALLOT MEASURE
      </span>

      <h4 className="text-sm font-heading text-foreground mb-2">{data.title}</h4>
      <p className="text-xs leading-relaxed text-muted-foreground mb-4">
        {data.summary}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* FOR */}
        <div className="rounded-base border-2 border-border p-3 bg-[#F0FDF4]">
          <p className="text-[10px] font-mono font-bold tracking-wider mb-2 text-[#166534]">
            FOR
          </p>
          <ul className="space-y-1.5">
            {data.forArguments.map((arg, i) => (
              <li key={i} className="text-[11px] leading-snug text-[#166534]">
                {arg}
              </li>
            ))}
          </ul>
        </div>

        {/* AGAINST */}
        <div className="rounded-base border-2 border-border p-3 bg-[#FEF2F2]">
          <p className="text-[10px] font-mono font-bold tracking-wider mb-2 text-[#991B1B]">
            AGAINST
          </p>
          <ul className="space-y-1.5">
            {data.againstArguments.map((arg, i) => (
              <li key={i} className="text-[11px] leading-snug text-[#991B1B]">
                {arg}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(data.sponsors || data.funding) && (
        <div className="mt-3 pt-3 border-t-2 border-border">
          {data.sponsors && (
            <p className="text-[10px] font-mono text-muted-foreground">
              Sponsors: {data.sponsors}
            </p>
          )}
          {data.funding && (
            <p className="text-[10px] font-mono mt-0.5 text-muted-foreground">
              Funding: {data.funding}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
