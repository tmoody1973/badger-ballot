"use client";

import { VoteRecord } from "./VoteRecord";
import { DonorTable } from "./DonorTable";
import { FactCheckBadge } from "./FactCheckBadge";
import { NewsHeadline } from "./NewsHeadline";
import { EndorsementCard } from "./EndorsementCard";
import { PlatformCard } from "./PlatformCard";

interface DeepDiveResultsProps {
  readonly data: {
    candidate: string;
    angle: string;
    sourceCount: number;
    votes?: Array<{ bill: string; vote: string; context: string; date?: string; source: string; sourceUrl?: string }>;
    donors?: { donors: Array<{ name: string; amount: string; type: string; cycle: string }>; totalRaised?: string; source: string; sourceUrl?: string } | null;
    factChecks?: Array<{ claim: string; rating: string; source: string; sourceUrl?: string; year: string }>;
    news?: Array<{ headline: string; source: string; sourceUrl?: string; date?: string; summary: string }>;
    endorsements?: Array<{ endorser: string; type: string; context: string; sourceUrl?: string }>;
    platform?: Array<{ issue: string; position: string; source: string; sourceUrl?: string }>;
  };
}

export function DeepDiveResults({ data }: DeepDiveResultsProps) {
  const { candidate, angle, sourceCount, votes, donors, factChecks, news, endorsements, platform } = data;
  const hasContent = (votes?.length ?? 0) > 0 || (donors?.donors?.length ?? 0) > 0 ||
    (factChecks?.length ?? 0) > 0 || (news?.length ?? 0) > 0 ||
    (endorsements?.length ?? 0) > 0 || (platform?.length ?? 0) > 0;

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mt-6 mb-4 rounded-base border-2 border-wi-blue bg-wi-blue px-4 py-3 shadow-shadow">
        <div className="flex items-center gap-3">
          <span className="text-base">🦡</span>
          <div className="flex-1">
            <h3 className="text-sm font-heading text-white tracking-wider uppercase">
              Deep Dive: {angle}
            </h3>
            <p className="text-xs text-white/70 mt-0.5">
              {sourceCount} additional sources on {candidate}
            </p>
          </div>
          <span className="text-xs font-mono text-wi-gold bg-wi-blue-dark px-2 py-1 rounded">
            Pass 2
          </span>
        </div>
      </div>

      {!hasContent && (
        <div className="rounded-base border-2 border-border bg-secondary-background p-4 text-sm text-muted-foreground">
          No additional findings for this angle. Try a different topic.
        </div>
      )}

      {/* Donors */}
      {donors && donors.donors.length > 0 && (
        <div className="space-y-3 mb-4">
          <DonorTable data={{ candidate, donors: donors.donors, totalRaised: donors.totalRaised, source: donors.source, sourceUrl: donors.sourceUrl }} />
        </div>
      )}

      {/* Votes */}
      {votes && votes.length > 0 && (
        <div className="space-y-3 mb-4">
          {votes.map((v, i) => (
            <VoteRecord key={`dd-vote-${i}`} data={{ ...v, candidate }} />
          ))}
        </div>
      )}

      {/* Fact Checks */}
      {factChecks && factChecks.length > 0 && (
        <div className="space-y-3 mb-4">
          {factChecks.map((fc, i) => (
            <FactCheckBadge key={`dd-fc-${i}`} data={{ ...fc, candidate }} />
          ))}
        </div>
      )}

      {/* News */}
      {news && news.length > 0 && (
        <div className="space-y-3 mb-4">
          {news.map((n, i) => (
            <NewsHeadline key={`dd-news-${i}`} data={{ ...n, candidate }} />
          ))}
        </div>
      )}

      {/* Endorsements */}
      {endorsements && endorsements.length > 0 && (
        <div className="space-y-3 mb-4">
          {endorsements.map((e, i) => (
            <EndorsementCard key={`dd-end-${i}`} data={{ ...e, candidate }} />
          ))}
        </div>
      )}

      {/* Platform */}
      {platform && platform.length > 0 && (
        <div className="space-y-3 mb-4">
          {platform.map((p, i) => (
            <PlatformCard key={`dd-plat-${i}`} data={{ ...p, candidate }} />
          ))}
        </div>
      )}
    </div>
  );
}
