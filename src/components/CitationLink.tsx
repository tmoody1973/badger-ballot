"use client";

interface CitationLinkProps {
  readonly source: string;
  readonly sourceUrl?: string;
}

export function CitationLink({ source, sourceUrl }: CitationLinkProps) {
  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-wi-blue hover:underline font-mono"
        aria-label={`Source: ${source}`}
      >
        {source}
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3.5 3.5h5v5M8.5 3.5L3 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    );
  }

  return <span className="font-mono">{source}</span>;
}
