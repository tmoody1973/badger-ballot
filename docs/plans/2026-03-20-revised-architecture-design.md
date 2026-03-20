# Ballot Badger — Revised Architecture Design
## Firecrawl x ElevenAgents Hackathon (ElevenHacks)
### March 20, 2026

---

## Overview

A voice-first civic accountability agent for Wisconsin's 2026 elections. Users ask conversational questions about candidates and ballot measures. The agent searches the web in real time via Firecrawl, synthesizes findings via Claude Sonnet, narrates them through ElevenAgents voice, and renders visual components on screen synchronized with the narration via client tools.

**Tagline:** "Ballot Badger — digging into Wisconsin candidates so you don't have to."

**Hackathon:** ElevenHacks Hack #1 — Firecrawl Search + ElevenAgents. 6-day build. Deadline ~March 26, 2026.

---

## Key Architecture Decisions (from brainstorm)

### 1. No OpenUI

The original spec used OpenUI Lang to generate dynamic UI from the same LLM call. This is removed. Instead, pre-built React components are rendered directly via ElevenAgents client tools. Reasons:

- Eliminates a dependency and an entire rendering layer
- No dual-output synthesis prompt to debug
- Components are hand-built with neobrutalism styling — more control, more distinctive
- Client tools provide natural voice-visual sync (see below)

### 2. Client Tools for Voice-Visual Sync

The core differentiator: visual components appear on screen in sync with what the agent is saying. This is achieved through ElevenAgents client tools.

**How it works:** The agent's LLM narrates findings and calls non-blocking client tools at the appropriate moment in its narration. Each client tool triggers a React state update that renders a component. Because the LLM controls both the narration and the tool calls, they are naturally synchronized.

Example flow:
```
Agent says: "Here's what I found on Tom Tiffany..."
  → calls client tool: show_candidate({ name: "Tom Tiffany", ... })
  → CandidateCard appears on screen

Agent says: "Congress.gov shows he objected to Arizona and Pennsylvania certification..."
  → calls client tool: show_vote({ bill: "Electoral Certification", vote: "Objected", ... })
  → VoteRecord appears on screen

Agent says: "On the money side, Club for Growth gave $15,000..."
  → calls client tool: show_donors({ donors: [...], ... })
  → DonorTable appears on screen
```

No SSE side channels. No timed reveals. No OpenUI rendering. The LLM sequences everything.

### 3. Two-Pass Conversational Design

Not a latency optimization — a conversation design choice.

- **Pass 1** gives the broad briefing. The agent presents 2-4 key findings across categories.
- **Pass 2+** goes deeper on whatever the user asks about. Each follow-up is a fresh Firecrawl search.
- The conversation is open-ended. Users can keep asking questions indefinitely.

The "digging" delay (3-5s while Firecrawl searches) is part of the brand. The agent says "Let me dig into that..." while the search runs. This signals real work and plays on the badger metaphor.

### 4. Candidate Type-Aware Search

Different candidate types get different Firecrawl query templates:

| Type | Examples | Query Focus |
|------|----------|-------------|
| `incumbent` | Tiffany, Van Orden, Steil, Kaul | Voting record, donors, fact checks |
| `challenger` | Barnes, Cooke, Manske | Campaign platform, endorsements, news coverage |
| `open_seat` | Felzkowski, Clark | Background, endorsements, fundraising |
| `measure` | Anti-DEI, Worship, Veto | Amendment text, funding for/against, analysis |
| `district` | SD-5, SD-15 | Demographics, candidates, competitive rating |

Claude Sonnet handles empty categories gracefully — if a challenger has no voting record, it skips that section.

### 5. Known URL Lookup + Cache Warming (Demo Candidates Only)

For the 5-6 candidates featured in the demo video, collect known URLs (Ballotpedia, OpenSecrets, Congress.gov, campaign sites).

- **Pass 1** always uses Firecrawl Search (live search is impressive for judges)
- **Pass 2** uses targeted Firecrawl scrape on known URLs when available, falls back to search otherwise
- **Cache warming script** pre-scrapes all known URLs before the demo for <1s deep dives

Other candidates in the directory work with search-only for both passes.

---

## System Architecture

```
User speaks
    │
    ▼
ElevenAgents (STT → LLM → TTS)
    │
    ├── Knowledge base (instant): candidate list, key dates, static context
    │
    ├── Server tool: pull_receipts(candidate, topic?)
    │   └── Middleware API (Next.js on Vercel)
    │       ├── Determine candidate type → select query templates
    │       ├── Firecrawl Search (3 parallel queries, no scrape)
    │       ├── Claude Sonnet synthesizes → structured JSON
    │       └── Returns: { candidate, votes, donors, factChecks, endorsements, ... }
    │
    ├── Server tool: deep_dive(candidate, angle)
    │   └── Middleware API
    │       ├── Check known URL lookup → targeted scrape if available
    │       ├── Otherwise: Firecrawl Search (1-2 focused queries)
    │       ├── Claude Sonnet synthesizes → structured JSON
    │       └── Returns: detailed data for the specific angle
    │
    ├── Server tool: candidate_profile(candidate)
    │   └── Middleware API
    │       └── Returns candidate bio from knowledge base (no Firecrawl)
    │
    └── Client tools (non-blocking, render UI):
        ├── show_candidate → CandidateCard component
        ├── show_vote → VoteRecord component
        ├── show_donors → DonorTable component
        ├── show_fact_check → FactCheckBadge component
        ├── show_endorsement → EndorsementCard component
        └── show_measure → MeasureCard component
```

---

## Tech Stack

```
Framework:      Next.js 14+ (App Router)
Voice:          ElevenLabs ElevenAgents (React SDK + client tools)
Search:         Firecrawl SDK (Search API + Scrape API)
Synthesis:      Claude Sonnet 4 (structured JSON output)
UI:             React + Tailwind CSS + neobrutalism.dev components
Deployment:     Vercel
```

Three external dependencies: ElevenLabs SDK, Firecrawl SDK, Anthropic SDK.

---

## Tool Definitions

### Server Tools

#### `pull_receipts`
**Trigger:** User asks about a candidate or measure broadly.
**Input:**
```json
{
  "candidate": "string — candidate name or measure ID",
  "topic": "string? — optional focus area"
}
```
**Middleware logic:**
1. Look up candidate type from directory data
2. Select query templates based on type
3. Run 3 parallel Firecrawl searches (no scrapeOptions)
4. Feed all snippets to Claude Sonnet with synthesis prompt
5. Return structured JSON

**Output:**
```json
{
  "candidate": { "name", "party", "office", "currentRole", "keyFact", "type" },
  "votes": [{ "bill", "vote", "context", "date", "source" }],
  "donors": { "donors": [{ "name", "amount", "type", "cycle" }], "totalRaised", "source" },
  "factChecks": [{ "claim", "rating", "source", "year" }],
  "endorsements": [{ "endorser", "type", "context" }],
  "platform": [{ "issue", "position", "source" }],
  "summary": { "officialSources", "newsSources", "factCheckSources", "keyFinding" }
}
```
All fields optional. Claude Sonnet populates what it finds, skips what it doesn't.

#### `deep_dive`
**Trigger:** User asks a follow-up like "go deeper on the donors" or "what about his stance on abortion?"
**Input:**
```json
{
  "candidate": "string",
  "angle": "string — the specific topic to research"
}
```
**Middleware logic:**
1. Check known URL lookup for this candidate + angle
2. If known URL exists: Firecrawl scrape (with maxAge caching)
3. If not: 1-2 focused Firecrawl searches
4. Claude Sonnet synthesizes with angle-specific prompt
5. Return structured JSON (same schema as pull_receipts, but deeper on one category)

#### `candidate_profile`
**Trigger:** User asks "who's running?" or "tell me about Rebecca Cooke."
**Input:**
```json
{
  "candidate": "string? — specific candidate, or omit for full field"
}
```
**Logic:** Returns data from ElevenAgents knowledge base. No Firecrawl, no synthesis. Instant response.

### Client Tools (Non-Blocking)

All registered via `useConversation({ clientTools: { ... } })` in the React SDK. All return `"displayed"` immediately. None block the agent's speech.

#### `show_candidate`
```json
{ "name", "party", "office", "currentRole", "keyFact", "findingsCount", "severity" }
```
Renders: CandidateCard component

#### `show_vote`
```json
{ "bill", "vote", "context", "date", "source", "candidate" }
```
Renders: VoteRecord component (appends to list)

#### `show_donors`
```json
{ "candidate", "donors": [{ "name", "amount", "type", "cycle" }], "totalRaised", "source" }
```
Renders: DonorTable component

#### `show_fact_check`
```json
{ "claim", "rating", "source", "year", "candidate" }
```
Renders: FactCheckBadge component (appends to list)

#### `show_endorsement`
```json
{ "endorser", "type", "context", "candidate" }
```
Renders: EndorsementCard component (appends to list)

#### `show_measure`
```json
{ "title", "summary", "forArguments": [], "againstArguments": [], "sponsors", "funding" }
```
Renders: MeasureCard component

---

## Firecrawl Query Templates

### Incumbent
```
Query 1: "{candidate} voting record {topic} Wisconsin"
Query 2: "{candidate} {topic} Wisconsin 2026 position statement"
Query 3: "{candidate} {topic} fact check politifact Wisconsin"
```

### Challenger
```
Query 1: "{candidate} campaign platform {topic} Wisconsin 2026"
Query 2: "{candidate} endorsements background Wisconsin"
Query 3: "{candidate} {topic} news coverage Wisconsin 2026"
```

### Open Seat
```
Query 1: "{candidate} background {topic} Wisconsin"
Query 2: "{candidate} endorsements fundraising Wisconsin 2026"
Query 3: "{candidate} {topic} news coverage Wisconsin"
```

### Ballot Measure
```
Query 1: "Wisconsin {measure_name} amendment analysis 2026"
Query 2: "Wisconsin {measure_name} amendment funding for against"
Query 3: "Wisconsin {measure_name} amendment similar states impact"
```

### District
```
Query 1: "Wisconsin {district} 2026 race candidates"
Query 2: "Wisconsin {district} demographics voting history"
Query 3: "Wisconsin {district} 2026 competitive rating forecast"
```

---

## Known URL Lookup (Demo Candidates)

Pre-collected for the 5-6 candidates featured in the demo video.

### Tom Tiffany (incumbent)
```json
{
  "ballotpedia": "https://ballotpedia.org/Tom_Tiffany",
  "opensecrets": "https://www.opensecrets.org/members-of-congress/tom-tiffany/summary",
  "congress_gov": "https://www.congress.gov/member/tom-tiffany/T000165",
  "campaign": "TBD"
}
```

### Derrick Van Orden (incumbent)
```json
{
  "ballotpedia": "https://ballotpedia.org/Derrick_Van_Orden",
  "opensecrets": "https://www.opensecrets.org/members-of-congress/derrick-van-orden/summary",
  "congress_gov": "https://www.congress.gov/member/derrick-van-orden/V000135",
  "campaign": "TBD"
}
```

### Mandela Barnes (challenger)
```json
{
  "ballotpedia": "https://ballotpedia.org/Mandela_Barnes",
  "opensecrets": "https://www.opensecrets.org/members-of-congress/mandela-barnes/summary",
  "campaign": "TBD"
}
```

### Rebecca Cooke (challenger)
```json
{
  "ballotpedia": "https://ballotpedia.org/Rebecca_Cooke",
  "campaign": "TBD"
}
```

### Ballot Measures
```json
{
  "anti_dei": "https://ballotpedia.org/Wisconsin_Prohibit_Government_Discrimination_or_Preferential_Treatment_Amendment_(2026)",
  "worship": "https://ballotpedia.org/Wisconsin_Prohibit_Government_Closure_of_Places_of_Worship_During_Emergencies_Amendment_(2026)",
  "veto": "https://ballotpedia.org/Wisconsin_Prohibit_Partial_Veto_to_Increase_Tax_or_Fee_Amendment_(2026)"
}
```

**Cache warming:** Run a script that scrapes each URL via Firecrawl before the demo. This populates Firecrawl's cache so Pass 2 deep dives on these pages return in <1s.

---

## Candidate Directory (Updated March 20, 2026)

### Governor — Democrats (~10 candidates)
| Name | Type | Current Role | Key Fact |
|------|------|-------------|----------|
| Mandela Barnes | challenger | Fmr Lt. Governor | Lost 2022 Senate by 1pt. Frontrunner. $555K first 29 days. |
| Sara Rodriguez | challenger | Lt. Governor | First Latina statewide. Former ER nurse. |
| Kelda Roys | challenger | State Senator, 26th | Joint Finance Committee. Law degree. CEO of Open Homes. |
| Francesca Hong | challenger | State Rep, 76th | First Asian American WI legislator. Dem Socialist Caucus. |
| David Crowley | challenger | Milwaukee Co. Exec | First Black county exec. Won 2024 re-election 5-to-1. |
| Joel Brennan | challenger | Fmr DOA Secretary | Fmr Discovery World president. Evers cabinet. |
| Missy Hughes | challenger | Fmr WEDC CEO | Economic development focus. Pragmatic positioning. |
| Brett Hulsey | challenger | Fmr State Rep, 78th | Ran for governor in 2014. |
| Zach Roper | challenger | Student, Carthage College | 22 years old. |

### Governor — Republicans
| Name | Type | Current Role | Key Fact |
|------|------|-------------|----------|
| Tom Tiffany | incumbent | U.S. Rep, WI-7 | Trump-endorsed. Freedom Caucus. 98% Heritage score. |
| Andy Manske | challenger | Medical technician | 26yo. Supports legal marijuana + abortion access. |

### U.S. House — Competitive
| District | Candidates | Type | Rating |
|----------|-----------|------|--------|
| WI-3 (Driftless) | Van Orden (R, incumbent) vs Cooke (D), Pfaff (D), Shankland (D) | Toss-up | DCCC top target |
| WI-1 (Southeast) | Steil (R, incumbent) | Lean R | DCCC flip target |
| WI-7 (Northern) | Felzkowski (R), Stroebel (R), Callahan (R), +4 more R; Clark (D) | Open seat | Likely R |

### Wisconsin Supreme Court — April 7, 2026
| Name | Type | Background | Key Fact |
|------|------|-----------|----------|
| Chris Taylor | challenger | Appellate judge, fmr State Rep (2011-2020) | Liberal. 160+ judicial endorsements. Endorsed by Tammy Baldwin, AFL-CIO. |
| Maria S. Lazar | challenger | Court of Appeals (since 2022), fmr Waukesha County Circuit Court | Conservative. Worked under Republican AG Van Hollen. |

Replacing Rebecca Bradley (not seeking re-election). Determines whether liberal majority holds.

### Ballot Measures (All 3 Certified for November)
| Measure | Summary |
|---------|---------|
| Anti-DEI Amendment | Bans race/sex/color/ethnicity/national origin criteria in public employment, education, contracting |
| Places of Worship Amendment | Bans government from closing places of worship during declared emergencies |
| Partial Veto Amendment | Prohibits governor from using partial veto to create or increase any tax or fee |

### Local Referenda — April 7, 2026
72 school districts going to referendum seeking ~$1 billion total. Mix of operational and capital construction. Not pre-loaded in directory — agent uses Firecrawl to search for specific local referenda when asked.

### Knowledge Base Strategy
Static election info lives in ElevenAgents knowledge base (not Firecrawl). Split into focused docs for better RAG retrieval:
- `kb-election-dates.md` — Election dates, deadlines, timeline
- `kb-voting-rules.md` — Eligibility, registration, voter ID, how to vote
- `kb-candidates-directory.md` — All candidates by race
- `kb-ballot-measures.md` — Certified amendments + local referenda overview

Firecrawl reserved for live candidate/measure research only.

### Demo Scope (Video)
Primary demos: Tiffany, Van Orden, Barnes. Secondary: Cooke, Supreme Court (Taylor/Lazar), ballot measures.
Full directory available for live interaction but not featured in video.

---

## Frontend Design

### Layout (Desktop)
```
┌─────────────────────────────────────────────────────────┐
│  WI 2026  │  Ballot Badger  │ [filters]                │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Candidate │   Component Render Area                    │
│  Directory │   (components appear as agent speaks)      │
│  (list)    │                                            │
│            │   ┌─ CandidateCard ─────────────────┐      │
│  [Barnes]  │   │ Tom Tiffany  REP  Governor      │      │
│  [Rodrig]  │   └─────────────────────────────────┘      │
│  [Roys  ]  │                                            │
│  [Hong  ]  │   ┌─ VoteRecord ───────────────────┐      │
│  [Tiffny]← │   │ Electoral Cert (2021)   OBJECTED│      │
│  [VanOrd]  │   └─────────────────────────────────┘      │
│  [Cooke ]  │                                            │
│  [Steil ]  │   ┌─ DonorTable ───────────────────┐      │
│  [DEI   ]  │   │ Club for Growth      $15,000    │      │
│  [Veto  ]  │   └─────────────────────────────────┘      │
│            │                                            │
├────────────┴────────────────────────────────────────────┤
│ [mic]  Listening... say "go deeper" or ask follow-up    │
└─────────────────────────────────────────────────────────┘
```

### Styling
- **Framework:** neobrutalism.dev (shadcn-based, Tailwind CSS)
- **Theme:** Dark background (#0A0A0A), bold borders, offset shadows, high contrast
- **Typography:** JetBrains Mono (data/labels) + Libre Baskerville (prose/names)
- **Color coding:** Red (#DC2626) for Republicans, Blue (#2563EB) for Democrats, Amber (#D97706) for measures, Purple (#8B5CF6) for swing districts

### Candidate Photos
- **Federal candidates** (Tiffany, Van Orden, Steil, Barnes): Wikipedia Commons official portraits (public domain)
- **State candidates** (Rodriguez, Hong, Crowley, Roys): Ballotpedia or campaign site headshots
- **No photo available**: Colored placeholder with initials (already in JSX prototype)
- **Ballot measures**: Section symbol or gavel icon
- Collect 10-12 URLs on Day 5 during demo prep

### Comparison Card (Stretch Goal — Day 4)
A 7th client tool `show_comparison` that renders two candidates side by side when the user asks "how does X compare to Y on Z?" Not required for MVP — the agent can compare verbally without it.

### Component Animation
Components animate in as the agent mentions them:
- Fade up + slide from bottom (0.3s ease)
- Components accumulate — they don't replace each other
- Scrolls automatically to newest component

---

## ElevenAgents Configuration

### Agent Voice & Model
- **TTS Model:** Eleven v3 Conversational — most expressive real-time model, context-aware tone adaptation
- **Voice ID:** `5l5f8iK3YPeGga21rQIX`
- **Expressive Mode:** Enabled — allows natural tone shifts (authoritative when citing sources, measured when presenting contradictions)

### Agent Personality
- **First message:** "Hey — I'm Ballot Badger. I dig into Wisconsin candidates so you don't have to. Ask me about anyone running for office — governor, state legislature, U.S. House, or the ballot measures. Who do you want me to dig into?"
- **Tone:** Public radio meets investigative journalism. Informed, direct, accessible. Not preachy. Not partisan.
- **Filler phrase:** "Let me dig into that..." (plays during tool execution)

### System Prompt (Key Instructions)
```
You are Ballot Badger, a nonpartisan civic research agent for Wisconsin's 2026 elections.

When the user asks about a candidate or measure:
1. Call pull_receipts to search for findings
2. Narrate each finding conversationally
3. As you mention each finding, call the corresponding client tool to display it:
   - Mention the candidate → call show_candidate
   - Mention a vote → call show_vote
   - Mention donors → call show_donors
   - Mention a fact check → call show_fact_check
   - Mention endorsements → call show_endorsement
   - Mention a ballot measure's details → call show_measure
4. After presenting findings, ask: "Want me to dig deeper on [specific angles], or check another candidate?"

When the user asks a follow-up:
- Call deep_dive with the specific angle they asked about
- Narrate and render the deeper findings the same way

When the user asks general questions (who's running, key dates):
- Use your knowledge base. No tool calls needed.

Always cite sources by name. Never editorialize or take sides.
```

### Knowledge Base (Static, Zero Latency)
Upload as documents in ElevenAgents dashboard:
- Full candidate directory with bios
- Election timeline (primary Aug 11, general Nov 3)
- Ballot measure full text
- District competitiveness ratings
- "No U.S. Senate race in 2026" fact

---

## Conversation Flow Examples

### Flow 1: Incumbent Deep Dive (Demo Primary)
```
USER: "Pull up the receipts on Tom Tiffany and public lands."

AGENT: "Let me dig into that..."
  [pull_receipts("Tom Tiffany", "public lands") → 3-5s]

AGENT: "Here's what I found on Tom Tiffany."
  → show_candidate({ name: "Tom Tiffany", party: "Republican", ... })

AGENT: "Congress.gov shows he objected to certifying Arizona and Pennsylvania's
        electoral votes in January 2021."
  → show_vote({ bill: "Electoral Vote Certification", vote: "Objected", ... })

AGENT: "On the money side, OpenSecrets shows Club for Growth gave $15,000
        and Koch Industries gave $10,000 in the 2022 cycle."
  → show_donors({ donors: [...], source: "OpenSecrets" })

AGENT: "I found 11 sources. Want me to dig deeper on the votes, the donors,
        or check another candidate?"

USER: "Go deeper on the donors."

AGENT: "Let me dig into that..."
  [deep_dive("Tom Tiffany", "donors") → scrapes OpenSecrets (cached) → 1-3s]

AGENT: "Here's the full donor breakdown..."
  → show_donors({ donors: [more detailed list], totalRaised: "$1.2M" })
```

### Flow 2: Challenger (No Voting Record)
```
USER: "What about Mandela Barnes?"

AGENT: "Let me dig into that..."
  [pull_receipts("Mandela Barnes") → searches platform/endorsements/news]

AGENT: "Here's what I found on Mandela Barnes."
  → show_candidate({ name: "Mandela Barnes", party: "Democrat", ... })

AGENT: "He's positioned as the frontrunner, raising $555,000 in his first 29 days."
  → show_donors({ candidate: "Mandela Barnes", totalRaised: "$555K (first 29 days)" })

AGENT: "PolitiFact checked several claims from his 2022 Senate race..."
  → show_fact_check({ claim: "...", rating: "Mostly True", ... })

AGENT: "I found 8 sources. Want me to go deeper?"
```

### Flow 3: Ballot Measure
```
USER: "Tell me about the DEI amendment."

AGENT: "Here's what I found..."
  → show_measure({ title: "Prohibit Government Discrimination...", ... })

AGENT: "The amendment would ban state and local government from using race, sex,
        color, ethnicity, or national origin as criteria in public employment,
        education, or contracting."

USER: "Who's pushing it?"

AGENT: "Let me dig into that..."
  [deep_dive("anti-DEI amendment", "sponsors funding")]
```

---

## Build Timeline (6 Days)

### Day 1: Foundation
- Scaffold Next.js app with Tailwind + neobrutalism
- Build all 6 UI components (CandidateCard, VoteRecord, DonorTable, FactCheckBadge, EndorsementCard, MeasureCard)
- Set up candidate directory sidebar with filters
- Test components with hardcoded data

### Day 2: Middleware + Firecrawl
- Build /api/receipts route (pull_receipts server tool)
- Build /api/deep-dive route (deep_dive server tool)
- Build /api/candidate route (candidate_profile server tool)
- Implement candidate type detection + query templates
- Test Firecrawl search latency with real queries
- Build known URL lookup table for demo candidates

### Day 3: ElevenAgents Integration
- Create agent in ElevenAgents dashboard
- Configure system prompt and personality
- Set up 3 server tools pointing to Vercel API routes
- Register 6 client tools in React SDK
- Upload knowledge base documents
- Test end-to-end: voice → search → narration → component rendering

### Day 4: Integration + Polish
- Tune voice-visual sync timing
- Handle edge cases: empty results, errors, "no data found"
- Cache warming script for demo candidates
- Test all candidate types (incumbent, challenger, measure)
- Component animation polish

### Day 5: Demo Prep
- Script the demo video flow (Tiffany → Van Orden → Barnes → ballot measure)
- Test recordings — identify and fix any rough spots
- Build simple landing page if time allows
- Collect candidate photos for directory

### Day 6: Video + Submit
- Record final demo video
- Cut platform-specific versions (TikTok 30-60s, X 1-2min, LinkedIn 2-3min, IG 30-60s)
- Post to all 4 platforms with tags (@firecrawl @elevenlabs #ElevenHacks)
- Submit to hackathon

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Firecrawl search slower than 5s | Medium | High | "Digging" filler is part of the brand. Acceptable up to 8s. |
| ElevenAgents doesn't support multi-tool sequencing in one turn | Low | High | Fall back to batch rendering (option C from brainstorm). Components appear together when data arrives. |
| Claude Sonnet returns inconsistent JSON | Medium | Medium | Use structured output / JSON mode. Validate and provide defaults. |
| Client tools don't fire at right moments | Medium | Medium | Test with simple prompts first. Adjust system prompt wording. |
| Firecrawl rate limits during demo | Low | Critical | Cache warming + known URL scraping reduces search calls in Pass 2. |
| Candidate data changes before demo | Low | Low | Knowledge base is manually updated. Firecrawl finds current data anyway. |

---

## What Was Removed from Original Spec

- **OpenUI** — replaced by client tools rendering pre-built React components
- **Dual-output synthesis** — Claude Sonnet now returns structured JSON only, not prose + UI language
- **SSE side channel** — not needed; client tools handle sync
- **Flip cards landing page** — cut for time; can add Day 5 if ahead of schedule
- **State Senate individual candidates** — district overviews only; no specific candidate cards for state senate races

---

## What Was Added

- **Client tools architecture** — 6 non-blocking client tools for synchronized UI rendering
- **Candidate type system** — incumbent/challenger/open_seat/measure/district with per-type query templates
- **Known URL lookup** — targeted scraping for demo candidates in Pass 2
- **EndorsementCard component** — for challengers without voting records
- **MeasureCard component** — for ballot amendments
- **Updated candidate data** — verified March 20, 2026 (added Roper, Hulsey, Pfaff, Shankland, Stroebel; veto amendment now certified)
