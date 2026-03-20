"use client";

import type { MeasureData } from "@/types";

interface MeasureCardProps {
  readonly data: MeasureData;
}

export function MeasureCard({ data }: MeasureCardProps) {
  return (
    <div className="animate-slide-up rounded-xl border bg-surface p-5 shadow-sm"
         style={{ borderColor: "var(--border)" }}>
      <span
        className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono mb-3"
        style={{ backgroundColor: "var(--party-measure-bg)", color: "var(--party-measure)" }}
      >
        BALLOT MEASURE
      </span>

      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2">{data.title}</h4>
      <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        {data.summary}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* FOR */}
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }}
        >
          <p className="text-[10px] font-mono font-bold tracking-wider mb-2" style={{ color: "#166534" }}>
            FOR
          </p>
          <ul className="space-y-1.5">
            {data.forArguments.map((arg, i) => (
              <li key={i} className="text-[11px] leading-snug" style={{ color: "#166534" }}>
                {arg}
              </li>
            ))}
          </ul>
        </div>

        {/* AGAINST */}
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}
        >
          <p className="text-[10px] font-mono font-bold tracking-wider mb-2" style={{ color: "#991B1B" }}>
            AGAINST
          </p>
          <ul className="space-y-1.5">
            {data.againstArguments.map((arg, i) => (
              <li key={i} className="text-[11px] leading-snug" style={{ color: "#991B1B" }}>
                {arg}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(data.sponsors || data.funding) && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          {data.sponsors && (
            <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
              Sponsors: {data.sponsors}
            </p>
          )}
          {data.funding && (
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Funding: {data.funding}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
