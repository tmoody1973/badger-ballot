"use client";

import { useRef } from "react";
import type { Candidate } from "@/types";
import { getPartyConfig, getSeverityColor } from "@/lib/party";
import { CANDIDATES } from "@/data/candidates";

interface RaceComparisonProps {
  readonly raceCategory: string;
  readonly office: string;
  readonly onSelectCandidate?: (id: string) => void;
}

export function RaceComparison({ raceCategory, office, onSelectCandidate }: RaceComparisonProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get all candidates in this race
  const candidates = CANDIDATES.filter(
    (c) => c.raceCategory === raceCategory && (office ? c.office === office : true),
  );

  if (candidates.length < 2) return null;

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <h3 className="text-sm font-heading tracking-wider text-muted-foreground uppercase">
            {office || raceCategory} — Compare Candidates
          </h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll("left")} className="rounded-base border-2 border-border w-8 h-8 flex items-center justify-center text-xs hover:bg-background">←</button>
          <button onClick={() => scroll("right")} className="rounded-base border-2 border-border w-8 h-8 flex items-center justify-center text-xs hover:bg-background">→</button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {candidates.map((candidate) => (
          <CandidateScorecard
            key={candidate.id}
            candidate={candidate}
            onSelect={onSelectCandidate}
          />
        ))}
      </div>
    </div>
  );
}

function CandidateScorecard({
  candidate,
  onSelect,
}: {
  candidate: Candidate;
  onSelect?: (id: string) => void;
}) {
  const party = getPartyConfig(candidate.party);
  const sevColor = getSeverityColor(candidate.severity);

  return (
    <button
      onClick={() => onSelect?.(candidate.id)}
      className="snap-start shrink-0 w-64 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow text-left transition-all hover:shadow-none hover:translate-x-boxShadowX hover:translate-y-boxShadowY"
    >
      {/* Top: photo + name */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-base border-2 border-border overflow-hidden"
          style={{ backgroundColor: party.bgLight }}
        >
          {candidate.photoUrl ? (
            <img src={candidate.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold font-mono" style={{ color: party.text }}>
              {candidate.name.split(" ").map((w) => w[0]).join("")}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-heading text-foreground truncate">{candidate.name}</h4>
          <span
            className="inline-block rounded-base border border-border px-1.5 py-0.5 text-[9px] font-bold tracking-wider font-mono mt-0.5"
            style={{ backgroundColor: party.bgLight, color: party.text }}
          >
            {party.label}
          </span>
        </div>
      </div>

      {/* Scorecard metrics */}
      <div className="space-y-2.5">
        {/* Current role */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-muted-foreground">Role</span>
          <span className="text-xs font-heading text-foreground truncate ml-2">{candidate.currentRole}</span>
        </div>

        {/* Key fact */}
        <div>
          <span className="text-[10px] font-mono text-muted-foreground">Key fact</span>
          <p className="text-xs text-foreground mt-0.5 leading-relaxed">{candidate.keyFact}</p>
        </div>

        {/* Findings bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-muted-foreground">Findings</span>
            <span className="text-xs font-mono font-bold">{candidate.findings}</span>
          </div>
          <div className="h-2 rounded-full bg-background border border-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((candidate.findings / 10) * 100, 100)}%`,
                backgroundColor: sevColor,
              }}
            />
          </div>
        </div>

        {/* Severity */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-muted-foreground">Priority</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: sevColor }} />
            <span className="text-xs font-mono capitalize">{candidate.severity}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 pt-3 border-t-2 border-border text-center">
        <span className="text-xs font-heading text-wi-blue">Pull the receipts →</span>
      </div>
    </button>
  );
}
