"use client";

interface PollingPlace {
  readonly name: string;
  readonly address: string;
  readonly hours?: string;
}

interface BallotItem {
  readonly race: string;
  readonly candidates: string[];
}

interface VoterServicesData {
  readonly address: string;
  readonly pollingPlace?: PollingPlace;
  readonly isRegistered?: boolean;
  readonly ballotItems?: readonly BallotItem[];
  readonly nextElection?: string;
  readonly rawContent?: string;
  readonly sourceUrl?: string;
}

interface VoterServicesCardProps {
  readonly data: VoterServicesData;
}

export function VoterServicesCard({ data }: VoterServicesCardProps) {
  return (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-base border-2 border-border bg-[var(--status-success)] text-white text-xl">
          🗳️
        </div>
        <div>
          <h3 className="text-lg font-heading text-foreground">Your Voter Info</h3>
          <p className="text-xs font-mono text-muted-foreground">{data.address}</p>
        </div>
      </div>

      {/* Next Election Banner */}
      {data.nextElection && (
        <div className="rounded-base border-2 border-border bg-wi-blue-light px-4 py-3 mb-4">
          <p className="text-sm font-heading text-wi-blue">Next Election: {data.nextElection}</p>
        </div>
      )}

      {/* Registration Status */}
      {data.isRegistered !== undefined && (
        <div className="rounded-base border-2 border-border px-4 py-3 mb-4" style={{
          backgroundColor: data.isRegistered ? "#F0FDF4" : "#FEF2F2",
        }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.isRegistered ? "✅" : "⚠️"}</span>
            <p className="text-sm font-heading" style={{
              color: data.isRegistered ? "#166534" : "#991B1B",
            }}>
              {data.isRegistered ? "You are registered to vote" : "Registration not found — you can register on Election Day"}
            </p>
          </div>
        </div>
      )}

      {/* Polling Place */}
      {data.pollingPlace && (
        <div className="rounded-base border-2 border-border bg-background px-4 py-4 mb-4">
          <p className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground mb-2">YOUR POLLING PLACE</p>
          <p className="text-base font-heading text-foreground">{data.pollingPlace.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{data.pollingPlace.address}</p>
          {data.pollingPlace.hours && (
            <p className="text-xs font-mono text-muted-foreground mt-2">Hours: {data.pollingPlace.hours}</p>
          )}
        </div>
      )}

      {/* What's On Your Ballot */}
      {data.ballotItems && data.ballotItems.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground mb-3">WHAT'S ON YOUR BALLOT</p>
          <div className="space-y-2">
            {data.ballotItems.map((item, i) => (
              <div key={i} className="rounded-base border-2 border-border bg-background px-4 py-3">
                <p className="text-sm font-heading text-foreground">{item.race}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {item.candidates.map((c, j) => (
                    <span key={j} className="rounded-base border border-border px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw content fallback */}
      {!data.pollingPlace && !data.ballotItems && data.rawContent && (
        <div className="rounded-base border-2 border-border bg-background p-4 max-h-48 overflow-y-auto mb-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.rawContent.slice(0, 1500)}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-border">
        <p className="text-[9px] font-mono text-muted-foreground">
          Source: MyVote Wisconsin (myvote.wi.gov)
        </p>
        <div className="flex gap-2">
          {data.sourceUrl && (
            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="rounded-base border-2 border-border px-3 py-1 text-xs font-heading text-wi-blue hover:bg-wi-blue-light">
              Verify →
            </a>
          )}
          <a href="https://myvote.wi.gov/en-US/RegisterToVote" target="_blank" rel="noopener noreferrer"
            className="rounded-base border-2 border-border px-3 py-1 text-xs font-heading text-foreground hover:bg-background">
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
