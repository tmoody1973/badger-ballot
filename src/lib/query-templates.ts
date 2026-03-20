import type { CandidateType } from "@/types";

interface QueryTemplate {
  readonly queries: readonly string[];
}

function incumbentQueries(candidate: string, topic?: string): QueryTemplate {
  const t = topic ?? "record";
  return {
    queries: [
      `${candidate} voting record ${t} Wisconsin`,
      `${candidate} ${t} Wisconsin 2026 position statement`,
      `${candidate} ${t} fact check politifact Wisconsin`,
    ],
  };
}

function challengerQueries(candidate: string, topic?: string): QueryTemplate {
  const t = topic ?? "platform";
  return {
    queries: [
      `${candidate} campaign platform ${t} Wisconsin 2026`,
      `${candidate} endorsements background Wisconsin`,
      `${candidate} ${t} news coverage Wisconsin 2026`,
    ],
  };
}

function openSeatQueries(candidate: string, topic?: string): QueryTemplate {
  const t = topic ?? "platform";
  return {
    queries: [
      `${candidate} background ${t} Wisconsin`,
      `${candidate} endorsements fundraising Wisconsin 2026`,
      `${candidate} ${t} news coverage Wisconsin`,
    ],
  };
}

function measureQueries(measureName: string, topic?: string): QueryTemplate {
  const t = topic ?? "analysis";
  return {
    queries: [
      `Wisconsin ${measureName} amendment ${t} 2026`,
      `Wisconsin ${measureName} amendment funding for against`,
      `Wisconsin ${measureName} amendment similar states impact`,
    ],
  };
}

function districtQueries(districtName: string, topic?: string): QueryTemplate {
  const t = topic ?? "race";
  return {
    queries: [
      `Wisconsin ${districtName} 2026 ${t} candidates`,
      `Wisconsin ${districtName} demographics voting history`,
      `Wisconsin ${districtName} 2026 competitive rating forecast`,
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
): readonly string[] {
  return [
    `${name} ${angle} Wisconsin 2026 detailed`,
    `${name} ${angle} Wisconsin sources data`,
  ];
}
