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
  error?: string;
}

function buildComponentsFromResponse(
  response: ReceiptsResponse,
  candidateData: Candidate,
): RenderedComponent[] {
  const result: RenderedComponent[] = [];

  result.push({ type: "candidate", data: candidateData });

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

  const filtered = useMemo(() => {
    if (filter === "all") return CANDIDATES;
    return CANDIDATES.filter((c) => c.raceCategory === filter);
  }, [filter]);

  const selectedCandidate = useMemo(
    () => CANDIDATES.find((c) => c.id === selected) ?? null,
    [selected],
  );

  // Voice agent with client tools
  const handleComponentAdd = useCallback((component: RenderedComponent) => {
    setComponents((prev) => [...prev, component]);
    // Auto-scroll
    setTimeout(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = mainRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const handleVoiceStatusChange = useCallback((status: string) => {
    setStatusText(status);
  }, []);

  const handleVoiceSelectCandidate = useCallback(async (id: string) => {
    setSelected(id);
    setComponents([]);

    // When voice agent selects a candidate, auto-trigger the search
    const candidate = CANDIDATES.find((c) => c.id === id);
    if (!candidate) return;

    setIsLoading(true);
    setComponents([{ type: "candidate", data: candidate }]);

    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate: id }),
      });
      const data: ReceiptsResponse = await response.json();
      if (!data.error) {
        const newComponents = buildComponentsFromResponse(data, candidate);
        setComponents([newComponents[0]]);
        for (let i = 1; i < newComponents.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setComponents((prev) => [...prev, newComponents[i]]);
          if (mainRef.current) {
            mainRef.current.scrollTop = mainRef.current.scrollHeight;
          }
        }
        const sourceCount = data.source_count ?? 0;
        setStatusText(`Found ${sourceCount} sources. Say "go deeper" or ask a follow-up.`);
      }
    } catch {
      // Search failed but voice is still running
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVoiceSetFilter = useCallback((f: string) => {
    setFilter(f as FilterKey);
  }, []);

  const handleVoiceClearResults = useCallback(() => {
    setComponents([]);
  }, []);

  const voiceAgent = useVoiceAgent({
    onComponentAdd: handleComponentAdd,
    onStatusChange: handleVoiceStatusChange,
    onSelectCandidate: handleVoiceSelectCandidate,
    onSetFilter: handleVoiceSetFilter,
    onClearResults: handleVoiceClearResults,
    selectedCandidate,
  });

  function handleSelect(id: string) {
    setSelected(id);
    setIsActive(false);
    setIsLoading(false);
    setComponents([]);
    setStatusText(null);
    setVoiceMode(false);
    // Stop voice session if running
    if (voiceAgent.isConnected) {
      voiceAgent.stopVoiceSession();
    }
  }

  // Click-based receipts pull (fallback when voice isn't available)
  const pullReceiptsClick = useCallback(async (candidate: Candidate) => {
    setIsLoading(true);
    setIsActive(true);
    setVoiceMode(false);
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

      const newComponents = buildComponentsFromResponse(data, candidate);

      setComponents([newComponents[0]]);
      for (let i = 1; i < newComponents.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 600));
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
    }
  }, []);

  // Combined: voice agent connects AND search runs simultaneously
  const pullReceiptsCombined = useCallback(async (candidate: Candidate) => {
    setIsLoading(true);
    setIsActive(true);
    setVoiceMode(true);
    setComponents([{ type: "candidate", data: candidate }]);
    setStatusText("Connecting voice agent + searching...");

    // Start voice session in background (non-blocking)
    voiceAgent.startVoiceSession().catch(() => {
      // Voice failed — that's OK, search results will still render
      setVoiceMode(false);
    });

    // Simultaneously run the search and render results
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

      const newComponents = buildComponentsFromResponse(data, candidate);

      setComponents([newComponents[0]]);
      for (let i = 1; i < newComponents.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 600));
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
    }
  }, [voiceAgent]);

  // Voice-first: start a conversation without selecting a candidate
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
      if (voiceAgent.isConnected) {
        voiceAgent.stopVoiceSession();
      }
      return;
    }

    // If a candidate is selected, do combined voice + search
    if (selectedCandidate) {
      pullReceiptsCombined(selectedCandidate);
    } else {
      // No candidate selected — just start voice conversation
      startConversation();
    }
  }

  function handleClickFallback() {
    if (!selectedCandidate) return;
    pullReceiptsClick(selectedCandidate);
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
          {/* Voice active but no components yet — show listening state */}
          {voiceMode && isActive && !isLoading && components.length === 0 && (
            <VoiceActiveState
              isConnected={voiceAgent.isConnected}
              isSpeaking={voiceAgent.isSpeaking}
            />
          )}
          {/* Digging progress while search is running */}
          {isLoading && components.length <= 1 && selectedCandidate && (
            <div className="p-5 max-w-3xl mx-auto">
              <DiggingProgress
                candidate={selectedCandidate}
                isActive={isLoading}
              />
            </div>
          )}
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
