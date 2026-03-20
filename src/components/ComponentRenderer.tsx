"use client";

import type { RenderedComponent, Candidate } from "@/types";
import { CandidateCard } from "./CandidateCard";
import { VoteRecord } from "./VoteRecord";
import { DonorTable } from "./DonorTable";
import { FactCheckBadge } from "./FactCheckBadge";
import { EndorsementCard } from "./EndorsementCard";
import { MeasureCard } from "./MeasureCard";

interface ComponentRendererProps {
  readonly components: readonly RenderedComponent[];
}

export function ComponentRenderer({ components }: ComponentRendererProps) {
  if (components.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8">
        <div className="text-5xl mb-4 opacity-10">&#x1F50D;</div>
        <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
          Select a candidate and pull their receipts to see findings appear here as the agent speaks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {components.map((component, i) => {
        switch (component.type) {
          case "candidate":
            return <CandidateCard key={`candidate-${i}`} candidate={component.data} />;
          case "vote":
            return <VoteRecord key={`vote-${i}`} data={component.data} />;
          case "donors":
            return <DonorTable key={`donors-${i}`} data={component.data} />;
          case "factCheck":
            return <FactCheckBadge key={`factcheck-${i}`} data={component.data} />;
          case "endorsement":
            return <EndorsementCard key={`endorsement-${i}`} data={component.data} />;
          case "measure":
            return <MeasureCard key={`measure-${i}`} data={component.data} />;
        }
      })}
    </div>
  );
}
