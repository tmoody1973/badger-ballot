/**
 * Convert structured receipts JSON into OpenUI Lang for the Renderer.
 * This is deterministic — no LLM needed. We map data → component syntax.
 */

interface ReceiptsData {
  candidate?: {
    name?: string;
    party?: string;
    office?: string;
    currentRole?: string;
    keyFact?: string;
    type?: string;
  };
  votes?: Array<{
    bill?: string;
    vote?: string;
    context?: string;
    date?: string;
    source?: string;
    sourceUrl?: string;
  }>;
  donors?: {
    donors?: Array<{ name?: string; amount?: string; type?: string }>;
    totalRaised?: string;
    source?: string;
    sourceUrl?: string;
  } | null;
  factChecks?: Array<{
    claim?: string;
    rating?: string;
    source?: string;
    sourceUrl?: string;
    year?: string;
  }>;
  endorsements?: Array<{
    endorser?: string;
    type?: string;
    context?: string;
    sourceUrl?: string;
  }>;
  platform?: Array<{
    issue?: string;
    position?: string;
    source?: string;
    sourceUrl?: string;
  }>;
  news?: Array<{
    headline?: string;
    source?: string;
    sourceUrl?: string;
    date?: string;
    summary?: string;
  }>;
  summary?: {
    officialSources?: number;
    newsSources?: number;
    factCheckSources?: number;
    keyFinding?: string;
  };
  source_count?: number;
}

function esc(s: string | undefined): string {
  return (s ?? "").replace(/"/g, '\\"');
}

export function toOpenUILang(data: ReceiptsData): string {
  const lines: string[] = [];
  const children: string[] = [];

  // Candidate profile
  if (data.candidate?.name) {
    const c = data.candidate;
    lines.push(`cp = CandidateProfile("${esc(c.name)}", "${esc(c.party)}", "${esc(c.office)}", "${esc(c.currentRole)}", "${esc(c.keyFact)}", "medium")`);
    children.push("cp");
  }

  // Votes
  if (data.votes) {
    data.votes.forEach((v, i) => {
      const id = `v${i + 1}`;
      lines.push(`${id} = VoteCard("${esc(v.bill)}", "${esc(v.vote)}", "${esc(v.context)}", "${esc(v.date)}", "${esc(v.source)}", "${esc(v.sourceUrl)}")`);
      children.push(id);
    });
  }

  // Donors
  if (data.donors?.donors && data.donors.donors.length > 0) {
    const donorsJson = JSON.stringify(data.donors.donors.map(d => ({
      name: d.name ?? "",
      amount: d.amount ?? "",
      type: d.type ?? "",
    }))).replace(/"/g, '\\"');
    lines.push(`dl = DonorList("${esc(data.candidate?.name)}", "${esc(data.donors.totalRaised)}", "${esc(data.donors.source)}", "${esc(data.donors.sourceUrl)}", "${donorsJson}")`);
    children.push("dl");
  }

  // Fact checks
  if (data.factChecks) {
    data.factChecks.forEach((fc, i) => {
      const id = `fc${i + 1}`;
      lines.push(`${id} = FactCheck("${esc(fc.claim)}", "${esc(fc.rating)}", "${esc(fc.source)}", "${esc(fc.sourceUrl)}", "${esc(fc.year)}", "${esc(data.candidate?.name)}")`);
      children.push(id);
    });
  }

  // News
  if (data.news) {
    data.news.forEach((n, i) => {
      const id = `n${i + 1}`;
      lines.push(`${id} = NewsItem("${esc(n.headline)}", "${esc(n.source)}", "${esc(n.sourceUrl)}", "${esc(n.date)}", "${esc(n.summary)}")`);
      children.push(id);
    });
  }

  // Endorsements
  if (data.endorsements) {
    data.endorsements.forEach((e, i) => {
      const id = `e${i + 1}`;
      lines.push(`${id} = EndorsementBadge("${esc(e.endorser)}", "${esc(e.type)}", "${esc(e.context)}", "${esc(data.candidate?.name)}", "${esc(e.sourceUrl)}")`);
      children.push(id);
    });
  }

  // Platform positions
  if (data.platform) {
    data.platform.forEach((p, i) => {
      const id = `p${i + 1}`;
      lines.push(`${id} = PolicyPosition("${esc(p.issue)}", "${esc(p.position)}", "${esc(p.source)}", "${esc(p.sourceUrl)}")`);
      children.push(id);
    });
  }

  // Root container
  const sourceCount = String(data.source_count ?? 0);
  const title = `${data.candidate?.name ?? "Candidate"} — Findings`;
  const rootLine = `root = FindingsStack("${esc(title)}", "${sourceCount}")`;

  // Build final output: root first, then children via <<
  const output = [rootLine];
  for (const child of children) {
    output.push(`root << ${child}`);
  }
  output.push(...lines);

  return output.join("\n");
}
