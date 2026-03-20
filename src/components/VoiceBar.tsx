"use client";

interface VoiceBarProps {
  readonly isActive: boolean;
  readonly selectedName: string | null;
  readonly onToggle: () => void;
}

export function VoiceBar({ isActive, selectedName, onToggle }: VoiceBarProps) {
  return (
    <div
      className="flex items-center gap-3 border-t px-4 py-3"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      {/* Mic button */}
      <button
        onClick={onToggle}
        disabled={!selectedName}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isActive ? "var(--status-error)" : "var(--wi-blue)",
          animation: isActive ? "pulseGlow 2s ease infinite" : "none",
        }}
      >
        {isActive ? "\u23F8" : "\uD83C\uDF99"}
      </button>

      {/* Status text */}
      <div
        className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--background)",
          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        }}
      >
        {isActive
          ? "Listening... say \u201Cgo deeper\u201D or ask a follow-up"
          : selectedName
            ? `Ask about ${selectedName}\u2019s record...`
            : "Select a candidate first"}
      </div>

      {/* Wave animation */}
      {isActive && (
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
