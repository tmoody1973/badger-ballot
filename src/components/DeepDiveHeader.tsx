"use client";

interface DeepDiveHeaderProps {
  readonly candidate: string;
  readonly angle: string;
  readonly sourceCount: number;
}

export function DeepDiveHeader({ candidate, angle, sourceCount }: DeepDiveHeaderProps) {
  return (
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
  );
}
