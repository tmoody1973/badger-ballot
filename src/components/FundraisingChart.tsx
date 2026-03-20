"use client";

interface FundraisingBar {
  readonly name: string;
  readonly amount: number;
  readonly party: string;
  readonly label: string;
}

interface FundraisingChartProps {
  readonly data: {
    readonly title: string;
    readonly bars: readonly FundraisingBar[];
    readonly source?: string;
    readonly sourceUrl?: string;
  };
}

function getPartyColor(party: string): string {
  switch (party.charAt(0).toUpperCase()) {
    case "R": return "var(--party-r)";
    case "D": return "var(--party-d)";
    default: return "var(--party-nonpartisan)";
  }
}

function getPartyBg(party: string): string {
  switch (party.charAt(0).toUpperCase()) {
    case "R": return "var(--party-r-bg)";
    case "D": return "var(--party-d-bg)";
    default: return "var(--party-nonpartisan-bg)";
  }
}

export function FundraisingChart({ data }: FundraisingChartProps) {
  const maxAmount = Math.max(...data.bars.map((b) => b.amount), 1);

  return (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-heading tracking-wider uppercase text-foreground">
          {data.title}
        </h3>
      </div>

      <div className="space-y-3">
        {data.bars.map((bar) => {
          const widthPercent = Math.max((bar.amount / maxAmount) * 100, 4);
          const color = getPartyColor(bar.party);
          const bg = getPartyBg(bar.party);

          return (
            <div key={bar.name} className="group">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-heading text-foreground">
                  {bar.name}
                </span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {bar.label}
                </span>
              </div>
              <div
                className="h-8 rounded-base border-2 border-border overflow-hidden"
                style={{ backgroundColor: bg }}
              >
                <div
                  className="h-full rounded-base transition-all duration-1000 ease-out flex items-center px-2"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                    minWidth: "20px",
                  }}
                >
                  <span
                    className="text-[10px] font-mono font-bold text-white whitespace-nowrap"
                    style={{ opacity: widthPercent > 15 ? 1 : 0 }}
                  >
                    {bar.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.source && (
        <p className="mt-3 text-[10px] font-mono text-muted-foreground">
          Source: {data.source}
        </p>
      )}
    </div>
  );
}
