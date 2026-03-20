"use client";

interface VoiceBarProps {
  readonly isActive: boolean;
  readonly selectedName: string | null;
  readonly onToggle: () => void;
  readonly statusText?: string | null;
  readonly isLoading?: boolean;
}

export function VoiceBar({
  isActive,
  selectedName,
  onToggle,
  statusText,
  isLoading,
}: VoiceBarProps) {
  const displayText = statusText
    ?? (isActive
      ? "Listening... say \u201Cgo deeper\u201D or ask a follow-up"
      : selectedName
        ? `Ask about ${selectedName}\u2019s record...`
        : "Select a candidate first");

  return (
    <div className="flex items-center gap-3 border-t-2 border-border px-4 py-3 bg-secondary-background">
      {/* Mic / Pull receipts button */}
      <button
        onClick={onToggle}
        disabled={!selectedName || isLoading}
        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-base border-2 border-border text-white text-sm font-heading px-4 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-shadow"
        style={{
          backgroundColor: isActive ? "var(--status-error)" : "var(--wi-blue)",
          animation: isActive && !isLoading ? "pulseGlow 2s ease infinite" : "none",
        }}
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Digging...
          </>
        ) : isActive ? (
          <>&#x23F8; Stop</>
        ) : (
          <>{"\u{1F399}"} Pull the receipts</>
        )}
      </button>

      {/* Status text */}
      <div className="flex-1 rounded-base border-2 border-border px-3 py-2 text-sm font-mono bg-background text-muted-foreground">
        {displayText}
      </div>

      {/* Wave animation */}
      {isActive && !isLoading && (
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-0.5 rounded-sm"
              style={{
                backgroundColor: "var(--wi-blue)",
                animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
