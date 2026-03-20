"use client";

interface VoterInfoData {
  readonly address: string;
  readonly content: string;
  readonly source: string;
  readonly sourceUrl?: string;
}

interface VoterInfoCardProps {
  readonly data: VoterInfoData;
}

export function VoterInfoCard({ data }: VoterInfoCardProps) {
  const lines = data.content.split("\n").filter((l) => l.trim().length > 5);

  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
      role="article"
      aria-label={`Voter information for ${data.address}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🗳️</span>
        <span className="rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono bg-[var(--status-success)] text-white">
          VOTER INFO
        </span>
      </div>

      <h4 className="text-base font-heading text-foreground mb-1">
        Your Voter Information
      </h4>
      <p className="text-sm font-mono text-muted-foreground mb-3">
        {data.address}
      </p>

      <div className="rounded-base border-2 border-border bg-background p-4 max-h-64 overflow-y-auto">
        <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {lines.slice(0, 25).map((line, i) => {
            const isHeading = line.length < 50 && !line.includes("•");
            return (
              <div
                key={i}
                className={isHeading ? "font-heading text-foreground mt-2" : ""}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <p className="text-[10px] font-mono text-muted-foreground">
          Data from myvote.wi.gov · Always confirm at your official polling place
        </p>
        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-wi-blue hover:underline"
          >
            Verify →
          </a>
        )}
      </div>
    </div>
  );
}
