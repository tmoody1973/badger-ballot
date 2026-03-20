# Ballot Badger

> Digging into Wisconsin candidates so you don't have to.

A voice-first civic accountability agent for Wisconsin's 2026 elections. Ask conversational questions about candidates — voting records, campaign donors, fact-check ratings, endorsements — and the agent searches the web in real time, synthesizes findings, and presents them with source citations.

**Built for [ElevenHacks](https://elevenlabs.io/hacks) Hack #1: Firecrawl + ElevenAgents**

[Demo Video](#) <!-- TODO: Add demo video link after recording -->

## How It Works

1. **Browse** the candidate directory — Governor, Supreme Court, Attorney General, U.S. House, State Senate, Ballot Measures
2. **Pull the receipts** — the agent runs parallel Firecrawl searches across public records, news, and campaign finance data
3. **See the findings** — structured cards appear with voting records, donor tables, fact-check badges, and endorsement cards, each with citation links
4. **Go deeper** — ask follow-up questions and the agent runs focused searches on that specific angle
5. **Voice narration** — ElevenAgents speaks the findings while UI components render in sync via client tools

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Voice Agent | ElevenLabs ElevenAgents (React SDK, v3 Conversational model) |
| Web Search | Firecrawl SDK (Search API + Scrape API) |
| Synthesis | Claude Sonnet 4 (Anthropic SDK, structured JSON output) |
| Backend | Convex (candidates, search cache, conversation history) |
| UI | Tailwind CSS + neobrutalism.dev components (shadcn-based) |
| Fonts | DM Sans (headings), Public Sans (body), JetBrains Mono (data) |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Accounts: [Firecrawl](https://firecrawl.dev), [Anthropic](https://console.anthropic.com), [ElevenLabs](https://elevenlabs.io), [Convex](https://convex.dev)

### Installation

```bash
git clone https://github.com/tmoody1973/badger-ballot.git
cd badger-ballot
npm install
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
FIRECRAWL_API_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_ELEVEN_AGENT_ID=
ELEVENLABS_API_KEY=
```

### Development

```bash
# Start Convex (in one terminal)
npx convex dev

# Start Next.js (in another terminal)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
badger-ballot/
├── convex/                    # Convex backend
│   ├── schema.ts              # Database schema
│   ├── candidates.ts          # Candidate queries and seed mutation
│   ├── searchCache.ts         # Firecrawl result caching with TTL
│   ├── conversations.ts       # Conversation history persistence
│   └── knownUrls.ts           # Known URLs for demo candidate deep dives
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── receipts/      # Pass 1: parallel Firecrawl search + Claude synthesis
│   │   │   ├── deep-dive/     # Pass 2: focused search on specific angle
│   │   │   └── candidate/     # Quick profile lookup
│   │   ├── layout.tsx         # Root layout with Convex provider + fonts
│   │   ├── page.tsx           # Main app: directory + render area + voice bar
│   │   └── globals.css        # Neobrutalism + Wisconsin palette tokens
│   ├── components/
│   │   ├── CandidateCard.tsx   # Candidate profile card
│   │   ├── VoteRecord.tsx      # Voting record entry
│   │   ├── DonorTable.tsx      # Campaign finance table
│   │   ├── FactCheckBadge.tsx  # Fact-check rating badge
│   │   ├── EndorsementCard.tsx # Endorsement card
│   │   ├── MeasureCard.tsx     # Ballot measure card
│   │   ├── CitationLink.tsx    # Source URL citation link
│   │   ├── CandidateDirectory.tsx # Left sidebar candidate list
│   │   ├── ComponentRenderer.tsx  # Renders component array
│   │   ├── RaceFilter.tsx      # Neobrutalism nav menu filter bar
│   │   └── VoiceBar.tsx        # Bottom voice control bar
│   ├── data/candidates.ts     # 23 candidates/measures
│   ├── lib/
│   │   ├── firecrawl.ts       # Firecrawl SDK singleton
│   │   ├── query-templates.ts  # Per-type search queries
│   │   ├── synthesis.ts       # Claude Sonnet structured JSON synthesis
│   │   └── party.ts           # Party config and color helpers
│   └── types/index.ts         # TypeScript types
├── public/branding/           # Logo assets (SVG, PNG, AI)
├── background-docs/           # Architecture docs, hackathon requirements
└── docs/plans/                # Revised architecture design document
```

## Architecture

```
User speaks / clicks "Pull the receipts"
    │
    ▼
ElevenAgents (STT → LLM → TTS)  ←── or ──→  Click-based UI
    │
    ├── Server tool: pull_receipts
    │   ├── Candidate type detection → query template selection
    │   ├── 3 parallel Firecrawl searches (no scrape)
    │   ├── Claude Sonnet synthesis → structured JSON
    │   └── Returns: { candidate, votes, donors, factChecks, endorsements }
    │
    ├── Server tool: deep_dive (on follow-up)
    │   ├── 1-2 focused Firecrawl searches
    │   └── Detailed findings on specific angle
    │
    └── Client tools (non-blocking UI rendering):
        ├── show_candidate → CandidateCard
        ├── show_vote → VoteRecord
        ├── show_donors → DonorTable
        ├── show_fact_check → FactCheckBadge
        ├── show_endorsement → EndorsementCard
        └── show_measure → MeasureCard
```

## Wisconsin 2026 Coverage

| Race | Candidates |
|------|-----------|
| **Governor** (D primary) | Barnes, Rodriguez, Roys, Hong, Crowley, Brennan, Hughes, Hulsey, Roper |
| **Governor** (R primary) | Tiffany, Manske |
| **Supreme Court** (Apr 7) | Taylor (liberal) vs Lazar (conservative) |
| **Attorney General** | Kaul (D, incumbent) vs Toney (R) |
| **U.S. House WI-3** | Van Orden (R) vs Cooke, Pfaff, Shankland (D) — Toss-up |
| **U.S. House WI-1** | Steil (R, incumbent) — Lean R |
| **U.S. House WI-7** | Open seat — Felzkowski, Stroebel, Callahan (R) |
| **Ballot Measures** | Anti-DEI, Worship Closure, Partial Veto (all 3 certified) |
| **Local Referenda** | 72 school districts (Apr 7, searched on demand) |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CONVEX_DEPLOYMENT` | Convex deployment identifier | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL | Yes |
| `FIRECRAWL_API_KEY` | Firecrawl API key for web search | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude Sonnet | Yes |
| `NEXT_PUBLIC_ELEVEN_AGENT_ID` | ElevenLabs agent ID | For voice |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | For voice |

## Hackathon

**ElevenHacks Hack #1** — Combine Firecrawl Search with ElevenAgents.

- Prize pool: $19,480
- Tags: [@firecrawl](https://x.com/firecrawl) [@elevenlabs](https://x.com/elevenlabs) #ElevenHacks #CivicTech #Wisconsin2026

## License

MIT
