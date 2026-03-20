"use client";

interface VoiceActiveStateProps {
  readonly isConnected: boolean;
  readonly isSpeaking: boolean;
}

export function VoiceActiveState({ isConnected, isSpeaking }: VoiceActiveStateProps) {
  if (!isConnected) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-12">
      {/* Animated badger icon */}
      <div className="relative mb-6">
        <div
          className="text-6xl"
          style={{
            animation: isSpeaking ? "none" : "pulse 2s ease-in-out infinite",
          }}
        >
          🦡
        </div>
        {/* Sound waves when speaking */}
        {isSpeaking && (
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-full bg-wi-blue"
                style={{
                  width: `${8 + i * 6}px`,
                  height: "2px",
                  opacity: 1 - i * 0.25,
                  animation: `wave 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <h2 className="text-lg font-heading text-foreground mb-2">
        {isSpeaking ? "Ballot Badger is speaking..." : "Listening..."}
      </h2>

      <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
        {isSpeaking
          ? "Findings will appear here as the agent narrates them."
          : "Ask about any Wisconsin candidate, ballot measure, or election. Try: \"Tell me about Tom Tiffany\" or \"Who's running for governor?\""}
      </p>

      {/* Subtle pulse ring */}
      <div className="mt-8 flex items-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-wi-blue"
            style={{
              animation: `wave 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
