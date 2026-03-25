"use client";

import { useState, useEffect } from "react";

interface DeepDiveProgressProps {
  readonly candidate: string;
  readonly angle: string;
  readonly status: "searching" | "complete";
  readonly sourceCount?: number;
}

const ANGLE_ICONS: Record<string, string> = {
  donor: "💰",
  money: "💰",
  fund: "💰",
  finance: "💰",
  vote: "🗳️",
  record: "🗳️",
  news: "📰",
  endorse: "🤝",
  platform: "📋",
  policy: "📋",
  fact: "✅",
};

function getAngleIcon(angle: string): string {
  const lower = angle.toLowerCase();
  for (const [key, icon] of Object.entries(ANGLE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "🔍";
}

const DEEP_DIVE_STEPS = [
  "Searching targeted sources",
  "Scraping official records",
  "Cross-referencing findings",
  "Building the full picture",
];

export function DeepDiveProgress({ candidate, angle, status, sourceCount }: DeepDiveProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (status === "complete") {
      setCurrentStep(DEEP_DIVE_STEPS.length);
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    DEEP_DIVE_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setCurrentStep(i + 1), 2000 + i * 3000),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [status]);

  if (status === "complete") return null;

  const icon = getAngleIcon(angle);

  return (
    <div className="rounded-base border-2 border-wi-blue bg-wi-blue-light p-5 shadow-shadow animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-heading text-wi-blue tracking-wider uppercase">
          Deep dive: {angle}
        </h3>
        <div className="flex-1" />
        <span className="text-xs font-mono text-wi-blue opacity-70">{candidate}</span>
      </div>

      <div className="space-y-2">
        {DEEP_DIVE_STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <div
              key={step}
              className="flex items-center gap-3 transition-opacity duration-300"
              style={{ opacity: i <= currentStep ? 1 : 0.3 }}
            >
              <span className="text-sm w-5 text-center">
                {isDone ? "✓" : "·"}
              </span>
              <span
                className={`text-sm ${isDone ? "text-muted-foreground line-through" : isCurrent ? "text-foreground font-heading" : "text-muted-foreground"}`}
              >
                {step}
              </span>
              {isCurrent && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-wi-blue border-t-transparent" />
              )}
            </div>
          );
        })}
      </div>

      {sourceCount && sourceCount > 0 && (
        <div className="mt-3 pt-3 border-t border-wi-blue/20 text-xs font-mono text-wi-blue">
          {sourceCount} sources found
        </div>
      )}
    </div>
  );
}
