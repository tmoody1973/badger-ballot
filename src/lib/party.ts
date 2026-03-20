import type { Party, Severity } from "@/types";

interface PartyConfig {
  readonly bg: string;
  readonly bgLight: string;
  readonly text: string;
  readonly label: string;
}

const PARTY_CONFIG: Record<Party, PartyConfig> = {
  R: { bg: "var(--party-r)", bgLight: "var(--party-r-bg)", text: "#991B1B", label: "REP" },
  D: { bg: "var(--party-d)", bgLight: "var(--party-d-bg)", text: "#1E40AF", label: "DEM" },
  M: { bg: "var(--party-measure)", bgLight: "var(--party-measure-bg)", text: "#92400E", label: "MEASURE" },
  X: { bg: "var(--party-swing)", bgLight: "var(--party-swing-bg)", text: "#5B21B6", label: "SWING" },
  NP: { bg: "var(--party-nonpartisan)", bgLight: "var(--party-nonpartisan-bg)", text: "#155E75", label: "NONPARTISAN" },
};

export function getPartyConfig(party: Party): PartyConfig {
  return PARTY_CONFIG[party];
}

export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    high: "var(--severity-high)",
    medium: "var(--severity-medium)",
    low: "var(--severity-low)",
  };
  return colors[severity];
}

export function getInitials(name: string, party: Party): string {
  if (party === "M") return "\u00A7";
  if (party === "X") return "\u2694";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("");
}
