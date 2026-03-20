"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { CANDIDATES } from "@/data/candidates";
import type { FilterKey } from "@/data/candidates";
import type { RenderedComponent, Candidate } from "@/types";
import { CandidateDirectory } from "@/components/CandidateDirectory";
import { ComponentRenderer } from "@/components/ComponentRenderer";
import { VoiceBar } from "@/components/VoiceBar";
import { RaceFilter } from "@/components/RaceFilter";

interface ReceiptsResponse {
  candidate?: {
    name: string;
    party: string;
    office: string;
    currentRole: string;
    keyFact: string;
    type: string;
  };
  votes?: Array<{
    bill: string;
    vote: string;
    context: string;
    date?: string;
    source: string;
    sourceUrl?: string;
  }>;
  donors?: {
    donors: Array<{ name: string; amount: string; type: string; cycle: string }>;
    totalRaised?: string;
    source: string;
    sourceUrl?: string;
  } | null;
  factChecks?: Array<{
    claim: string;
    rating: string;
    source: string;
    sourceUrl?: string;
    year: string;
  }>;
  endorsements?: Array<{
    endorser: string;
    type: string;
    context: string;
    sourceUrl?: string;
  }>;
  summary?: {
    officialSources: number;
    newsSources: number;
    factCheckSources: number;
    keyFinding: string;
  };
  source_count?: number;
  error?: string;
}

function buildComponentsFromResponse(
  response: ReceiptsResponse,
  candidateData: Candidate,
): RenderedComponent[] {
  const result: RenderedComponent[] = [];

  // Always show candidate card first
  result.push({ type: "candidate", data: candidateData });

  // Add votes
  if (response.votes) {
    for (const vote of response.votes) {
      result.push({
        type: "vote",
        data: { ...vote, candidate: candidateData.name },
      });
    }
  }

  // Add donors
  if (response.donors && response.donors.donors.length > 0) {
    result.push({
      type: "donors",
      data: {
        candidate: candidateData.name,
        donors: response.donors.donors,
        totalRaised: response.donors.totalRaised,
        source: response.donors.source,
        sourceUrl: response.donors.sourceUrl,
      },
    });
  }

  // Add fact checks
  if (response.factChecks) {
    for (const fc of response.factChecks) {
      result.push({
        type: "factCheck",
        data: { ...fc, candidate: candidateData.name },
      });
    }
  }

  // Add endorsements
  if (response.endorsements) {
    for (const endorsement of response.endorsements) {
      result.push({
        type: "endorsement",
        data: { ...endorsement, candidate: candidateData.name },
      });
    }
  }

  return result;
}

export default function BallotBadger() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [components, setComponents] = useState<RenderedComponent[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return CANDIDATES;
    return CANDIDATES.filter((c) => c.raceCategory === filter);
  }, [filter]);

  const selectedCandidate = useMemo(
    () => CANDIDATES.find((c) => c.id === selected) ?? null,
    [selected],
  );

  function handleSelect(id: string) {
    setSelected(id);
    setIsActive(false);
    setIsLoading(false);
    setComponents([]);
    setStatusText(null);
  }

  const pullReceipts = useCallback(async (candidate: Candidate) => {
    setIsLoading(true);
    setIsActive(true);
    setComponents([{ type: "candidate", data: candidate }]);
    setStatusText("Digging into the records...");

    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate: candidate.id }),
      });

      const data: ReceiptsResponse = await response.json();

      if (data.error) {
        setStatusText(`Error: ${data.error}`);
        setIsLoading(false);
        return;
      }

      // Build components from the response
      const newComponents = buildComponentsFromResponse(data, candidate);

      // Stagger the component reveals for visual effect
      setComponents([newComponents[0]]);

      for (let i = 1; i < newComponents.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setComponents((prev) => [...prev, newComponents[i]]);

        // Auto-scroll to latest component
        if (mainRef.current) {
          mainRef.current.scrollTop = mainRef.current.scrollHeight;
        }
      }

      const sourceCount = data.source_count ?? 0;
      setStatusText(
        `Found ${sourceCount} sources. Say "go deeper" or ask a follow-up.`,
      );
    } catch {
      setStatusText("Search failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleToggleVoice() {
    if (!selectedCandidate) return;

    if (isActive) {
      setIsActive(false);
      setStatusText(null);
      return;
    }

    pullReceipts(selectedCandidate);
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-4 border-b-2 border-border px-5 py-2 shrink-0 bg-wi-blue-light">
        <img
          src="/branding/badger-ballot-logo.svg"
          alt="Ballot Badger"
          className="h-[84px] object-contain"
        />

        <div className="flex-1" />

        {/* Neobrutalism navigation menu as filter bar */}
        <RaceFilter filter={filter} onFilterChange={setFilter} />
      </header>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: directory */}
        <aside className="w-80 shrink-0">
          <CandidateDirectory
            candidates={filtered}
            selected={selected}
            onSelect={handleSelect}
          />
        </aside>

        {/* Right: component render area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          {isLoading && components.length <= 1 && (
            <div className="flex items-center justify-center p-8 gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-wi-blue border-t-transparent" />
              <span className="text-sm font-mono text-muted-foreground">
                Searching public records, news, and campaign finance data...
              </span>
            </div>
          )}
          <ComponentRenderer components={components} />
        </main>
      </div>

      {/* Bottom: voice bar */}
      <VoiceBar
        isActive={isActive}
        selectedName={selectedCandidate?.name ?? null}
        onToggle={handleToggleVoice}
        statusText={statusText}
        isLoading={isLoading}
      />
    </div>
  );
}
