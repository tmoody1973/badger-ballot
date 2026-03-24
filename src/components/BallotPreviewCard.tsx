"use client";

interface BallotPreviewCardProps {
  readonly data: {
    address: string;
    rawContent: string;
    sourceUrl: string;
    nextElection: string;
    daysUntilElection: number;
  };
}

export function BallotPreviewCard({ data }: BallotPreviewCardProps) {
  // Parse ballot items from the structured output
  const lines = data.rawContent.split("\n").filter((l) => l.trim());

  return (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-base border-2 border-border bg-[var(--party-measure)] text-white text-xl">
          🗳️
        </div>
        <div>
          <h3 className="text-lg font-heading text-foreground">What&apos;s On Your Ballot</h3>
          <p className="text-xs font-mono text-muted-foreground">{data.address}</p>
        </div>
      </div>

      {/* Election info */}
      <div className="rounded-base border-2 border-border bg-wi-blue-light px-4 py-3 mb-4 flex justify-between items-center">
        <p className="text-sm font-heading text-wi-blue">{data.nextElection}</p>
        <span className="rounded-base border-2 border-wi-blue bg-wi-blue text-white px-3 py-1 text-sm font-mono font-bold">
          {data.daysUntilElection} days
        </span>
      </div>

      {/* Ballot items */}
      <div className="space-y-2">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Detect headers vs items
          const isHeader = /^\d+[\.\)]/
            .test(trimmed) || trimmed.endsWith(":") || trimmed.toUpperCase() === trimmed;

          return (
            <div
              key={i}
              className={`rounded-base border-2 border-border px-4 py-3 ${isHeader ? "bg-background font-heading text-foreground" : "bg-secondary-background text-muted-foreground text-sm"}`}
            >
              {trimmed}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t-2 border-border mt-4">
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="rounded-base border-2 border-border px-4 py-2 text-xs font-heading text-wi-blue hover:bg-wi-blue-light transition-colors">
          Full Ballot on MyVote →
        </a>
        <a href="https://myvote.wi.gov/en-us/Register-To-Vote" target="_blank" rel="noopener noreferrer"
          className="rounded-base border-2 border-border px-4 py-2 text-xs font-heading text-foreground hover:bg-background transition-colors">
          Register to Vote
        </a>
      </div>
    </div>
  );
}
