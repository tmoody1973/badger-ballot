"use client";

import type { Candidate } from "@/types";
import { getPartyConfig, getSeverityColor, getInitials } from "@/lib/party";

interface CandidateCardProps {
  readonly candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const party = getPartyConfig(candidate.party);
  const sevColor = getSeverityColor(candidate.severity);

  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow"
      role="article"
      aria-label={`${candidate.name}, ${candidate.party === "D" ? "Democrat" : candidate.party === "R" ? "Republican" : "Nonpartisan"}, ${candidate.office}`}
    >
      <div className="flex items-start gap-5">
        {/* Photo / Initials */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-base border-2 border-border"
          style={{ backgroundColor: party.bgLight }}
        >
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="text-xl font-bold font-mono"
              style={{ color: party.text, opacity: 0.7 }}
            >
              {getInitials(candidate.name, candidate.party)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <h3 className="text-lg font-heading text-foreground truncate">
              {candidate.name}
            </h3>
            <span
              className="shrink-0 rounded-base border-2 border-border px-2.5 py-0.5 text-xs font-bold tracking-wider font-mono"
              style={{ backgroundColor: party.bgLight, color: party.text }}
            >
              {party.label}
            </span>
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            {candidate.office} &middot; {candidate.currentRole}
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {candidate.keyFact}
          </p>
        </div>

        {/* Severity + findings count */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div
            className="h-4 w-4 rounded-full border-2 border-border"
            style={{ backgroundColor: sevColor }}
            role="img"
            aria-label={`${candidate.severity} severity`}
          />
          <span className="text-xs font-mono font-bold text-muted-foreground">
            {candidate.findings}
          </span>
        </div>
      </div>
    </div>
  );
}
