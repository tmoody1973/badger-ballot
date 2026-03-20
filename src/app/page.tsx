"use client";

import { useState, useMemo } from "react";
import { CANDIDATES } from "@/data/candidates";
import type { FilterKey } from "@/data/candidates";
import type { RenderedComponent } from "@/types";
import { CandidateDirectory } from "@/components/CandidateDirectory";
import { ComponentRenderer } from "@/components/ComponentRenderer";
import { VoiceBar } from "@/components/VoiceBar";
import { RaceFilter } from "@/components/RaceFilter";

export default function BallotBadger() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [components, setComponents] = useState<RenderedComponent[]>([]);

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
    setComponents([]);
  }

  function handleToggleVoice() {
    if (!selectedCandidate) return;

    if (isActive) {
      setIsActive(false);
      return;
    }

    // Start voice session — show candidate card immediately as demo
    setIsActive(true);
    setComponents([{ type: "candidate", data: selectedCandidate }]);
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
        <main className="flex-1 overflow-y-auto">
          <ComponentRenderer components={components} />
        </main>
      </div>

      {/* Bottom: voice bar */}
      <VoiceBar
        isActive={isActive}
        selectedName={selectedCandidate?.name ?? null}
        onToggle={handleToggleVoice}
      />
    </div>
  );
}
