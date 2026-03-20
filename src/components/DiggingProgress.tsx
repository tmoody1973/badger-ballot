"use client";

import { useState, useEffect } from "react";
import type { Candidate } from "@/types";
import { CANDIDATES } from "@/data/candidates";

interface DiggingProgressProps {
  readonly candidate: Candidate;
  readonly isActive: boolean;
}

const DIGGING_STEPS = [
  { icon: "🔍", label: "Searching public records", source: "Congress.gov" },
  { icon: "💰", label: "Following the money trail", source: "OpenSecrets" },
  { icon: "✅", label: "Checking the fact-checkers", source: "PolitiFact" },
  { icon: "📰", label: "Scanning news coverage", source: "Recent news" },
  { icon: "📋", label: "Compiling your dossier", source: "Synthesis" },
];

function getQuickFacts(candidate: Candidate): string[] {
  const facts: string[] = [];

  // Race context
  if (candidate.raceCategory === "governor") {
    facts.push("Wisconsin's first open governor's race since 2010. Evers is term-limited.");
    const govCandidates = CANDIDATES.filter(
      (c) => c.raceCategory === "governor" && c.party === candidate.party,
    );
    if (govCandidates.length > 1) {
      facts.push(
        `${candidate.party === "D" ? "Democratic" : "Republican"} primary: ${govCandidates.length} candidates. Primary date: August 11, 2026.`,
      );
    }
  }

  if (candidate.raceCategory === "supreme_court") {
    facts.push("April 7, 2026 election. Replacing Justice Rebecca Bradley (conservative).");
    facts.push("A liberal win gives the court a 5-2 liberal majority through at least 2030.");
  }

  if (candidate.raceCategory === "attorney_general") {
    facts.push("The 2022 AG race was decided by just 0.6% — one of the closest in WI history.");
  }

  if (candidate.office.includes("WI-3")) {
    facts.push("WI-3 is rated a toss-up — the most competitive House race in Wisconsin.");
    facts.push("The DCCC has made this a top target for flipping the House.");
  }

  if (candidate.raceCategory === "senate") {
    facts.push("Democrats need to flip 3 State Senate seats to take majority for the first time since 2008.");
    facts.push("This is the first election under court-ordered fair maps (no more gerrymandering).");
  }

  if (candidate.raceCategory === "ballot") {
    facts.push("All 3 amendments were placed on the ballot by the Republican-controlled legislature.");
    facts.push("Governor Evers opposes but cannot veto constitutional amendments.");
  }

  // Election date
  if (candidate.raceCategory === "supreme_court") {
    facts.push("Election Day: April 7, 2026");
  } else if (candidate.raceCategory === "ballot") {
    facts.push("Election Day: November 3, 2026");
  } else {
    facts.push("Primary: August 11, 2026 · General: November 3, 2026");
  }

  return facts;
}

export function DiggingProgress({ candidate, isActive }: DiggingProgressProps) {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [showQuickFacts, setShowQuickFacts] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCompletedSteps(0);
      setShowQuickFacts(false);
      return;
    }

    // Simulate step completion with staggered timing
    const timers: NodeJS.Timeout[] = [];

    DIGGING_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCompletedSteps(i + 1);
        }, 2000 + i * 2500),
      );
    });

    // Show quick facts after 3 seconds
    timers.push(
      setTimeout(() => {
        setShowQuickFacts(true);
      }, 3000),
    );

    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  if (!isActive) return null;

  const quickFacts = getQuickFacts(candidate);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Digging progress card */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🦡</span>
          <h3 className="text-sm font-heading text-foreground tracking-wider uppercase">
            Digging into {candidate.name}
          </h3>
        </div>

        <div className="space-y-2.5">
          {DIGGING_STEPS.map((step, i) => {
            const isDone = i < completedSteps;
            const isCurrent = i === completedSteps;

            return (
              <div
                key={step.label}
                className="flex items-center gap-3 transition-opacity duration-300"
                style={{ opacity: i <= completedSteps ? 1 : 0.3 }}
              >
                <span className="text-base w-6 text-center">
                  {isDone ? "✓" : step.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${isDone ? "text-muted-foreground line-through" : isCurrent ? "text-foreground font-heading" : "text-muted-foreground"}`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-2">
                    {step.source}
                  </span>
                </div>
                {isCurrent && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-wi-blue border-t-transparent" />
                )}
                {isDone && (
                  <span className="text-xs font-mono text-[var(--status-success)]">done</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick facts card — appears after 3s */}
      {showQuickFacts && quickFacts.length > 0 && (
        <div className="rounded-base border-2 border-border bg-wi-blue-light p-5 shadow-shadow animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💡</span>
            <h3 className="text-sm font-heading text-wi-blue tracking-wider uppercase">
              While we dig — quick context
            </h3>
          </div>
          <ul className="space-y-2">
            {quickFacts.map((fact, i) => (
              <li
                key={i}
                className="text-sm text-foreground leading-relaxed flex gap-2"
              >
                <span className="text-muted-foreground shrink-0">•</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
