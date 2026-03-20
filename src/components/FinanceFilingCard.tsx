"use client";

import { CitationLink } from "./CitationLink";

interface FinanceFilingData {
  readonly candidate: string;
  readonly content: string;
  readonly source: string;
  readonly sourceUrl?: string;
}

interface FinanceFilingCardProps {
  readonly data: FinanceFilingData;
}

export function FinanceFilingCard({ data }: FinanceFilingCardProps) {
  // Parse dollar amounts from content for highlighting
  const lines = data.content.split("\n").filter((l) => l.trim().length > 10);

  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
      role="article"
      aria-label={`Official campaign finance filing for ${data.candidate}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏛️</span>
        <span className="rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono bg-wi-blue-light text-wi-blue">
          OFFICIAL FILING
        </span>
        <span className="text-xs text-muted-foreground">
          <CitationLink source={data.source} sourceUrl={data.sourceUrl} />
        </span>
      </div>

      <h4 className="text-base font-heading text-foreground mb-3">
        {data.candidate} — Campaign Finance Records
      </h4>

      <div className="rounded-base border-2 border-border bg-background p-4 max-h-64 overflow-y-auto">
        <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
          {lines.slice(0, 30).map((line, i) => {
            // Highlight lines with dollar amounts
            const hasMoney = /\$[\d,]+/.test(line);
            return (
              <div
                key={i}
                className={hasMoney ? "text-foreground font-bold" : ""}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[10px] font-mono text-muted-foreground">
        Data from Wisconsin Ethics Commission · campaignfinance.wi.gov
      </p>
    </div>
  );
}
