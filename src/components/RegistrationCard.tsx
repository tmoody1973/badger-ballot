"use client";

interface RegistrationCardProps {
  readonly data: {
    address: string;
    rawContent: string;
    sourceUrl: string;
    nextElection: string;
    daysUntilElection: number;
  };
}

export function RegistrationCard({ data }: RegistrationCardProps) {
  const content = data.rawContent.toLowerCase();
  const isRegistered = content.includes("registered") && !content.includes("not registered") && !content.includes("not found");

  return (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-base border-2 border-border text-xl"
          style={{ backgroundColor: isRegistered ? "#F0FDF4" : "#FEF2F2" }}>
          {isRegistered ? "✅" : "⚠️"}
        </div>
        <div>
          <h3 className="text-lg font-heading text-foreground">Voter Registration</h3>
          <p className="text-xs font-mono text-muted-foreground">{data.address}</p>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-base border-2 border-border px-4 py-4 mb-4"
        style={{ backgroundColor: isRegistered ? "#F0FDF4" : "#FEF2F2" }}>
        <p className="text-base font-heading" style={{ color: isRegistered ? "#166534" : "#991B1B" }}>
          {isRegistered ? "You are registered to vote!" : "Registration status unclear — check MyVote directly"}
        </p>
      </div>

      {/* Details */}
      <div className="rounded-base border-2 border-border bg-background p-4 mb-4">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.rawContent}</p>
      </div>

      {/* Key info */}
      <div className="rounded-base border-2 border-border bg-wi-blue-light px-4 py-3 mb-4">
        <p className="text-sm text-wi-blue">
          <strong>Wisconsin allows Election Day registration.</strong> Bring a photo ID and proof of residence to register at your polling place on April 7.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t-2 border-border">
        <a href="https://myvote.wi.gov/en-us/Register-To-Vote" target="_blank" rel="noopener noreferrer"
          className="rounded-base border-2 border-border px-4 py-2 text-xs font-heading text-wi-blue hover:bg-wi-blue-light transition-colors">
          Register Online →
        </a>
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="rounded-base border-2 border-border px-4 py-2 text-xs font-heading text-foreground hover:bg-background transition-colors">
          Check on MyVote
        </a>
      </div>
    </div>
  );
}
