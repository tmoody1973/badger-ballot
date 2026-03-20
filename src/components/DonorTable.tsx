"use client";

import type { DonorTableData } from "@/types";

interface DonorTableProps {
  readonly data: DonorTableData;
}

export function DonorTable({ data }: DonorTableProps) {
  return (
    <div className="animate-slide-up rounded-xl border bg-surface p-4 shadow-sm"
         style={{ borderColor: "var(--border)" }}>
      <div className="flex justify-between items-baseline mb-3">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono"
          style={{ backgroundColor: "var(--party-measure-bg)", color: "var(--party-measure)" }}
        >
          DONORS
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
          {data.source}
        </span>
      </div>

      {data.totalRaised && (
        <p className="text-xl font-mono font-bold mb-3 text-[var(--text-primary)]">
          {data.totalRaised}
        </p>
      )}

      <div className="space-y-2">
        {data.donors.map((donor, i) => (
          <div
            key={`${donor.name}-${i}`}
            className="flex justify-between items-center rounded-lg border px-3 py-2.5"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {donor.name}
              </p>
              <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
                {donor.type} &middot; {donor.cycle}
              </p>
            </div>
            <span className="shrink-0 ml-3 text-sm font-mono font-bold text-[var(--text-primary)]">
              {donor.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
