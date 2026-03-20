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
    <div className="animate-slide-up rounded-xl border bg-surface p-5 shadow-sm"
         style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start gap-4">
        {/* Photo / Initials */}
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ backgroundColor: party.bgLight }}
        >
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={candidate.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="text-lg font-bold font-mono"
              style={{ color: party.text, opacity: 0.6 }}
            >
              {getInitials(candidate.name, candidate.party)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
              {candidate.name}
            </h3>
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono"
              style={{ backgroundColor: party.bgLight, color: party.text }}
            >
              {party.label}
            </span>
          </div>
          <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
            {candidate.office} &middot; {candidate.currentRole}
          </p>
          <p className="mt-1.5 text-sm italic" style={{ color: "var(--text-secondary)" }}>
            {candidate.keyFact}
          </p>
        </div>

        {/* Severity + findings count */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: sevColor }}
            title={`${candidate.severity} severity`}
          />
          <span className="text-[10px] font-mono font-bold" style={{ color: "var(--text-secondary)" }}>
            {candidate.findings}
          </span>
        </div>
      </div>
    </div>
  );
}
