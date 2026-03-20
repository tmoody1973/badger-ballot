"use client";

import { CitationLink } from "./CitationLink";

export interface NewsHeadlineData {
  readonly headline: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly date?: string;
  readonly summary: string;
  readonly candidate: string;
}

interface NewsHeadlineProps {
  readonly data: NewsHeadlineData;
}

export function NewsHeadline({ data }: NewsHeadlineProps) {
  return (
    <div
      className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow"
      role="article"
      aria-label={`News: ${data.headline}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-heading text-foreground leading-snug">
            {data.sourceUrl ? (
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-wi-blue transition-colors"
              >
                {data.headline}
              </a>
            ) : (
              data.headline
            )}
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {data.summary}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <CitationLink source={data.source} sourceUrl={data.sourceUrl} />
            {data.date && <> &middot; {data.date}</>}
          </p>
        </div>
      </div>
    </div>
  );
}
