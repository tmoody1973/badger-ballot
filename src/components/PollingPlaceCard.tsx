"use client";

interface PollingPlaceCardProps {
  readonly data: {
    address: string;
    rawContent: string;
    sourceUrl: string;
    nextElection: string;
    daysUntilElection: number;
  };
}

export function PollingPlaceCard({ data }: PollingPlaceCardProps) {
  // Parse the structured output from Firecrawl interact
  const lines = data.rawContent.split("\n").filter((l) => l.trim());
  const getValue = (label: string) => {
    const line = lines.find((l) => l.toLowerCase().includes(label.toLowerCase()));
    return line?.split(":").slice(1).join(":").trim() ?? "";
  };

  const placeName = getValue("Polling Place Name") || getValue("Name");
  const placeAddress = getValue("Polling Place Address") || getValue("Address");
  const hours = getValue("Hours") || getValue("Polling Place Hours");
  const ward = getValue("Ward");

  return (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-base border-2 border-border bg-wi-blue text-white text-xl">
          📍
        </div>
        <div>
          <h3 className="text-lg font-heading text-foreground">Your Polling Place</h3>
          <p className="text-xs font-mono text-muted-foreground">{data.address}</p>
        </div>
      </div>

      {/* Election countdown */}
      <div className="rounded-base border-2 border-border bg-wi-blue-light px-4 py-3 mb-4 flex justify-between items-center">
        <p className="text-sm font-heading text-wi-blue">{data.nextElection}</p>
        <span className="rounded-base border-2 border-wi-blue bg-wi-blue text-white px-3 py-1 text-sm font-mono font-bold">
          {data.daysUntilElection} days
        </span>
      </div>

      {/* Polling place details */}
      {placeName && (
        <div className="rounded-base border-2 border-border bg-background px-4 py-4 mb-4">
          <p className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground mb-2">POLLING PLACE</p>
          <p className="text-lg font-heading text-foreground">{placeName}</p>
          {placeAddress && <p className="text-sm text-muted-foreground mt-1">{placeAddress}</p>}
          {hours && <p className="text-sm font-mono text-wi-blue mt-2">🕐 {hours}</p>}
          {ward && <p className="text-xs font-mono text-muted-foreground mt-1">{ward}</p>}
        </div>
      )}

      {/* Raw content fallback */}
      {!placeName && data.rawContent && (
        <div className="rounded-base border-2 border-border bg-background p-4 mb-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.rawContent}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t-2 border-border">
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="rounded-base border-2 border-border px-4 py-2 text-xs font-heading text-wi-blue hover:bg-wi-blue-light transition-colors">
          Verify on MyVote →
        </a>
        <a href="https://myvote.wi.gov/en-us/Vote-Absentee-By-Mail" target="_blank" rel="noopener noreferrer"
          className="rounded-base border-2 border-border px-4 py-2 text-xs font-heading text-foreground hover:bg-background transition-colors">
          Vote Absentee
        </a>
      </div>
    </div>
  );
}
