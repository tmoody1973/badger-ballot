"use client";

import type { Candidate } from "@/types";
import { getPartyConfig, getSeverityColor, getInitials } from "@/lib/party";

interface MiniCardProps {
  readonly candidate: Candidate;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}

function MiniCard({ candidate, isSelected, onClick }: MiniCardProps) {
  const party = getPartyConfig(candidate.party);
  const sevColor = getSeverityColor(candidate.severity);

  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${candidate.name}, ${candidate.office}`}
      className="w-full text-left rounded-base border-2 px-3.5 py-3 transition-all duration-150"
      style={{
        borderColor: isSelected ? party.bg : "var(--border)",
        backgroundColor: isSelected ? party.bgLight : "var(--secondary-background)",
        boxShadow: isSelected ? `3px 3px 0px 0px ${party.bg}` : "none",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-base border-2 border-border"
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
              className="text-sm font-bold font-mono"
              style={{ color: party.text, opacity: 0.6 }}
            >
              {getInitials(candidate.name, candidate.party)}
            </span>
          )}
        </div>

        {/* Name + office */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-heading text-foreground truncate">
              {candidate.name}
            </span>
            <span
              className="shrink-0 text-[9px] font-bold tracking-widest font-mono"
              style={{ color: party.text }}
            >
              {party.label}
            </span>
          </div>
          <p className="text-xs font-mono mt-0.5 text-muted-foreground">
            {candidate.office}
          </p>
        </div>

        {/* Severity dot + count */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full border border-border"
            style={{ backgroundColor: sevColor }}
            role="img"
            aria-label={`${candidate.severity} priority`}
          />
          <span className="text-[9px] font-mono text-muted-foreground">
            {candidate.findings}
          </span>
        </div>
      </div>
    </button>
  );
}

interface CandidateDirectoryProps {
  readonly candidates: readonly Candidate[];
  readonly selected: string | null;
  readonly onSelect: (id: string) => void;
}

export function CandidateDirectory({ candidates, selected, onSelect }: CandidateDirectoryProps) {
  return (
    <nav
      className="flex h-full flex-col overflow-hidden border-r-2 border-border bg-secondary-background"
      aria-label="Candidate directory"
    >
      {/* Count */}
      <div className="px-3 pt-3 pb-2">
        <span className="text-xs font-mono font-heading tracking-wider text-muted-foreground">
          {candidates.length} RACE{candidates.length !== 1 ? "S" : ""}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5" role="list">
        {candidates.map((c) => (
          <div key={c.id} role="listitem">
            <MiniCard
              candidate={c}
              isSelected={selected === c.id}
              onClick={() => onSelect(c.id)}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-border px-3 py-2.5 text-center">
        <span className="text-[9px] font-mono text-muted-foreground tracking-wide">
          CONGRESS.GOV &middot; OPENSECRETS &middot; POLITIFACT &middot; FIRECRAWL
        </span>
      </div>
    </nav>
  );
}
