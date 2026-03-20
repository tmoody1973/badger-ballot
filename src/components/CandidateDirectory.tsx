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
      className="w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150 hover:shadow-sm"
      style={{
        borderColor: isSelected ? party.bg : "var(--border)",
        backgroundColor: isSelected ? party.bgLight : "var(--surface)",
      }}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md"
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
              className="text-xs font-bold font-mono"
              style={{ color: party.text, opacity: 0.5 }}
            >
              {getInitials(candidate.name, candidate.party)}
            </span>
          )}
        </div>

        {/* Name + office */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
              {candidate.name}
            </span>
            <span
              className="shrink-0 text-[8px] font-bold tracking-widest font-mono"
              style={{ color: party.text }}
            >
              {party.label}
            </span>
          </div>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {candidate.office}
          </p>
        </div>

        {/* Severity dot + count */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: sevColor }}
          />
          <span className="text-[8px] font-mono" style={{ color: "var(--text-secondary)" }}>
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
    <div className="flex h-full flex-col overflow-hidden border-r" style={{ borderColor: "var(--border)" }}>
      {/* Count */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-mono font-semibold tracking-wider" style={{ color: "var(--text-secondary)" }}>
          {candidates.length} RACE{candidates.length !== 1 ? "S" : ""}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {candidates.map((c) => (
          <MiniCard
            key={c.id}
            candidate={c}
            isSelected={selected === c.id}
            onClick={() => onSelect(c.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t px-3 py-2 text-center" style={{ borderColor: "var(--border)" }}>
        <span className="text-[8px] font-mono" style={{ color: "var(--text-secondary)" }}>
          CONGRESS.GOV &middot; OPENSECRETS &middot; POLITIFACT &middot; FIRECRAWL
        </span>
      </div>
    </div>
  );
}
