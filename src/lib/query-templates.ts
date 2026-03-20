import type { CandidateType } from "@/types";

export interface SearchQuery {
  readonly query: string;
  readonly limit: number;
  readonly tbs?: string;
}

interface QueryTemplate {
  readonly queries: readonly SearchQuery[];
}

function incumbentQueries(candidate: string, topic?: string): QueryTemplate {
  const t = topic ?? "record";
  return {
    queries: [
      { query: `${candidate} voting record ${t} congress.gov bills`, limit: 5 },
      { query: `${candidate} campaign donors fundraising opensecrets PAC contributions`, limit: 5 },
      { query: `${candidate} ${t} fact check politifact Wisconsin`, limit: 5 },
      { query: `${candidate} Wisconsin 2026 news endorsements`, limit: 5, tbs: "qdr:y" },
      { query: `${candidate} ${t} position statement policy Wisconsin`, limit: 5 },
    ],
  };
}

function challengerQueries(candidate: string, topic?: string): QueryTemplate {
  const t = topic ?? "platform";
  return {
    queries: [
      { query: `${candidate} campaign platform ${t} issues positions Wisconsin 2026`, limit: 5 },
      { query: `${candidate} fundraising donors raised campaign finance Wisconsin 2026`, limit: 5 },
      { query: `${candidate} endorsements endorsed by unions organizations Wisconsin`, limit: 5 },
      { query: `${candidate} Wisconsin 2026 news interview`, limit: 5, tbs: "qdr:y" },
      { query: `${candidate} ${t} fact check background Wisconsin`, limit: 5 },
    ],
  };
}

function openSeatQueries(candidate: string, topic?: string): QueryTemplate {
  const t = topic ?? "platform";
  return {
    queries: [
      { query: `${candidate} background experience ${t} Wisconsin`, limit: 5 },
      { query: `${candidate} endorsements fundraising Wisconsin 2026`, limit: 5 },
      { query: `${candidate} ${t} news coverage Wisconsin 2026`, limit: 5, tbs: "qdr:y" },
      { query: `${candidate} campaign platform positions issues`, limit: 5 },
      { query: `${candidate} Wisconsin primary election 2026`, limit: 5 },
    ],
  };
}

function measureQueries(measureName: string, topic?: string): QueryTemplate {
  const t = topic ?? "analysis";
  return {
    queries: [
      { query: `Wisconsin ${measureName} amendment ${t} 2026 ballot`, limit: 5 },
      { query: `Wisconsin ${measureName} amendment funding supporters opponents`, limit: 5 },
      { query: `Wisconsin ${measureName} amendment impact analysis what it means`, limit: 5 },
      { query: `Wisconsin ${measureName} constitutional amendment vote 2026 news`, limit: 5, tbs: "qdr:y" },
      { query: `${measureName} similar amendment other states results`, limit: 5 },
    ],
  };
}

function districtQueries(districtName: string, topic?: string): QueryTemplate {
  const t = topic ?? "race";
  return {
    queries: [
      { query: `Wisconsin ${districtName} 2026 ${t} candidates`, limit: 5 },
      { query: `Wisconsin ${districtName} demographics voting history trends`, limit: 5 },
      { query: `Wisconsin ${districtName} 2026 competitive rating cook report`, limit: 5 },
      { query: `Wisconsin ${districtName} election news 2026`, limit: 5, tbs: "qdr:y" },
    ],
  };
}

export function getQueryTemplates(
  candidateType: CandidateType,
  name: string,
  topic?: string,
): QueryTemplate {
  switch (candidateType) {
    case "incumbent":
      return incumbentQueries(name, topic);
    case "challenger":
      return challengerQueries(name, topic);
    case "open_seat":
      return openSeatQueries(name, topic);
    case "measure":
      return measureQueries(name, topic);
    case "district":
      return districtQueries(name, topic);
  }
}

export function getDeepDiveQueries(
  name: string,
  angle: string,
): readonly SearchQuery[] {
  return [
    { query: `${name} ${angle} Wisconsin 2026 detailed analysis`, limit: 5 },
    { query: `${name} ${angle} Wisconsin sources records data`, limit: 5 },
    { query: `${name} ${angle} news investigation report`, limit: 5, tbs: "qdr:y" },
  ];
}
