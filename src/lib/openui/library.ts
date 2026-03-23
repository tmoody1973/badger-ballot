import { createLibrary } from "@openuidev/react-lang";
import type { PromptOptions } from "@openuidev/react-lang";
import {
  CandidateProfile,
  VoteCard,
  DonorList,
  FactCheck,
  NewsItem,
  EndorsementBadge,
  PolicyPosition,
  FindingsStack,
  BallotMeasure,
} from "./components";

export const ballotBadgerLibrary = createLibrary({
  root: "FindingsStack",
  components: [
    FindingsStack,
    CandidateProfile,
    VoteCard,
    DonorList,
    FactCheck,
    NewsItem,
    EndorsementBadge,
    PolicyPosition,
    BallotMeasure,
  ],
  componentGroups: [
    {
      name: "Candidate Research",
      components: ["CandidateProfile", "VoteCard", "DonorList", "FactCheck"],
      notes: [
        "Use FindingsStack as root container for all candidate findings.",
        "Use CandidateProfile first, then add findings as children.",
        "Use VoteCard for each voting record entry.",
        "Use DonorList when campaign finance data is available. donors prop is a JSON array string.",
      ],
    },
    {
      name: "News & Context",
      components: ["NewsItem", "EndorsementBadge", "PolicyPosition"],
      notes: [
        "Use NewsItem for recent headlines about the candidate.",
        "Use EndorsementBadge for each endorsement.",
        "Use PolicyPosition for specific policy stances.",
      ],
    },
    {
      name: "Ballot Measures",
      components: ["BallotMeasure"],
      notes: [
        "Use BallotMeasure for constitutional amendments and referenda.",
        "forArgs and againstArgs are comma-separated strings.",
      ],
    },
  ],
});

export const ballotBadgerPromptOptions: PromptOptions = {
  preamble:
    "You are Ballot Badger, a nonpartisan civic research agent for Wisconsin 2026 elections. When presenting research findings, use OpenUI Lang components. For conversational answers, use plain text.",
  additionalRules: [
    "ALWAYS use FindingsStack as root when presenting candidate research.",
    "ALWAYS start with a CandidateProfile component.",
    "Use VoteCard for each voting record found. Include sourceUrl when available.",
    "Use DonorList when campaign finance data exists. Pass donors as a JSON array string.",
    "Use FactCheck for each PolitiFact or fact-check finding.",
    "Use NewsItem for recent headlines about the candidate.",
    "Use PolicyPosition for specific policy stances with sources.",
    "Use EndorsementBadge for endorsements.",
    "Use BallotMeasure for constitutional amendments.",
    "Include sourceUrl from the search results whenever possible.",
    "Do not wrap conversational responses in components.",
  ],
  examples: [
    `root = FindingsStack("Tom Tiffany — Findings", "30")
root << cp1
root << v1
root << d1
root << fc1
root << n1
cp1 = CandidateProfile("Tom Tiffany", "Republican", "Governor", "U.S. Rep, WI-7", "Freedom Caucus. Trump-endorsed. Only major R.", "high")
v1 = VoteCard("Great American Outdoors Act", "Nay", "Voted against bipartisan conservation bill with broad support.", "2020", "Congress.gov", "https://congress.gov/bill/116th-congress/house-bill/1957")
d1 = DonorList("Tom Tiffany", "$2.1M", "OpenSecrets", "https://opensecrets.org/members-of-congress/tom-tiffany", "[{\\"name\\":\\"Diane Hendricks\\",\\"amount\\":\\"$20,000\\",\\"type\\":\\"Individual\\"},{\\"name\\":\\"Dick Uihlein\\",\\"amount\\":\\"$20,000\\",\\"type\\":\\"Individual\\"}]")
fc1 = FactCheck("Claims to support local control of public lands", "Mostly False", "PolitiFact", "https://politifact.com/factchecks/tom-tiffany", "2025", "Tom Tiffany")
n1 = NewsItem("Tiffany leads Wisconsin governor race fundraising with $2 million", "Wisconsin Examiner", "https://wisconsinexaminer.com/2026/01/16/crowley-and-tiffany-lead-fundraising", "Jan 2026", "Republican frontrunner has raised $2.1M, outpacing all Democratic candidates.")`,
  ],
};

export function getBallotBadgerOpenUIPrompt(): string {
  return ballotBadgerLibrary.prompt(ballotBadgerPromptOptions);
}
