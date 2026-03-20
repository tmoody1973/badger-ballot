"use client";

interface VoiceBarProps {
  readonly isActive: boolean;
  readonly selectedName: string | null;
  readonly onToggle: () => void;
  readonly onClickFallback?: () => void;
  readonly statusText?: string | null;
  readonly isLoading?: boolean;
  readonly voiceMode?: boolean;
  readonly isSpeaking?: boolean;
  readonly isConnected?: boolean;
}

export function VoiceBar({
  isActive,
  selectedName,
  onToggle,
  onClickFallback,
  statusText,
  isLoading,
  voiceMode,
  isSpeaking,
  isConnected,
}: VoiceBarProps) {
  const displayText = statusText
    ?? (isActive && voiceMode
      ? isSpeaking
        ? "Agent is speaking..."
        : "Listening... ask about their record or say \u201Cgo deeper\u201D"
      : isActive
        ? "Searching..."
        : selectedName
          ? `Ready to investigate ${selectedName}`
          : "Select a candidate first");

  return (
    <div className="flex items-center gap-3 border-t-2 border-border px-4 py-3 bg-secondary-background">
      {/* Voice button */}
      <button
        onClick={onToggle}
        disabled={!selectedName || isLoading}
        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-base border-2 border-border text-white text-sm font-heading px-4 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-shadow"
        style={{
          backgroundColor: isActive ? "var(--status-error)" : "var(--wi-blue)",
          animation: isActive && !isLoading && voiceMode ? "pulseGlow 2s ease infinite" : "none",
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

      {/* Click-based fallback button */}
      {selectedName && !isActive && onClickFallback && (
        <button
          onClick={onClickFallback}
          disabled={isLoading}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-base border-2 border-border text-foreground text-sm font-heading px-4 transition-all duration-200 disabled:opacity-30 bg-secondary-background hover:bg-background shadow-shadow"
        >
          {"\u{1F50D}"} Search only
        </button>
      )}

      {/* Status text */}
      <div className="flex-1 rounded-base border-2 border-border px-3 py-2 text-sm font-mono bg-background text-muted-foreground">
        {displayText}
      </div>

      {/* Voice indicators */}
      {isActive && voiceMode && isConnected && (
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <span className="text-[9px] font-mono font-bold text-wi-blue tracking-wider">
              SPEAKING
            </span>
          )}
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
        </div>
      )}
    </div>
  );
}
