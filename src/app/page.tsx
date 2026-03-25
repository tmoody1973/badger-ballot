"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { CANDIDATES } from "@/data/candidates";
import type { FilterKey } from "@/data/candidates";
import type { RenderedComponent, Candidate } from "@/types";
import { CandidateDirectory } from "@/components/CandidateDirectory";
import { ComponentRenderer } from "@/components/ComponentRenderer";
import { VoiceBar } from "@/components/VoiceBar";
import { RaceFilter } from "@/components/RaceFilter";
import { DiggingProgress } from "@/components/DiggingProgress";
import { VoiceActiveState } from "@/components/VoiceActiveState";
import { useVoiceAgent } from "@/lib/useVoiceAgent";

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
  platform?: Array<{
    issue: string;
    position: string;
    source: string;
    sourceUrl?: string;
  }>;
  news?: Array<{
    headline: string;
    source: string;
    sourceUrl?: string;
    date?: string;
    summary: string;
  }>;
  summary?: {
    officialSources: number;
    newsSources: number;
    factCheckSources: number;
    keyFinding: string;
  };
  source_count?: number;
  openui?: string;
  error?: string;
}

function buildComponentsFromResponse(
  response: ReceiptsResponse,
  candidateData: Candidate,
): RenderedComponent[] {
  const result: RenderedComponent[] = [];

  result.push({ type: "candidate", data: candidateData });

  // Show race comparison carousel if this race has multiple candidates
  const racemates = CANDIDATES.filter(
    (c) => c.office === candidateData.office && c.id !== candidateData.id,
  );
  if (racemates.length > 0) {
    result.push({
      type: "raceComparison",
      data: { raceCategory: candidateData.raceCategory, office: candidateData.office },
    });
  }

  if (response.votes) {
    for (const vote of response.votes) {
      result.push({
        type: "vote",
        data: { ...vote, candidate: candidateData.name },
      });
    }
  }

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

    const chartBars = response.donors.donors
      .filter((d) => d.amount && d.amount.startsWith("$"))
      .map((d) => ({
        name: d.name,
        amount: parseInt(d.amount.replace(/[$,]/g, ""), 10) || 0,
        party: candidateData.party === "R" ? "R" : candidateData.party === "D" ? "D" : "NP",
        label: d.amount,
      }))
      .filter((b) => b.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    if (chartBars.length >= 2) {
      result.push({
        type: "fundraisingChart",
        data: {
          title: `Top Donors — ${candidateData.name}`,
          bars: chartBars,
          source: response.donors.source,
          sourceUrl: response.donors.sourceUrl,
        },
      });
    }
  }

  if (response.factChecks) {
    for (const fc of response.factChecks) {
      result.push({
        type: "factCheck",
        data: { ...fc, candidate: candidateData.name },
      });
    }
  }

  if (response.endorsements) {
    for (const endorsement of response.endorsements) {
      result.push({
        type: "endorsement",
        data: { ...endorsement, candidate: candidateData.name },
      });
    }
  }

  if (response.platform) {
    for (const position of response.platform) {
      result.push({
        type: "platform",
        data: { ...position, candidate: candidateData.name },
      });
    }
  }

  if (response.news) {
    for (const article of response.news) {
      result.push({
        type: "news",
        data: { ...article, candidate: candidateData.name },
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
  const [voiceMode, setVoiceMode] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchInProgressRef = useRef<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return CANDIDATES;
    return CANDIDATES.filter((c) => c.raceCategory === filter);
  }, [filter]);

  const selectedCandidate = useMemo(
    () => CANDIDATES.find((c) => c.id === selected) ?? null,
    [selected],
  );

  // === SINGLE search function used by ALL paths ===
  const runSearch = useCallback(async (candidate: Candidate) => {
    // Prevent duplicate searches for the same candidate
    if (searchInProgressRef.current === candidate.id) return;
    searchInProgressRef.current = candidate.id;

    setSelected(candidate.id);
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
        return;
      }

      const newComponents = buildComponentsFromResponse(data, candidate);

      // Stagger component reveals
      setComponents([newComponents[0]]);
      for (let i = 1; i < newComponents.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setComponents((prev) => [...prev, newComponents[i]]);
        if (mainRef.current) {
          mainRef.current.scrollTop = mainRef.current.scrollHeight;
        }
      }

      const sourceCount = data.source_count ?? 0;
      setStatusText(`Found ${sourceCount} sources. Say "go deeper" or ask a follow-up.`);
    } catch {
      setStatusText("Search failed. Try again.");
    } finally {
      setIsLoading(false);
      searchInProgressRef.current = null;
    }
  }, []);

  // === Voice agent callbacks ===
  const handleComponentAdd = useCallback((component: RenderedComponent) => {
    setComponents((prev) => [...prev, component]);
    setTimeout(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = mainRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const handleVoiceStatusChange = useCallback((status: string) => {
    setStatusText(status);
  }, []);

  // When voice agent selects a candidate → run search
  const handleVoiceSelectCandidate = useCallback((id: string) => {
    const candidate = CANDIDATES.find((c) => c.id === id);
    if (candidate) {
      runSearch(candidate);
    }
  }, [runSearch]);

  const handleVoiceSetFilter = useCallback((f: string) => {
    setFilter(f as FilterKey);
  }, []);

  const handleVoiceClearResults = useCallback(() => {
    setComponents([]);
    searchInProgressRef.current = null;
  }, []);

  // When voice agent's show_candidate fires → run search if not already running
  const handleCandidateResearch = useCallback((candidateId: string) => {
    const candidate = CANDIDATES.find((c) => c.id === candidateId);
    if (candidate) {
      runSearch(candidate);
    }
  }, [runSearch]);

  const voiceAgent = useVoiceAgent({
    onComponentAdd: handleComponentAdd,
    onStatusChange: handleVoiceStatusChange,
    onSelectCandidate: handleVoiceSelectCandidate,
    onSetFilter: handleVoiceSetFilter,
    onClearResults: handleVoiceClearResults,
    onCandidateResearch: handleCandidateResearch,
    selectedCandidate,
  });

  // === User interactions ===
  function handleSelect(id: string) {
    setSelected(id);
    setIsActive(false);
    setIsLoading(false);
    setComponents([]);
    setStatusText(null);
    setVoiceMode(false);
    searchInProgressRef.current = null;
    if (voiceAgent.isConnected) {
      voiceAgent.stopVoiceSession();
    }
  }

  // Start voice conversation (no candidate needed)
  const startConversation = useCallback(async () => {
    setIsActive(true);
    setVoiceMode(true);
    setStatusText("Connecting to Ballot Badger...");
    try {
      await voiceAgent.startVoiceSession();
    } catch {
      setVoiceMode(false);
      setStatusText("Voice unavailable. Select a candidate and use Search.");
    }
  }, [voiceAgent]);

  function handleVoiceToggle() {
    if (isActive) {
      // Stop everything
      setIsActive(false);
      setStatusText(null);
      setVoiceMode(false);
      setIsLoading(false);
      searchInProgressRef.current = null;
      if (voiceAgent.isConnected) {
        voiceAgent.stopVoiceSession();
      }
      return;
    }

    if (selectedCandidate) {
      // Candidate selected — start voice + search simultaneously
      setVoiceMode(true);
      voiceAgent.startVoiceSession().catch(() => setVoiceMode(false));
      runSearch(selectedCandidate);
    } else {
      // No candidate — just start voice
      startConversation();
    }
  }

  function handleClickFallback() {
    if (!selectedCandidate) return;
    setVoiceMode(false);
    runSearch(selectedCandidate);
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
          {/* Voice listening state — no candidate yet */}
          {voiceMode && isActive && !isLoading && components.length === 0 && (
            <VoiceActiveState
              isConnected={voiceAgent.isConnected}
              isSpeaking={voiceAgent.isSpeaking}
            />
          )}
          {/* Digging progress while search is running */}
          {isLoading && selectedCandidate && (
            <div className="p-5 max-w-3xl mx-auto">
              <DiggingProgress
                candidate={selectedCandidate}
                isActive={isLoading}
              />
            </div>
          )}
          {/* Results — pre-built components with photos and neobrutalism styling */}
          <ComponentRenderer components={components} />
        </main>
      </div>

      {/* Bottom: voice bar */}
      <VoiceBar
        isActive={isActive}
        selectedName={selectedCandidate?.name ?? null}
        onToggle={handleVoiceToggle}
        onClickFallback={selectedCandidate ? handleClickFallback : undefined}
        statusText={statusText}
        isLoading={isLoading}
        voiceMode={voiceMode}
        isSpeaking={voiceAgent.isSpeaking}
        isConnected={voiceAgent.isConnected}
      />
    </div>
  );
}
