# Ballot Badger

> Digging into Wisconsin candidates so you don't have to.

A voice-first civic accountability agent for Wisconsin's 2026 elections. Ask about candidates, voting records, campaign donors, fact-checks, endorsements -- and the agent searches the web in real time, synthesizes findings, and presents them with source citations. It can also find your polling place and show what's on your ballot by navigating the state election site live.

**Built for [ElevenHacks](https://elevenlabs.io/hacks) Hack #1: Firecrawl + ElevenAgents**

**Live:** [badger-ballot.vercel.app](https://badger-ballot.vercel.app)

## How It Works

1. **Talk or click** -- start a voice session with ElevenAgents or click any candidate in the directory
2. **Pull the receipts** -- Firecrawl searches 40+ sources across Congress.gov, OpenSecrets, PolitiFact, and Wisconsin news outlets. Groq synthesizes everything into structured findings.
3. **See the findings** -- cards appear with voting records, donor tables, fundraising charts, fact-check badges, and endorsements, each with source links
4. **Go deeper** -- say "go deeper on donors" and a second pass runs targeted searches plus scrapes Transparency USA donor pages. A progress animation plays while results load.
5. **Find your polling place** -- say "where do I vote?" and the agent navigates myvote.wi.gov via Firecrawl's interact API, fills in your address, and pulls your polling place, hours, and ward
6. **Preview your ballot** -- same approach, returns every race and candidate on your actual ballot

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Voice Agent | ElevenLabs ElevenAgents (React SDK, v3 Conversational, GPT-OSS-120B LLM) |
| Web Search | Firecrawl v2 API (Search, Scrape, Interact) |
| Fast Synthesis | Groq (llama-3.3-70b-versatile) |
| Fallback Synthesis | Claude Sonnet 4 (Anthropic SDK) |
| Backend | Convex (candidates, search cache, conversations) |
| UI | Tailwind CSS + neobrutalism.dev (Wisconsin palette: blue #002986, gold #FFCC18) |
| Fonts | DM Sans (headings), Public Sans (body), JetBrains Mono (data) |
| Deployment | Vercel (120s function timeout for voter-info) |

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Accounts: [Firecrawl](https://firecrawl.dev), [Groq](https://console.groq.com), [ElevenLabs](https://elevenlabs.io), [Convex](https://convex.dev)

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
GROQ_API_KEY=
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
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── candidates.ts             # Candidate queries and seed data
│   ├── searchCache.ts            # Firecrawl result caching with TTL
│   └── conversations.ts          # Conversation history
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── receipts/         # Pass 1: Fireplexity search + Groq synthesis
│   │   │   ├── deep-dive/        # Pass 2: targeted search + Transparency USA scrape
│   │   │   ├── voter-info/       # Firecrawl interact → myvote.wi.gov (polling, ballot)
│   │   │   ├── eleven-signed-url/# ElevenLabs signed URL for voice
│   │   │   ├── finance/          # Campaign finance lookup
│   │   │   └── candidate/        # Quick profile lookup
│   │   ├── page.tsx              # Main app: directory + render area + voice bar
│   │   └── globals.css           # Neobrutalism + Wisconsin palette tokens
│   ├── components/
│   │   ├── CandidateCard.tsx     # Candidate profile with photo
│   │   ├── CandidateDirectory.tsx# Left sidebar candidate list
│   │   ├── RaceComparison.tsx    # Horizontal carousel comparing candidates in a race
│   │   ├── VoteRecord.tsx        # Voting record entry
│   │   ├── DonorTable.tsx        # Campaign finance donor table
│   │   ├── FundraisingChart.tsx  # Bar chart of top donors
│   │   ├── FactCheckBadge.tsx    # Fact-check rating badge
│   │   ├── EndorsementCard.tsx   # Endorsement card
│   │   ├── NewsHeadline.tsx      # News article card
│   │   ├── PlatformCard.tsx      # Policy position card
│   │   ├── MeasureCard.tsx       # Ballot measure card
│   │   ├── PollingPlaceCard.tsx  # Polling place with address, hours, ward, countdown
│   │   ├── BallotPreviewCard.tsx # Ballot races list
│   │   ├── DiggingProgress.tsx   # Animated research progress + quick facts
│   │   ├── DeepDiveProgress.tsx  # Deep dive loading animation
│   │   ├── DeepDiveResults.tsx   # Self-contained deep dive results block
│   │   ├── ComponentRenderer.tsx # Routes component types to UI components
│   │   ├── RaceFilter.tsx        # Race category filter bar
│   │   └── VoiceBar.tsx          # Bottom voice control bar
│   ├── data/candidates.ts        # 28 candidates and ballot measures
│   ├── lib/
│   │   ├── fireplexity.ts        # Fireplexity pipeline: Firecrawl v2 + Groq synthesis
│   │   ├── query-templates.ts    # Per-type search queries + known finance URLs
│   │   ├── useVoiceAgent.ts      # Voice agent hook with 14 client tools
│   │   ├── firecrawl.ts          # Firecrawl SDK singleton
│   │   ├── synthesis.ts          # Claude-based synthesis (deep dive fallback)
│   │   └── party.ts              # Party config and color helpers
│   └── types/index.ts            # TypeScript types
├── tool_configs/                  # ElevenAgents tool definitions (pulled via CLI)
├── public/branding/               # Logo assets (SVG, PNG)
└── docs/                          # Architecture docs, demo scripts
```

## Architecture

```
User speaks or clicks a candidate
    │
    ▼
ElevenAgents (STT → GPT-OSS-120B → TTS)  ←── or ──→  Click-based UI
    │
    ├── Client tool: show_candidate → CandidateCard
    │   └── Triggers Fireplexity pipeline:
    │       ├── 5 parallel Firecrawl v2 searches (web + news)
    │       ├── Content scoring + deduplication
    │       ├── Groq llama-3.3-70b synthesis → structured JSON
    │       └── Returns: candidate, votes, donors, factChecks, endorsements, news
    │
    ├── Client tool: deep_dive (non-blocking)
    │   ├── 3 targeted Firecrawl searches on specific angle
    │   ├── Transparency USA donor page scrape (if finance angle)
    │   ├── Groq synthesis with finance-aggressive prompt
    │   └── DeepDiveResults renders as self-contained block
    │
    ├── Client tool: lookup_voter_info (non-blocking)
    │   ├── Firecrawl scrape → gets browser session (scrapeId)
    │   ├── Firecrawl interact → fills myvote.wi.gov form + reads results
    │   └── PollingPlaceCard or BallotPreviewCard renders on screen
    │
    └── Client tools: show_vote, show_donors, show_fact_check,
        show_endorsement, show_measure, show_race_comparison,
        select_candidate, set_filter, clear_results
```

## Voter Services

The app navigates Wisconsin's official election site (myvote.wi.gov) live using Firecrawl's interact API:

| Feature | What happens |
|---------|-------------|
| **Polling place** | Fills address form, clicks Search, reads polling location, hours, ward |
| **Ballot preview** | Same flow, reads every race and candidate on your actual ballot |
| **Registration** | Returns registration options (online, mail, in-person) |

These use a two-step approach for polling place (fill+click, then read) and a single-step for ballot (needs the full timeout for results to load).

## Wisconsin 2026 Coverage

| Race | Candidates |
|------|-----------|
| **Governor** (D primary) | Barnes, Rodriguez, Roys, Hong, Crowley, Brennan, Hughes, Hulsey, Roper |
| **Governor** (R primary) | Tiffany, Manske |
| **Supreme Court** (Apr 7) | Taylor vs Lazar |
| **Attorney General** | Kaul (D) vs Toney (R) |
| **U.S. House WI-3** | Van Orden (R) vs Cooke, Pfaff, Shankland (D) |
| **U.S. House WI-1** | Steil (R, incumbent) |
| **State Senate** | Key swing districts under new fair maps |
| **Ballot Measures** | Anti-DEI amendment, Worship Closure, Partial Veto |

28 total candidates and measures tracked.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CONVEX_DEPLOYMENT` | Convex deployment identifier | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL | Yes |
| `FIRECRAWL_API_KEY` | Firecrawl API key for web search + interact | Yes |
| `GROQ_API_KEY` | Groq API key for fast synthesis | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key (fallback synthesis) | Fallback |
| `NEXT_PUBLIC_ELEVEN_AGENT_ID` | ElevenLabs agent ID | For voice |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for signed URLs | For voice |

## ElevenAgents Voice Configuration

The voice agent has 14 tools configured via the ElevenLabs CLI:

```bash
# Pull current tools
ELEVENLABS_API_KEY=... elevenlabs tools pull --all

# Push updated tools
ELEVENLABS_API_KEY=... elevenlabs tools push
```

Tool configs live in `tool_configs/`. The agent also has Firecrawl MCP for direct web search.

## How ElevenLabs + Firecrawl Work Together

This is the core integration the hackathon is evaluating. Every user interaction flows through both platforms.

### The Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: "Tell me about Tom Tiffany"                                      │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ELEVENLABS ELEVENAGENTS                                                 │
│                                                                          │
│  1. Speech-to-text converts audio to text                                │
│  2. GPT-OSS-120B LLM decides which tools to call                        │
│  3. Calls show_candidate client tool → React renders CandidateCard       │
│  4. App triggers Fireplexity pipeline in background                      │
│  5. Text-to-speech narrates findings as they arrive                      │
│  6. Agent keeps talking while results render on screen                   │
└──────────┬───────────────────────────────────┬──────────────────────────┘
           │                                   │
           │  Client tool triggers             │  Agent narrates
           ▼                                   ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  FIRECRAWL v2 SEARCH API             │  │  ELEVENLABS VOICE OUTPUT     │
│                                      │  │                              │
│  5 parallel searches fire:           │  │  "Tom Tiffany is a           │
│  ┌──────────────────────────────┐    │  │   Republican congressman     │
│  │ congress.gov voting record   │    │  │   from Wisconsin's 7th       │
│  │ opensecrets.org donors       │    │  │   district, now running      │
│  │ politifact.com fact checks   │    │  │   for governor..."           │
│  │ wisconsin news (last month)  │    │  │                              │
│  │ policy positions + platforms │    │  │  Voice continues while       │
│  └──────────────────────────────┘    │  │  cards build on screen       │
│                                      │  └──────────────────────────────┘
│  Returns: 40+ sources with full      │
│  markdown content from each page     │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  GROQ SYNTHESIS (llama-3.3-70b)      │
│                                      │
│  Structured JSON output:             │
│  - votes: [{bill, vote, context}]    │
│  - donors: [{name, amount, type}]    │
│  - factChecks: [{claim, rating}]     │
│  - endorsements, platform, news      │
│  - summary with key finding          │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  REACT UI (rendered by ElevenAgents client tools)                        │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Candidate   │ │ Vote        │ │ Donor       │ │ Fact Check  │       │
│  │ Card        │ │ Record      │ │ Table       │ │ Badge       │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       │
│  │ Fundraising │ │ News        │ │ Endorsement │                       │
│  │ Chart       │ │ Headline    │ │ Card        │                       │
│  └─────────────┘ └─────────────┘ └─────────────┘                       │
│                                                                          │
│  Cards stagger in 500ms apart while the voice agent narrates             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Deep Dive Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: "Go deeper on his donors"                                        │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ELEVENLABS ELEVENAGENTS                                                 │
│                                                                          │
│  LLM calls deep_dive client tool with:                                   │
│    { candidate: "Tom Tiffany", angle: "donors and campaign finance" }    │
│                                                                          │
│  Tool returns IMMEDIATELY → agent keeps talking about what it already    │
│  knows while the deep dive runs in background                            │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  FIRECRAWL SEARCH (3 queries)        │  │  FIRECRAWL SCRAPE            │
│                                      │  │                              │
│  Targeted finance queries:           │  │  Scrapes Transparency USA    │
│  - "Tiffany" campaign finance donors │  │  donor page for this         │
│  - fundraising raised top donors     │  │  candidate — itemized        │
│  - Wisconsin 2026 campaign finance   │  │  contribution records        │
│                                      │  │                              │
│  Runs in PARALLEL with scrape ──────►│  │  transparencyusa.org/wi/     │
└──────────┬───────────────────────────┘  │  candidate/tom-tiffany/      │
           │                              │  contributors                │
           │                              └──────────┬───────────────────┘
           │                                         │
           └─────────────┬───────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────┐
│  GROQ SYNTHESIS                      │
│                                      │
│  Finance-aggressive prompt:          │
│  - Extract EVERY dollar amount       │
│  - Individual donors + PACs          │
│  - Total raised figures              │
│  - Contribution limit context        │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  UI: Self-contained Deep Dive block                                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  🦡 DEEP DIVE: donors          19 sources    [Pass 2]       │       │
│  ├──────────────────────────────────────────────────────────────┤       │
│  │  Donor Table: Uihlein $1M, Enbridge $2.5K, ...              │       │
│  │  News: "Tiffany and billionaire donors bringing Project..."  │       │
│  │  News: "Crowley and Tiffany lead fundraising..."             │       │
│  └──────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
```

### Voter Lookup Flow (Firecrawl Browser Automation)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: "Where do I vote? 1108 W Chambers St, Milwaukee"                 │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ELEVENLABS ELEVENAGENTS                                                 │
│                                                                          │
│  LLM calls lookup_voter_info client tool (NON-BLOCKING)                  │
│  Returns immediately: "Looking up your info. Your next election is       │
│  April 7th. Remember to bring a photo ID."                               │
│                                                                          │
│  Agent KEEPS TALKING while Firecrawl navigates the government site       │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  FIRECRAWL INTERACT API (browser automation on myvote.wi.gov)            │
│                                                                          │
│  Step 1: Scrape https://myvote.wi.gov/en-US/FindMyPollingPlace           │
│           → Gets a browser session (scrapeId)                            │
│                                                                          │
│  Step 2: Interact with prompt:                                           │
│           "Fill Street Address with '1108 W Chambers St'.                │
│            Fill City with 'Milwaukee'. Fill Zip with '53206'.            │
│            Click Search. Wait for results."                              │
│           → Firecrawl's AI fills the form, clicks, reads results         │
│                                                                          │
│  Step 3: Read results (polling place only — separate interact call)      │
│           "Read the polling place results. Tell me Name, Address,        │
│            Hours, Ward."                                                 │
│           → Returns structured plain text                                │
│                                                                          │
│  Step 4: Clean up browser session                                        │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  UI: PollingPlaceCard                                                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  📍 Your Polling Place                                       │       │
│  │  ┌────────────────────────────────────────────────────────┐  │       │
│  │  │ April 7, 2026 — Spring Election          [14 days]     │  │       │
│  │  └────────────────────────────────────────────────────────┘  │       │
│  │  POLLING PLACE                                               │       │
│  │  Lafollette, Robert M. Elementary School                     │       │
│  │  3239 N 9th St, Milwaukee, WI 53206                          │       │
│  │  🕐 7:00 AM - 8:00 PM                                       │       │
│  │  Ward 113                                                    │       │
│  │  [Verify on MyVote →]  [Vote Absentee]                       │       │
│  └──────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
```

### Why This Integration Matters

**ElevenLabs provides:**
- Voice-first interface (speech-to-text, LLM reasoning, text-to-speech)
- Tool orchestration (decides when to search, when to deep dive, when to look up voter info)
- Non-blocking client tools (UI renders while the agent keeps talking)
- Natural conversation flow (follow-ups, topic changes, clarifications)

**Firecrawl provides:**
- Web search across 40+ sources per candidate (Firecrawl v2 Search API)
- Full page content extraction with markdown (not just snippets)
- Live browser automation on government sites (Firecrawl Interact API)
- Form filling, button clicking, result reading on myvote.wi.gov
- Transparency USA donor page scraping for itemized contribution records

**Together:**
- A voter asks a question by voice
- ElevenLabs understands the intent and calls the right tool
- Firecrawl fetches the data from the real web in real time
- Groq synthesizes it into structured findings
- ElevenLabs narrates the findings while the UI builds on screen
- No pre-cached data. No static database. Everything is live.

## Hackathon

**ElevenHacks Hack #1** -- Combine Firecrawl Search with ElevenAgents.

- ElevenLabs handles voice conversation and tool orchestration
- Firecrawl handles web search, content extraction, and browser automation on government sites
- Groq handles fast LLM synthesis
- Together they turn a question into a civic research report with sources you can verify

Tags: [@firecrawl](https://x.com/firecrawl) [@elevenlabs](https://x.com/elevenlabs) #ElevenHacks #CivicTech #Wisconsin2026

## License

MIT
