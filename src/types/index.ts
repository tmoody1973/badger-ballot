export type Party = "D" | "R" | "M" | "X" | "NP";

export type CandidateType =
  | "incumbent"
  | "challenger"
  | "open_seat"
  | "measure"
  | "district";

export type Severity = "high" | "medium" | "low";

export type RaceCategory =
  | "governor"
  | "house"
  | "senate"
  | "supreme_court"
  | "attorney_general"
  | "statewide"
  | "ballot";

export interface Candidate {
  readonly id: string;
  readonly name: string;
  readonly party: Party;
  readonly office: string;
  readonly currentRole: string;
  readonly type: CandidateType;
  readonly raceCategory: RaceCategory;
  readonly photoUrl: string | null;
  readonly keyFact: string;
  readonly findings: number;
  readonly severity: Severity;
}

export interface VoteData {
  readonly bill: string;
  readonly vote: string;
  readonly context: string;
  readonly date?: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly candidate: string;
}

export interface DonorData {
  readonly name: string;
  readonly amount: string;
  readonly type: string;
  readonly cycle: string;
}

export interface DonorTableData {
  readonly candidate: string;
  readonly donors: readonly DonorData[];
  readonly totalRaised?: string;
  readonly source: string;
  readonly sourceUrl?: string;
}

export interface FactCheckData {
  readonly claim: string;
  readonly rating: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly year: string;
  readonly candidate: string;
}

export interface EndorsementData {
  readonly endorser: string;
  readonly type: string;
  readonly context: string;
  readonly sourceUrl?: string;
  readonly candidate: string;
}

export interface MeasureData {
  readonly title: string;
  readonly summary: string;
  readonly forArguments: readonly string[];
  readonly againstArguments: readonly string[];
  readonly sponsors?: string;
  readonly funding?: string;
}

export interface ReceiptsResponse {
  readonly candidate: {
    readonly name: string;
    readonly party: string;
    readonly office: string;
    readonly currentRole: string;
    readonly keyFact: string;
    readonly type: CandidateType;
  };
  readonly votes: readonly VoteData[];
  readonly donors: DonorTableData | null;
  readonly factChecks: readonly FactCheckData[];
  readonly endorsements: readonly EndorsementData[];
  readonly platform: readonly { issue: string; position: string; source: string }[];
  readonly summary: {
    readonly officialSources: number;
    readonly newsSources: number;
    readonly factCheckSources: number;
    readonly keyFinding: string;
  };
}

export interface NewsHeadlineData {
  readonly headline: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly date?: string;
  readonly summary: string;
  readonly candidate: string;
}

export type RenderedComponent =
  | { readonly type: "candidate"; readonly data: Candidate }
  | { readonly type: "vote"; readonly data: VoteData }
  | { readonly type: "donors"; readonly data: DonorTableData }
  | { readonly type: "factCheck"; readonly data: FactCheckData }
  | { readonly type: "endorsement"; readonly data: EndorsementData }
  | { readonly type: "measure"; readonly data: MeasureData }
  | { readonly type: "news"; readonly data: NewsHeadlineData }
  | { readonly type: "platform"; readonly data: { issue: string; position: string; source: string; sourceUrl?: string; candidate: string } }
  | { readonly type: "fundraisingChart"; readonly data: { title: string; bars: Array<{ name: string; amount: number; party: string; label: string }>; source?: string; sourceUrl?: string } }
  | { readonly type: "financeFiling"; readonly data: { candidate: string; content: string; source: string; sourceUrl?: string } }
  | { readonly type: "voterInfo"; readonly data: { address: string; content: string; source: string; sourceUrl?: string } }
  | { readonly type: "raceComparison"; readonly data: { raceCategory: string; office: string } }
  | { readonly type: "pollingPlace"; readonly data: { address: string; rawContent: string; sourceUrl: string; nextElection: string; daysUntilElection: number } }
  | { readonly type: "ballotPreview"; readonly data: { address: string; rawContent: string; sourceUrl: string; nextElection: string; daysUntilElection: number } }
  | { readonly type: "registration"; readonly data: { address: string; rawContent: string; sourceUrl: string; nextElection: string; daysUntilElection: number } }
  | { readonly type: "voterServices"; readonly data: {
      address: string;
      pollingPlace?: { name: string; address: string; hours?: string };
      isRegistered?: boolean;
      ballotItems?: Array<{ race: string; candidates: string[] }>;
      nextElection?: string;
      rawContent?: string;
      sourceUrl?: string;
    }};
