"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { getPartyConfig, getSeverityColor } from "@/lib/party";
import type { Party, Severity } from "@/types";

function ensureArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try { return JSON.parse(val) as T[]; } catch { return []; }
  }
  return [];
}

// ── CandidateProfile ────────────────────────────
export const CandidateProfile = defineComponent({
  name: "CandidateProfile",
  description: "Candidate profile card with name, party, office, and key fact.",
  props: z.object({
    name: z.string().describe("Full name"),
    party: z.string().describe("Republican, Democrat, Independent, Nonpartisan"),
    office: z.string().describe("Office running for"),
    currentRole: z.string().describe("Current position"),
    keyFact: z.string().describe("Most notable fact"),
    severity: z.string().optional().describe("high, medium, or low"),
  }),
  component: ({ props }) => {
    const p = (props.party?.charAt(0).toUpperCase() ?? "D") as Party;
    const config = getPartyConfig(p);
    const sev = getSeverityColor((props.severity ?? "medium") as Severity);
    return (
      <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-base border-2 border-border" style={{ backgroundColor: config.bgLight }}>
            <span className="text-xl font-bold font-mono" style={{ color: config.text, opacity: 0.7 }}>
              {props.name?.split(" ").map((w: string) => w[0]).join("") ?? "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h3 className="text-lg font-heading text-foreground">{props.name}</h3>
              <span className="rounded-base border-2 border-border px-2.5 py-0.5 text-xs font-bold tracking-wider font-mono" style={{ backgroundColor: config.bgLight, color: config.text }}>
                {config.label}
              </span>
            </div>
            <p className="text-sm font-mono text-muted-foreground">{props.office} · {props.currentRole}</p>
            <p className="mt-2 text-base text-muted-foreground">{props.keyFact}</p>
          </div>
          <div className="h-4 w-4 rounded-full border-2 border-border" style={{ backgroundColor: sev }} />
        </div>
      </div>
    );
  },
});

// ── VoteCard ────────────────────────────────────
export const VoteCard = defineComponent({
  name: "VoteCard",
  description: "Voting record card showing how a candidate voted on a bill.",
  props: z.object({
    bill: z.string().describe("Bill name or number"),
    vote: z.string().describe("Yea, Nay, Objected, Abstain, Sponsored"),
    context: z.string().describe("Why this vote matters"),
    date: z.string().optional(),
    source: z.string().describe("Source name"),
    sourceUrl: z.string().optional(),
  }),
  component: ({ props }) => {
    const isNay = ["Nay", "Objected", "No"].includes(props.vote ?? "");
    const isYea = ["Yea", "Sponsored", "Yes"].includes(props.vote ?? "");
    const bg = isNay ? "#FEF2F2" : isYea ? "#F0FDF4" : "#F9FAFB";
    const color = isNay ? "#991B1B" : isYea ? "#166534" : "#374151";
    return (
      <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <span className="inline-block rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono mb-3 bg-wi-blue-light text-wi-blue">VOTE</span>
            <h4 className="text-base font-heading text-foreground">{props.bill}</h4>
            <p className="mt-1.5 text-sm text-muted-foreground">{props.context}</p>
            <p className="mt-2.5 text-xs text-muted-foreground">
              {props.date && <>{props.date} · </>}
              {props.sourceUrl ? <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-wi-blue hover:underline">{props.source}</a> : props.source}
            </p>
          </div>
          <span className="rounded-base border-2 border-border px-4 py-2 text-sm font-mono font-bold" style={{ backgroundColor: bg, color }}>{props.vote?.toUpperCase()}</span>
        </div>
      </div>
    );
  },
});

// ── DonorList ───────────────────────────────────
export const DonorList = defineComponent({
  name: "DonorList",
  description: "Campaign finance table showing donors with amounts.",
  props: z.object({
    candidate: z.string(),
    totalRaised: z.string().optional(),
    source: z.string(),
    sourceUrl: z.string().optional(),
    donors: z.string().describe("JSON array string of {name, amount, type}"),
  }),
  component: ({ props }) => {
    const items = ensureArray<{ name: string; amount: string; type: string }>(props.donors);
    return (
      <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <div className="flex justify-between items-baseline mb-4">
          <span className="rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono bg-[var(--party-measure-bg)] text-[var(--party-measure)]">DONORS</span>
          <span className="text-xs text-muted-foreground">
            {props.sourceUrl ? <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-wi-blue hover:underline">{props.source}</a> : props.source}
          </span>
        </div>
        {props.totalRaised && <p className="text-2xl font-mono font-heading mb-4 text-foreground">{props.totalRaised}</p>}
        <div className="space-y-2.5">
          {items.map((d, i) => (
            <div key={i} className="flex justify-between items-center rounded-base border-2 border-border px-4 py-3 bg-background">
              <div><p className="text-sm font-bold text-foreground">{d.name}</p><p className="text-xs font-mono text-muted-foreground">{d.type}</p></div>
              <span className="text-base font-mono font-bold text-foreground">{d.amount}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

// ── FactCheck ───────────────────────────────────
export const FactCheck = defineComponent({
  name: "FactCheck",
  description: "Fact-check badge showing a claim, its rating, and source.",
  props: z.object({
    claim: z.string(),
    rating: z.string().describe("True, Mostly True, Half True, Mostly False, False, Pants on Fire"),
    source: z.string(),
    sourceUrl: z.string().optional(),
    year: z.string(),
    candidate: z.string(),
  }),
  component: ({ props }) => {
    const colors: Record<string, { bg: string; text: string }> = {
      "True": { bg: "#F0FDF4", text: "#166534" },
      "Mostly True": { bg: "#F0FDF4", text: "#166534" },
      "Half True": { bg: "#FEFCE8", text: "#854D0E" },
      "Mostly False": { bg: "#FFF7ED", text: "#9A3412" },
      "False": { bg: "#FEF2F2", text: "#991B1B" },
      "Pants on Fire": { bg: "#FEF2F2", text: "#991B1B" },
    };
    const c = colors[props.rating ?? ""] ?? { bg: "#F9FAFB", text: "#374151" };
    return (
      <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono bg-[var(--party-r-bg)] text-[var(--status-error)]">FACT CHECK</span>
          <span className="text-xs text-muted-foreground">
            {props.sourceUrl ? <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-wi-blue hover:underline">{props.source}</a> : props.source} · {props.year}
          </span>
        </div>
        <blockquote className="mb-4 border-l-4 border-border pl-4 text-base italic text-foreground">&ldquo;{props.claim}&rdquo;</blockquote>
        <div className="flex items-center gap-3">
          <span className="rounded-base border-2 border-border px-3 py-1 text-xs font-mono font-bold" style={{ backgroundColor: c.bg, color: c.text }}>{props.rating?.toUpperCase()}</span>
          <span className="text-sm font-mono text-muted-foreground">— {props.candidate}</span>
        </div>
      </div>
    );
  },
});

// ── NewsItem ────────────────────────────────────
export const NewsItem = defineComponent({
  name: "NewsItem",
  description: "News headline card with source and summary.",
  props: z.object({
    headline: z.string(),
    source: z.string(),
    sourceUrl: z.string().optional(),
    date: z.string().optional(),
    summary: z.string(),
  }),
  component: ({ props }) => (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
      <h4 className="text-base font-heading text-foreground leading-snug">
        {props.sourceUrl ? <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-wi-blue">{props.headline}</a> : props.headline}
      </h4>
      <p className="mt-1.5 text-sm text-muted-foreground">{props.summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {props.sourceUrl ? <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-wi-blue hover:underline">{props.source}</a> : props.source}
        {props.date && <> · {props.date}</>}
      </p>
    </div>
  ),
});

// ── EndorsementBadge ────────────────────────────
export const EndorsementBadge = defineComponent({
  name: "EndorsementBadge",
  description: "Endorsement card showing who endorsed a candidate.",
  props: z.object({
    endorser: z.string(),
    type: z.string().describe("Organization, Individual, Union, Newspaper, Elected Official"),
    context: z.string(),
    candidate: z.string(),
    sourceUrl: z.string().optional(),
  }),
  component: ({ props }) => (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
      <span className="inline-block rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono mb-2 bg-[var(--party-d-bg)] text-[var(--party-d)]">ENDORSEMENT</span>
      <h4 className="text-sm font-heading text-foreground">{props.endorser}</h4>
      <p className="text-[10px] font-mono text-muted-foreground">{props.type} · for {props.candidate}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{props.context}</p>
      {props.sourceUrl && <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-wi-blue hover:underline mt-1 block">Source</a>}
    </div>
  ),
});

// ── PolicyPosition ──────────────────────────────
export const PolicyPosition = defineComponent({
  name: "PolicyPosition",
  description: "A candidate's position on a specific policy issue.",
  props: z.object({
    issue: z.string(),
    position: z.string(),
    source: z.string(),
    sourceUrl: z.string().optional(),
  }),
  component: ({ props }) => (
    <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
      <span className="inline-block rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono mb-2 bg-[var(--party-nonpartisan-bg)] text-[var(--party-nonpartisan)]">POSITION</span>
      <h4 className="text-base font-heading text-foreground">{props.issue}</h4>
      <p className="mt-1.5 text-sm text-muted-foreground">{props.position}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {props.sourceUrl ? <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-wi-blue hover:underline">{props.source}</a> : props.source}
      </p>
    </div>
  ),
});

// ── FindingsStack ───────────────────────────────
export const FindingsStack = defineComponent({
  name: "FindingsStack",
  description: "Container for a collection of findings about a candidate. Use as root.",
  props: z.object({
    title: z.string().describe("Section title like 'Tom Tiffany — Findings'"),
    sourceCount: z.string().optional().describe("Number of sources found"),
  }),
  component: ({ props, renderNode }) => (
    <div className="p-5 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading text-foreground">{props.title}</h2>
        {props.sourceCount && <span className="text-xs font-mono text-muted-foreground">{props.sourceCount} sources</span>}
      </div>
      {renderNode && renderNode([])}
    </div>
  ),
});

// ── BallotMeasure ───────────────────────────────
export const BallotMeasure = defineComponent({
  name: "BallotMeasure",
  description: "Ballot measure card with for/against arguments.",
  props: z.object({
    title: z.string(),
    summary: z.string(),
    forArgs: z.string().optional().describe("Comma-separated arguments in favor"),
    againstArgs: z.string().optional().describe("Comma-separated arguments against"),
    sponsors: z.string().optional(),
  }),
  component: ({ props }) => {
    const forList = props.forArgs?.split(",").map((s: string) => s.trim()).filter(Boolean) ?? [];
    const againstList = props.againstArgs?.split(",").map((s: string) => s.trim()).filter(Boolean) ?? [];
    return (
      <div className="animate-slide-up rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <span className="inline-block rounded-base border-2 border-border px-2.5 py-1 text-xs font-bold tracking-wider font-mono mb-3 bg-[var(--party-measure-bg)] text-[var(--party-measure)]">BALLOT MEASURE</span>
        <h4 className="text-sm font-heading text-foreground mb-2">{props.title}</h4>
        <p className="text-xs text-muted-foreground mb-4">{props.summary}</p>
        {(forList.length > 0 || againstList.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-base border-2 border-border p-3 bg-[#F0FDF4]">
              <p className="text-[10px] font-mono font-bold mb-2 text-[#166534]">FOR</p>
              {forList.map((a: string, i: number) => <p key={i} className="text-[11px] text-[#166534]">{a}</p>)}
            </div>
            <div className="rounded-base border-2 border-border p-3 bg-[#FEF2F2]">
              <p className="text-[10px] font-mono font-bold mb-2 text-[#991B1B]">AGAINST</p>
              {againstList.map((a: string, i: number) => <p key={i} className="text-[11px] text-[#991B1B]">{a}</p>)}
            </div>
          </div>
        )}
        {props.sponsors && <p className="mt-3 text-[10px] font-mono text-muted-foreground">Sponsors: {props.sponsors}</p>}
      </div>
    );
  },
});
