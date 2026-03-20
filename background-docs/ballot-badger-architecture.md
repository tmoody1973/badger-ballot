# BALLOT BADGER
## Architecture & Conversation Flow — Firecrawl x ElevenAgents Hackathon
### v3 — Corrected Scope + Two-Pass Latency-Optimized Architecture

---

## CONCEPT

A voice-first civic accountability agent scoped to Wisconsin's 2026 elections. Users ask conversational questions about candidates — voting records, campaign promises, donor sources, public statements — and the agent pulls real-time evidence from across the web, synthesizes contradictions, and narrates findings with source attribution.

**Tagline:** "Ballot Badger — digging into Wisconsin candidates so you don't have to."

---

## WHY WISCONSIN, WHY NOW

- **Open governor's race** — first since 2010. Evers retiring. Rated tossup.
  - 7+ Democrats: Barnes, Rodriguez, Crowley, Hong, Roys, Hughes, Brennan, Hulsey
  - Republicans coalesced around Tom Tiffany (Trump-endorsed). Only other: Andy Manske.
  - Primary: August 11. General: November 3.
- **State Legislature control at stake** — the REAL story of 2026
  - 17 State Senate seats up (odd-numbered districts). Republicans hold 12 of 17.
  - Democrats need just 3 flips to take majority for first time since 2008.
  - First election under court-ordered fair maps (replacing gerrymandered maps).
  - All 99 Assembly seats also on the ballot.
- **Two certified constitutional amendments** on November ballot (per Ballotpedia, as of Feb 18, 2026)
  - **Prohibit Government Discrimination or Preferential Treatment Amendment** ("Anti-DEI"): bans race/sex/color/ethnicity/national origin criteria in public employment, education, contracting, administration
  - **Prohibit Government Closure of Places of Worship During Emergencies Amendment**: bans government from closing places of worship during declared emergencies including public health emergencies (COVID backlash measure)
  - NOTE: A third amendment (Prohibit Partial Veto to Increase Tax or Fee) is POTENTIAL but not yet certified
- **U.S. House — 3 races to watch** (Rs hold 6-2 edge)
  - WI-3 (Driftless/Eau Claire): TOSS-UP. Derrick Van Orden (R) vs Rebecca Cooke (D). Van Orden won 51.4% in 2024. Cooke outraised him Q4 2025 ($1.1M vs $931K). Van Orden has Jan 6 presence, behavioral controversy. DCCC top target.
  - WI-1 (Southeast): LEAN R. Bryan Steil (R) incumbent. $4.2M on hand. DCCC flip target. Multiple D challengers.
  - WI-7 (Northern): OPEN SEAT. Tiffany leaving for governor. Solid R district but open seats are unpredictable. R primary: Felzkowski (Senate president), Callahan, Swearingen. D: Clark, Armstrong.
  - WI-2, 4, 5, 6, 8: Safe seats (not competitive)
- **Statewide offices**: Attorney General (Kaul, incumbent), Secretary of State (open), Treasurer
- **NO U.S. Senate race in 2026** — Baldwin (D) won 2024, Johnson (R) seat up in 2028

Wisconsin is nationally relevant but locally specific. The governor's race and legislature battle are the most consequential state elections in the country.

---

## LATENCY STRATEGY: TWO-PASS ARCHITECTURE

### The Problem
A voice agent lives or dies on response time. A single-pass design — three parallel Firecrawl searches with full scraping + LLM synthesis — produces an 8-15 second wait before first audio. Even with ElevenAgents' soft timeout filler, that's too long.

### Measured Latency Components
| Component | Time |
|-----------|------|
| ElevenAgents STT | 0.3-0.5s |
| ElevenAgents orchestration overhead | <0.1s |
| LLM intent parsing | 0.5-1.5s |
| Firecrawl Search (no scrape) | 1-2s |
| Firecrawl Search + scrapeOptions (fresh static) | 2-5s per page |
| Firecrawl Search + scrapeOptions (JS-heavy) | 5-15s per page |
| Firecrawl cached scrape (maxAge hit) | <1s |
| Claude Sonnet synthesis (snippets) | 1.5-2.5s |
| Claude Sonnet synthesis (full markdown) | 2-4s |
| ElevenAgents TTS (streaming) | 0.2-0.5s |
| ElevenAgents soft timeout filler | 3.0s (configurable) |

### Two-Pass Design

**Pass 1 — Fast Briefing (4-7s total)**: Search without scrapeOptions. Returns titles, URLs, snippets. Lightweight LLM synthesis. User hears soft timeout filler at 3s, findings 1-4s later.

**Pass 2 — Deep Dive (on demand, 3-8s)**: User says "tell me more." Targeted Firecrawl scrape on 1-2 URLs from Pass 1. Uses maxAge caching. Detailed synthesis.

---

## REAL-TIME vs PRE-SCRAPING

### Why Search Live
1. **Defeats hackathon requirement.** Judges want Firecrawl as live runtime integration.
2. **Kills value proposition.** Candidates update daily. Stale data isn't receipts.
3. **Demo is more impressive live.** Soft timeout signals real work.

### Cache Warming (Smart Hybrid)
Pre-populate Firecrawl's cache on high-traffic pages so Pass 2 deep dives return in <1s. Every query still goes through live search.

Key pages to warm: Ballotpedia profiles (Tiffany, Barnes, Rodriguez, Roys, Hong, Crowley, Van Orden, Cooke, Steil), OpenSecrets summaries (Tiffany, Van Orden, Steil), PolitiFact Wisconsin pages, ballot measure pages.

### ElevenAgents Knowledge Base (Static Baseline)
Zero-latency answers for: who's running, key dates, amendment text, competitive districts, policy primers.

### Data Strategy Summary
| Layer | What It Holds | Latency |
|-------|--------------|---------|
| Knowledge Base | Static context, candidate list | 0s (RAG) |
| Firecrawl Cache | Pre-visited pages | <1s |
| Firecrawl Search (no scrape) | Real-time snippets | 1-2s |
| Firecrawl Search (with scrape) | Full page content | 2-6s |

---

## SYSTEM ARCHITECTURE

User (Voice) → ElevenAgents (STT → LLM → TTS) → Server Tools (Webhooks) → Middleware API → Firecrawl Search

### Agent Voice & Personality
- **First message:** "Hey — I'm Ballot Badger. I dig into Wisconsin candidates so you don't have to. Ask me about anyone running for office — governor, state legislature, U.S. House, or the ballot measures. Who do you want me to dig into?"
- **Tone:** Public radio meets investigative journalism. Informed, direct, accessible. Not preachy.
- **Key phrase:** "Let me dig into that..." (soft timeout filler — plays on the badger metaphor)

### Three tools:
1. pull_receipts → /api/receipts (PASS 1: fast search, no scrape, ~3-5s)
2. deep_dive → /api/deep-dive (PASS 2: targeted scrape + maxAge, ~4-8s)
3. candidate_profile → /api/candidate (quick bio, no scrape, ~2-4s)

---

## DATA SOURCES (Confirmed Working via Web Search)

### Tier 1: Official Records
- Congress.gov — 2,794 items for Tiffany confirmed. Full roll call votes. Van Orden, Steil also have full voting records.
- legis.wisconsin.gov — State legislature votes and bills.
- FEC.gov — Federal campaign finance. Confirmed for all federal candidates.
- Ballotpedia — Full profiles for ALL candidates confirmed.
- VoteSmart — Key votes by category with summaries.

### Tier 2: Public Statements
- Candidate campaign websites
- Local news: Journal Sentinel, Cap Times, WPR, PBS Wisconsin
- Press releases

### Tier 3: Accountability
- PolitiFact Wisconsin — Extensive WI fact-check archive confirmed.
- OpenSecrets.org — Full donor/industry breakdowns confirmed.
- Wisconsin Watch, ProPublica

---

## CONVERSATION FLOW EXAMPLES

### Flow 1: Governor Race — Two-Pass Contradiction Catch
USER: "Pull up the receipts on Tom Tiffany and public lands."
AGENT: [soft timeout] → [PASS 1 ~4s] → briefing with signals → "Want me to dig deeper?"
USER: "Go deeper on the donors."
AGENT: [soft timeout] → [PASS 2 ~6s] → specific dollar amounts, PAC names, connections

### Flow 2: State Senate — The Legislature Battle
USER: "What's at stake in the state senate races?"
AGENT: [knowledge base, instant] → Democrats need 3 flips, key districts, fair maps context

### Flow 3: Ballot Measures
USER: "Tell me about the amendments on the ballot."
AGENT: [knowledge base, instant] → Two certified: (1) Discrimination/Preferential Treatment Amendment (anti-DEI), (2) Places of Worship Emergency Closure Amendment (COVID backlash). A third on veto power is potential but not yet certified.
USER: "Who's pushing the DEI one?"
AGENT: [PASS 1] → searches funding sources and legislative sponsors

### Flow 4: Governor Primary Discovery
USER: "Who's running for governor?"
AGENT: [knowledge base, instant] → full field overview → "Who interests you?"

### Flow 5: House Race — WI-3 Toss-Up
USER: "What's the deal with Derrick Van Orden?"
AGENT: [PASS 1 ~4s] → Van Orden's voting record, Jan 6 presence, behavioral incidents, narrow 51.4% win
USER: "What about his opponent?"
AGENT: [PASS 1 ~4s] → Cooke's fundraising ($1.1M Q4), platform, positioning as moderate D
USER: "Who's giving Van Orden money?"
AGENT: [PASS 2 ~6s] → scrapes OpenSecrets for full donor breakdown

### Flow 6: Senate Race Correction
USER: "What about the Senate race?"
AGENT: [knowledge base, instant] → "No U.S. Senate race in Wisconsin in 2026. Baldwin won 2024, Johnson's term expires 2028. The big federal races are the 8 House seats — especially WI-3, which is a toss-up."

---

## TECH STACK

| Component | Technology |
|-----------|-----------|
| Voice Agent | ElevenLabs ElevenAgents (dashboard + React SDK) |
| Agent LLM | Claude Sonnet 4 |
| Search (Pass 1) | Firecrawl /v2/search, no scrapeOptions |
| Scraping (Pass 2) | Firecrawl /v2/search with scrapeOptions + maxAge |
| Synthesis | Claude Sonnet 4 (in middleware) |
| Dynamic UI | OpenUI (@openuidev/react-lang, react-ui) |
| Knowledge Base | ElevenAgents built-in RAG |
| UI Framework | neobrutalism.dev components (shadcn-based, Tailwind) |
| Middleware | Next.js API Routes on Vercel |
| Frontend | Next.js + ElevenLabs React SDK + OpenUI Renderer |
| Build Tool | Claude Code |

---

## UI DESIGN

### Framework: neobrutalism.dev
Bold black borders, offset shadows, high-contrast color blocks. Built on shadcn UI with Tailwind. Components: Card, Table, Badge, Tabs, Button, Dialog. The aesthetic is distinctive, opinionated, and reads well in video thumbnails — nothing else in the hackathon will look like this.

### OpenUI Dynamic Generation
The voice agent's findings generate visual components in real time via OpenUI Lang. 5 component types: CandidateCard, DonorTable, FactCheckBadge, VoteRecord, ReceiptsSummary. All styled with neobrutalism design tokens.

### Split Screen Layout (Desktop)
- Left: Candidate directory (compact list cards, filtered by race)
- Right: Voice agent panel (candidate preview → pull receipts button → live transcript)
- Flow: Browse → Select → Tap "Pull the receipts" → Voice starts

### Flip Cards (Landing Page / Mobile)
- Front: Photo, name, party, office, key fact, findings count
- Back: Dossier highlights with staggered reveal + severity dots
- CTA buttons: "View dossier" + "Pull the receipts"

### Photos: Hardcoded Static URLs
- Wikipedia Commons for federal candidates
- Ballotpedia/campaign sites for state candidates
- 12-15 URLs, 30 minutes of work

### Hackathon Demo Scope: 14-16 Cards
| Race | Candidates |
|------|-----------|
| Governor (D) | Barnes, Rodriguez, Roys, Hong, Crowley |
| Governor (R) | Tiffany |
| U.S. House WI-3 | Van Orden (R), Cooke (D) — toss-up |
| U.S. House WI-1 | Steil (R) — lean R, DCCC target |
| U.S. House WI-7 | Open seat — Felzkowski (R), Clark (D) |
| State Senate | 2-3 key battleground district candidates |
| Ballot Measures | Discrimination/Preferential Treatment (anti-DEI), Places of Worship Emergency Closure |

---

## BUILD TIMELINE (6 Days)

Day 1: Foundation + cache warming + knowledge base
Day 2: Two-pass engine (all 3 API routes) + latency testing
Day 3: UI (split screen + flip cards) + agent polish
Day 4: Integration (voice ↔ cards state sync) + edge cases
Day 5: Demo prep + video scripting + test recordings
Day 6: Video production + 4-platform posting + submit

---

## VIRAL VIDEO STRATEGY

Money shot: Two-pass contradiction catch. Primary demo: Tiffany (most data, Jan 6 certification objection, donor contradictions). Secondary demo: Van Orden in WI-3 (Jan 6 presence, behavioral incidents, toss-up race — shows the agent works across race types). Pass 1 hints at tension, Pass 2 confirms with specifics.

| Platform | Length | Angle |
|----------|--------|-------|
| TikTok | 30-60s | The contradiction moment |
| Instagram | 30-60s | Same clip, polished |
| X | 1-2 min | Demo + commentary |
| LinkedIn | 2-3 min | Builder story, civic tech |

Tags: @firecrawl @elevenlabs #ElevenHacks #CivicTech #Wisconsin2026

## SCORING: Max 1000 pts
- 4 platforms: +200
- 1st place: +400
- Most viral: +200
- Most popular: +200
