"use client";

import type { RenderedComponent } from "@/types";
import { CandidateCard } from "./CandidateCard";
import { VoteRecord } from "./VoteRecord";
import { DonorTable } from "./DonorTable";
import { FactCheckBadge } from "./FactCheckBadge";
import { EndorsementCard } from "./EndorsementCard";
import { MeasureCard } from "./MeasureCard";
import { NewsHeadline } from "./NewsHeadline";
import { PlatformCard } from "./PlatformCard";
import { FundraisingChart } from "./FundraisingChart";

interface ComponentRendererProps {
  readonly components: readonly RenderedComponent[];
}

function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 px-1">
      <span className="text-lg">{icon}</span>
      <h2 className="text-sm font-heading tracking-wider text-muted-foreground uppercase">
        {label}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function ComponentRenderer({ components }: ComponentRendererProps) {
  if (components.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8">
        <div className="text-5xl mb-4 opacity-10">{"\u{1F50D}"}</div>
        <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
          Select a candidate and pull their receipts to see findings appear here.
        </p>
      </div>
    );
  }

  const candidateCards = components.filter((c) => c.type === "candidate");
  const news = components.filter((c) => c.type === "news");
  const votes = components.filter((c) => c.type === "vote");
  const donors = components.filter((c) => c.type === "donors");
  const factChecks = components.filter((c) => c.type === "factCheck");
  const endorsements = components.filter((c) => c.type === "endorsement");
  const platform = components.filter((c) => c.type === "platform");
  const measures = components.filter((c) => c.type === "measure");
  const charts = components.filter((c) => c.type === "fundraisingChart");

  return (
    <div className="p-5 max-w-3xl mx-auto">
      {candidateCards.map((component, i) => (
        <CandidateCard key={`candidate-${i}`} candidate={component.data} />
      ))}

      {news.length > 0 && (
        <>
          <SectionHeader label="In the News" icon={"\u{1F4F0}"} />
          <div className="space-y-3">
            {news.map((component, i) => (
              <NewsHeadline key={`news-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}

      {votes.length > 0 && (
        <>
          <SectionHeader label="Voting Record" icon={"\u{1F5F3}"} />
          <div className="space-y-3">
            {votes.map((component, i) => (
              <VoteRecord key={`vote-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}

      {donors.length > 0 && (
        <>
          <SectionHeader label="Campaign Finance" icon={"\u{1F4B0}"} />
          <div className="space-y-3">
            {donors.map((component, i) => (
              <DonorTable key={`donors-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}

      {factChecks.length > 0 && (
        <>
          <SectionHeader label="Fact Checks" icon={"\u2705"} />
          <div className="space-y-3">
            {factChecks.map((component, i) => (
              <FactCheckBadge key={`factcheck-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}

      {platform.length > 0 && (
        <>
          <SectionHeader label="Platform Positions" icon={"\u{1F4CB}"} />
          <div className="space-y-3">
            {platform.map((component, i) => (
              <PlatformCard key={`platform-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}

      {endorsements.length > 0 && (
        <>
          <SectionHeader label="Endorsements" icon={"\u{1F91D}"} />
          <div className="space-y-3">
            {endorsements.map((component, i) => (
              <EndorsementCard key={`endorsement-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}

      {charts.length > 0 && (
        <>
          <SectionHeader label="Fundraising" icon={"\u{1F4CA}"} />
          <div className="space-y-3">
            {charts.map((component, i) => (
              <FundraisingChart key={`chart-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}

      {measures.length > 0 && (
        <>
          <SectionHeader label="Ballot Measures" icon={"\u{1F4DC}"} />
          <div className="space-y-3">
            {measures.map((component, i) => (
              <MeasureCard key={`measure-${i}`} data={component.data} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
