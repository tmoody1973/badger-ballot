"use client";

import { useState, useMemo } from "react";
import { CANDIDATES, RACE_FILTERS } from "@/data/candidates";
import type { FilterKey } from "@/data/candidates";
import type { RenderedComponent } from "@/types";
import { CandidateDirectory } from "@/components/CandidateDirectory";
import { ComponentRenderer } from "@/components/ComponentRenderer";
import { VoiceBar } from "@/components/VoiceBar";

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
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Top bar */}
      <header
        className="flex items-center gap-4 border-b px-4 py-2.5 shrink-0"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div className="flex items-baseline gap-2">
          <span
            className="text-[9px] font-bold tracking-[0.2em] font-mono"
            style={{ color: "var(--wi-blue)" }}
          >
            WI 2026
          </span>
          <h1 className="text-base font-bold text-[var(--text-primary)]">
            Ballot Badger
          </h1>
        </div>

        <div className="flex-1" />

        {/* Filters */}
        <nav className="flex gap-1">
          {RACE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-full px-3 py-1 text-[10px] font-semibold font-mono transition-all duration-150"
              style={{
                backgroundColor: filter === f.key ? "var(--wi-blue)" : "transparent",
                color: filter === f.key ? "var(--text-on-blue)" : "var(--text-secondary)",
                border: `1px solid ${filter === f.key ? "var(--wi-blue)" : "var(--border)"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: directory */}
        <aside className="w-72 shrink-0">
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
