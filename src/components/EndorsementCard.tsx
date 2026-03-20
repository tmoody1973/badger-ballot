"use client";

import type { EndorsementData } from "@/types";

interface EndorsementCardProps {
  readonly data: EndorsementData;
}

export function EndorsementCard({ data }: EndorsementCardProps) {
  return (
    <div className="animate-slide-up rounded-xl border bg-surface p-4 shadow-sm"
         style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span
            className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono mb-2"
            style={{ backgroundColor: "var(--party-d-bg)", color: "var(--party-d)" }}
          >
            ENDORSEMENT
          </span>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{data.endorser}</h4>
          <p className="mt-0.5 text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
            {data.type}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {data.context}
          </p>
        </div>
        <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
          for {data.candidate}
        </span>
      </div>
    </div>
  );
}
