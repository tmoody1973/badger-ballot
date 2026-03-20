# BALLOT BADGER — OpenUI Integration Spec
## For Claude Code Implementation

---

## CONCEPT

The voice agent speaks findings via ElevenAgents. Simultaneously, the middleware generates OpenUI Lang that streams visual components into the React frontend — candidate cards, donor tables, fact-check badges, vote records — building on screen as the agent talks. The user hears the receipts AND sees them assemble in real time.

This is the differentiator. Nobody else in the hackathon will have an AI generating both voice AND custom visual UI from the same Firecrawl data simultaneously.

---

## ARCHITECTURE

```
User speaks
    │
    ▼
ElevenAgents (STT → LLM → TTS)
    │
    │ calls webhook tool
    ▼
Middleware API (Next.js on Vercel)
    │
    ├── Firecrawl Search (parallel queries)
    │
    ├── Claude Sonnet synthesizes findings
    │       │
    │       ├── Returns SPOKEN briefing → back to ElevenAgents → user hears it
    │       │
    │       └── Returns OpenUI Lang → streamed via SSE to frontend → user sees it
    │
    └── Frontend renders OpenUI components in real time
```

### Key Integration Points

1. **ElevenAgents webhook** returns the spoken text briefing (same as before)
2. **Simultaneously**, the middleware pushes an SSE event to the frontend with OpenUI Lang
3. **OpenUI Renderer** on the frontend parses the stream and renders React components
4. **Voice and visual are synchronized** — both come from the same Firecrawl data

---

## TECH STACK

```
Framework:      Next.js 14+ (App Router)
Voice:          ElevenLabs ElevenAgents (React SDK)
UI Generation:  OpenUI (@openuidev/react-lang, @openuidev/react-ui)
UI Framework:   neobrutalism.dev (shadcn-based, Tailwind CSS)
Search:         Firecrawl SDK (firecrawl JS)
Synthesis LLM:  Claude Sonnet 4 (Anthropic SDK)
Styling:        Tailwind CSS + neobrutalism design tokens
Deployment:     Vercel
Build Tool:     Claude Code
```

### Install Commands

```bash
# Scaffold OpenUI
npx @openuidev/cli@latest create --name ballot-badger

# Additional deps
npm install @anthropic-ai/sdk firecrawl elevenlabs

# neobrutalism components (shadcn-based — install per component via CLI)
# See https://www.neobrutalism.dev/docs/installation
# Components needed: card, table, badge, tabs, button, dialog, sheet
```

---

## OPENUI COMPONENT LIBRARY

Define these 5 components. OpenUI generates system prompts from these definitions automatically.

### 1. CandidateCard

Purpose: Displays candidate overview when agent identifies who's being discussed.

```typescript
import { defineComponent, z } from '@openuidev/react-lang';

export const CandidateCard = defineComponent({
  name: 'CandidateCard',
  description: 'Displays a candidate profile card with photo, name, party, office, and key facts.',
  props: z.object({
    name: z.string().describe('Full name of the candidate'),
    party: z.enum(['Democrat', 'Republican', 'Independent']).describe('Political party'),
    office: z.string().describe('Office they are running for, e.g. "Governor" or "U.S. House WI-3"'),
    currentRole: z.string().describe('Current position held'),
    keyFact: z.string().describe('One-line distinguishing fact about the candidate'),
    findingsCount: z.number().describe('Number of data points found'),
    severity: z.enum(['high', 'medium', 'low']).describe('How significant the findings are'),
    photoUrl: z.string().optional().describe('URL to candidate headshot'),
  }),
});
```

React implementation (neobrutalism style):
```tsx
// components/CandidateCard.tsx — neobrutalism styled
function CandidateCardComponent({ name, party, office, currentRole, keyFact, findingsCount, severity, photoUrl }) {
  const partyColor = party === 'Republican' ? '#ef4444' : party === 'Democrat' ? '#3b82f6' : '#a855f7';
  const partyBg = party === 'Republican' ? '#fef2f2' : party === 'Democrat' ? '#eff6ff' : '#faf5ff';
  const sevColor = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#6b7280';

  return (
    <div className="rounded-base border-2 border-border bg-main p-4 mb-3 shadow-shadow"
         style={{ '--shadow-shadow': '4px 4px 0px 0px #000' }}>
      <div className="flex items-start gap-3">
        {photoUrl && (
          <img src={photoUrl} alt={name}
               className="w-14 h-14 rounded-base border-2 border-border object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold font-heading">{name}</span>
            <span className="px-2 py-0.5 rounded-base border-2 border-border text-[10px] font-bold tracking-wider"
                  style={{ background: partyBg, color: partyColor }}>
              {party === 'Republican' ? 'REP' : party === 'Democrat' ? 'DEM' : 'IND'}
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground">{office} · {currentRole}</div>
          <div className="text-xs mt-1 italic">{keyFact}</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-3 h-3 rounded-full border-2 border-border" style={{ background: sevColor }} />
          <span className="text-[10px] font-mono font-bold">{findingsCount}</span>
        </div>
      </div>
    </div>
  );
}
```

### 2. DonorTable

Purpose: Displays campaign finance data when agent discusses money trail.

```typescript
export const DonorTable = defineComponent({
  name: 'DonorTable',
  description: 'Shows a table of campaign donors with names, amounts, types, and election cycles. Use when discussing campaign finance, donors, PACs, or money in politics.',
  props: z.object({
    candidate: z.string().describe('Name of the candidate'),
    donors: z.array(z.object({
      name: z.string().describe('Donor or organization name'),
      amount: z.string().describe('Dollar amount or description like "Top individual"'),
      type: z.string().describe('PAC, Individual, Joint Fundraising, etc.'),
      cycle: z.string().describe('Election cycle year'),
    })).describe('List of donors'),
    totalRaised: z.string().optional().describe('Total amount raised if known'),
    source: z.string().describe('Data source, e.g. "OpenSecrets" or "FEC.gov"'),
  }),
});
```

React implementation (neobrutalism style):
```tsx
function DonorTableComponent({ candidate, donors, totalRaised, source }) {
  return (
    <div className="rounded-base border-2 border-border bg-white p-4 mb-3 shadow-shadow">
      <div className="flex justify-between items-baseline mb-3">
        <span className="px-2 py-0.5 rounded-base border-2 border-border bg-amber-100 text-amber-800 text-xs font-bold tracking-wider">DONORS</span>
        <span className="text-[10px] font-mono">{source}</span>
      </div>
      {totalRaised && (
        <div className="text-xl font-mono font-bold mb-3">{totalRaised}</div>
      )}
      <div className="space-y-2">
        {donors.map((d, i) => (
          <div key={i} className="flex justify-between items-center py-2 px-3 rounded-base border-2 border-border bg-bg">
            <div>
              <div className="text-xs font-bold">{d.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{d.type} · {d.cycle}</div>
            </div>
            <span className="text-sm font-mono font-bold">{d.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. FactCheckBadge

Purpose: Shows fact-check ratings when agent discusses verified/debunked claims.

```typescript
export const FactCheckBadge = defineComponent({
  name: 'FactCheckBadge',
  description: 'Displays a fact-check result with the claim, rating, source, and year. Use when discussing PolitiFact ratings, verified claims, or debunked statements.',
  props: z.object({
    claim: z.string().describe('The claim that was fact-checked'),
    rating: z.enum([
      'True', 'Mostly True', 'Half True', 'Mostly False', 'False', 'Pants on Fire',
      'Verified', 'Unverified', 'Needs Context'
    ]).describe('The fact-check rating'),
    source: z.string().describe('Who fact-checked it, e.g. "PolitiFact" or "FactCheck.org"'),
    year: z.string().describe('Year of the fact-check'),
    candidate: z.string().describe('Who made or is associated with the claim'),
  }),
});
```

React implementation (neobrutalism style):
```tsx
function FactCheckBadgeComponent({ claim, rating, source, year, candidate }) {
  const ratingColors = {
    'True': { bg: '#dcfce7', text: '#166534', border: '#166534' },
    'Mostly True': { bg: '#dcfce7', text: '#166534', border: '#166534' },
    'Half True': { bg: '#fef9c3', text: '#854d0e', border: '#854d0e' },
    'Mostly False': { bg: '#ffedd5', text: '#9a3412', border: '#9a3412' },
    'False': { bg: '#fef2f2', text: '#991b1b', border: '#991b1b' },
    'Pants on Fire': { bg: '#fef2f2', text: '#991b1b', border: '#991b1b' },
    'Verified': { bg: '#ede9fe', text: '#5b21b6', border: '#5b21b6' },
  };
  const c = ratingColors[rating] || { bg: '#f3f4f6', text: '#374151', border: '#374151' };

  return (
    <div className="rounded-base border-2 border-border bg-white p-4 mb-3 shadow-shadow">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-base border-2 border-border bg-red-100 text-red-800 text-xs font-bold tracking-wider">FACT CHECK</span>
        <span className="text-[10px] font-mono">{source} · {year}</span>
      </div>
      <div className="text-sm italic mb-3 border-l-4 border-border pl-3">"{claim}"</div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-base border-2 text-[10px] font-mono font-bold tracking-wider"
              style={{ background: c.bg, color: c.text, borderColor: c.border }}>
          {rating.toUpperCase()}
        </span>
        <span className="text-[10px] font-mono">— {candidate}</span>
      </div>
    </div>
  );
}
```

### 4. VoteRecord

Purpose: Shows voting history on specific bills.

```typescript
export const VoteRecord = defineComponent({
  name: 'VoteRecord',
  description: 'Displays a voting record entry showing how a candidate voted on a specific bill, with context. Use when discussing Congressional or legislative votes.',
  props: z.object({
    bill: z.string().describe('Name or number of the bill'),
    vote: z.enum(['Yea', 'Nay', 'Abstain', 'Not Voting', 'Sponsored', 'Objected', 'Proposed'])
      .describe('How the candidate voted'),
    context: z.string().describe('Brief explanation of what the vote means'),
    date: z.string().optional().describe('Date of the vote'),
    source: z.string().describe('Source of the data, e.g. "Congress.gov"'),
    candidate: z.string().describe('Who cast the vote'),
  }),
});
```

React implementation (neobrutalism style):
```tsx
function VoteRecordComponent({ bill, vote, context, date, source, candidate }) {
  const voteStyle = ['Nay', 'Objected'].includes(vote)
    ? { bg: '#fef2f2', text: '#991b1b', border: '#991b1b' }
    : ['Yea', 'Sponsored'].includes(vote)
    ? { bg: '#dcfce7', text: '#166534', border: '#166534' }
    : { bg: '#f3f4f6', text: '#374151', border: '#374151' };

  return (
    <div className="rounded-base border-2 border-border bg-white p-4 mb-3 shadow-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="px-2 py-0.5 rounded-base border-2 border-border bg-blue-100 text-blue-800 text-xs font-bold tracking-wider">VOTE</span>
          <div className="text-sm font-bold mt-2">{bill}</div>
          <div className="text-xs mt-1 leading-relaxed">{context}</div>
          {date && <div className="text-[10px] font-mono mt-2">{date} · {source}</div>}
        </div>
        <span className="px-3 py-1 rounded-base border-2 text-xs font-mono font-bold tracking-wider ml-3 shrink-0"
              style={{ background: voteStyle.bg, color: voteStyle.text, borderColor: voteStyle.border }}>
          {vote.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
```

### 5. ReceiptsSummary

Purpose: Summary card that appears at the end of a research pass, showing total sources found.

```typescript
export const ReceiptsSummary = defineComponent({
  name: 'ReceiptsSummary',
  description: 'Summary card shown after completing a research query. Shows total sources found across categories. Use at the end of a receipts pull.',
  props: z.object({
    candidate: z.string().describe('Candidate researched'),
    topic: z.string().describe('Topic researched'),
    officialSources: z.number().describe('Number of official record sources found'),
    newsSources: z.number().describe('Number of news/statement sources found'),
    factCheckSources: z.number().describe('Number of fact-check sources found'),
    pass: z.enum(['1', '2']).describe('Which research pass this summarizes'),
    keyFinding: z.string().describe('The single most important finding, in one sentence'),
  }),
});
```

---

## LIBRARY REGISTRATION

```typescript
// lib/openui-library.ts
import { createLibrary } from '@openuidev/react-lang';
import { CandidateCard, DonorTable, FactCheckBadge, VoteRecord, ReceiptsSummary } from './components';

export const ballotBadgerLibrary = createLibrary({
  components: [
    CandidateCard,
    DonorTable,
    FactCheckBadge,
    VoteRecord,
    ReceiptsSummary,
  ],
});

// Generate system prompt for Claude
export const openUISystemPrompt = ballotBadgerLibrary.prompt();
```

---

## MIDDLEWARE: DUAL OUTPUT (Voice + OpenUI)

The key change: the synthesis LLM call returns TWO outputs.

### /api/receipts (Updated for Dual Output)

```typescript
// /app/api/receipts/route.ts
import { Firecrawl } from 'firecrawl';
import Anthropic from '@anthropic-ai/sdk';
import { openUISystemPrompt } from '@/lib/openui-library';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
const anthropic = new Anthropic();

export async function POST(req: Request) {
  const { candidate, topic } = await req.json();

  // PASS 1: Parallel Firecrawl searches (no scrape)
  const [official, statements, factchecks] = await Promise.all([
    firecrawl.search(`${candidate} voting record ${topic} Wisconsin`, { limit: 5 }),
    firecrawl.search(`${candidate} ${topic} Wisconsin 2026 position`, { limit: 5, tbs: "qdr:y" }),
    firecrawl.search(`${candidate} ${topic} fact check politifact Wisconsin`, { limit: 3 }),
  ]);

  const allSnippets = {
    official: official.data?.web?.map(r => ({ title: r.title, url: r.url, description: r.description })),
    statements: statements.data?.web?.map(r => ({ title: r.title, url: r.url, description: r.description })),
    factchecks: factchecks.data?.web?.map(r => ({ title: r.title, url: r.url, description: r.description })),
  };

  // DUAL SYNTHESIS: One call, two outputs
  const synthesis = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `You are a nonpartisan civic research analyst for Wisconsin 2026 elections.

Given search results about a candidate, produce TWO outputs separated by ---OPENUI---

FIRST: A spoken briefing (4-6 sentences, conversational, cite sources by name).
This will be read aloud by a voice agent.

---OPENUI---

SECOND: OpenUI Lang that renders visual components showing the key findings.
${openUISystemPrompt}

Use the components to display structured data found in the search results.
Only generate components when you have specific data to show.
If you found donor data → use DonorTable.
If you found fact-check ratings → use FactCheckBadge.
If you found voting records → use VoteRecord.
Always end with a ReceiptsSummary.`,
    messages: [{
      role: "user",
      content: `Research: ${candidate} on "${topic}"\n\n${JSON.stringify(allSnippets, null, 2)}`
    }]
  });

  const fullText = synthesis.content[0].type === 'text' ? synthesis.content[0].text : '';
  const [spokenBriefing, openUILang] = fullText.split('---OPENUI---').map(s => s.trim());

  const sourceCount = (allSnippets.official?.length || 0) +
                      (allSnippets.statements?.length || 0) +
                      (allSnippets.factchecks?.length || 0);

  return Response.json({
    candidate,
    topic,
    briefing: spokenBriefing,  // → sent back to ElevenAgents voice
    openui: openUILang,         // → streamed to frontend OpenUI renderer
    source_count: sourceCount,
    sources: [
      ...(allSnippets.official || []).map(r => ({ ...r, tier: 'official' })),
      ...(allSnippets.statements || []).map(r => ({ ...r, tier: 'statement' })),
      ...(allSnippets.factchecks || []).map(r => ({ ...r, tier: 'factcheck' })),
    ],
    pass: 1,
  });
}
```

---

## FRONTEND: COMBINED LAYOUT

Single page. Cards grid + voice panel + OpenUI render area.

```
┌─────────────────────────────────────────────────────────┐
│  WI 2026  │  Ballot Badger  │ [filters]            │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Candidate │   OpenUI Rendered Area                     │
│  Directory │   (components stream in as agent speaks)   │
│  (list)    │                                            │
│            │   ┌─ CandidateCard ─────────────────┐      │
│  [Barnes]  │   │ Tom Tiffany  REP  Governor      │      │
│  [Rodrig]  │   │ Freedom Caucus. Trump-endorsed.  │      │
│  [Roys  ]  │   └─────────────────────────────────┘      │
│  [Hong  ]  │                                            │
│  [Tiffny]← │   ┌─ VoteRecord ───────────────────┐      │
│  [VanOrd]  │   │ Electoral Cert (2021)    OBJECTED│      │
│  [Cooke ]  │   │ Objected to AZ and PA votes     │      │
│  [Steil ]  │   └─────────────────────────────────┘      │
│  [DEI   ]  │                                            │
│  [Veto  ]  │   ┌─ DonorTable ───────────────────┐      │
│            │   │ Club for Growth      $15,000    │      │
│            │   │ Koch Industries      $10,000    │      │
│            │   └─────────────────────────────────┘      │
│            │                                            │
│            │   ┌─ ReceiptsSummary ───────────────┐      │
│            │   │ 11 sources · Pass 1 complete    │      │
│            │   └─────────────────────────────────┘      │
│            │                                            │
├────────────┴────────────────────────────────────────────┤
│ [🎙 mic]  Listening... say "go deeper" or ask follow-up │
└─────────────────────────────────────────────────────────┘
```

### React Page Structure

```tsx
// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Renderer } from '@openuidev/react-lang';
import { ballotBadgerLibrary } from '@/lib/openui-library';
// Import ElevenLabs React SDK
import { useConversation } from '@elevenlabs/react';

export default function BallotBadger() {
  const [selected, setSelected] = useState(null);
  const [openUIContent, setOpenUIContent] = useState('');
  const [filter, setFilter] = useState('all');

  // ElevenLabs conversation hook
  const conversation = useConversation({
    agentId: process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID,
    // When agent calls a tool, we intercept the response
    onToolResult: (toolName, result) => {
      if (result.openui) {
        // Stream OpenUI content to the renderer
        setOpenUIContent(prev => prev + '\n' + result.openui);
      }
    },
  });

  async function pullReceipts(candidateId) {
    setSelected(candidateId);
    setOpenUIContent(''); // Clear previous
    await conversation.startSession({
      dynamicVariables: { candidate: candidateId },
    });
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <TopBar filter={filter} setFilter={setFilter} />

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: candidate directory */}
        <CandidateDirectory
          filter={filter}
          selected={selected}
          onSelect={pullReceipts}
        />

        {/* Right: OpenUI render area */}
        <div className="flex-1 overflow-y-auto p-4">
          {openUIContent ? (
            <Renderer
              library={ballotBadgerLibrary}
              content={openUIContent}
            />
          ) : (
            <EmptyState selected={selected} />
          )}
        </div>
      </div>

      {/* Bottom: voice bar */}
      <VoiceBar conversation={conversation} selected={selected} />
    </div>
  );
}
```

---

## SYNCHRONIZATION: VOICE + VISUAL

### Option A: Tool Response Carries OpenUI (Simpler)

The ElevenAgents webhook returns both the spoken text and the OpenUI Lang in the same response. The agent speaks the text portion. A client-side event listener picks up the full tool response and extracts the OpenUI portion.

```typescript
// In ElevenAgents tool configuration, the webhook returns:
{
  "briefing": "Here's what I found on Tiffany...",  // agent speaks this
  "openui": "root = Stack([card, vote, donors])\ncard = CandidateCard(...)",  // frontend renders this
  "source_count": 11
}
```

The ElevenAgents React SDK exposes events for tool calls:
```typescript
conversation.on('agent_tool_response', (event) => {
  const data = JSON.parse(event.tool_response);
  if (data.openui) {
    setOpenUIContent(prev => prev + '\n' + data.openui);
  }
});
```

### Option B: SSE Side Channel (More Control)

The webhook fires, returns spoken text to ElevenAgents, and simultaneously pushes OpenUI Lang to the frontend via a separate SSE connection. More complex but gives you independent control over visual timing.

**Recommendation: Start with Option A.** It's simpler, and you can always add the SSE channel later if timing feels off.

---

## WHAT THIS MEANS FOR THE DEMO VIDEO

The visual story becomes:

1. **Grid of candidate cards** (0-3s) — the browse experience
2. **Tap "Pull the receipts"** (3-5s) — mic activates
3. **Agent starts speaking** while **UI components stream in** (5-35s)
   - CandidateCard appears first (who we're researching)
   - VoteRecord cards slide in as agent mentions votes
   - DonorTable builds as agent discusses money
   - FactCheckBadge appears when agent cites PolitiFact
   - ReceiptsSummary caps it off
4. **User says "go deeper on the donors"** (35-40s)
   - New, more detailed DonorTable streams in
   - Agent speaks the specifics
5. **Final shot**: full screen of generated components = the dossier (40-45s)

That's a 45-second video where both audio AND visual are being generated live by AI from real Firecrawl data. Nobody else will have that.

---

## BUILD SEQUENCE FOR CLAUDE CODE

### Session 1: OpenUI Setup (Day 1)
- Scaffold with `npx @openuidev/cli@latest create`
- Define the 5 component schemas (CandidateCard, DonorTable, FactCheckBadge, VoteRecord, ReceiptsSummary)
- Implement React components with Tailwind styling (dark theme, monospace accents)
- Test with hardcoded OpenUI Lang to verify rendering

### Session 2: Firecrawl + Middleware (Day 2)
- Build /api/receipts with dual output (spoken + OpenUI)
- Build /api/deep-dive with same dual pattern
- Build /api/candidate (voice only, no OpenUI needed)
- Test Firecrawl queries against real WI candidates
- Verify Claude generates valid OpenUI Lang for the component library

### Session 3: ElevenAgents Integration (Day 3)
- Create agent in ElevenAgents dashboard
- Configure webhook tools pointing to Vercel API routes
- Wire up ElevenLabs React SDK
- Connect tool_response events to OpenUI renderer
- Test end-to-end: voice → search → dual output → visual + audio

### Session 4: Polish + Edge Cases (Day 4)
- Sync timing between voice and visual
- Handle empty states, errors, "no data found"
- Add candidate directory with filters
- Knowledge base for static context
- Cache warming script

### Session 5: Demo + Video (Day 5-6)
- Landing page with flip cards (the hook)
- Record demo video across all race types
- Cut platform-specific versions
- Post and submit

---

## CANDIDATE DATA (For Directory + Knowledge Base)

### Governor — Democrats
| Name | Current Role | Key Fact |
|------|-------------|----------|
| Mandela Barnes | Fmr Lt. Governor | Lost 2022 Senate by 1pt. Frontrunner. $555K first 29 days. |
| Sara Rodriguez | Lt. Governor | First Latina statewide. Former ER nurse. $650K first year. |
| Kelda Roys | State Senator, 26th | Joint Finance Committee. Law degree. CEO of Open Homes. |
| Francesca Hong | State Rep, 76th | First Asian American WI legislator. Dem Socialist Caucus. |
| David Crowley | Milwaukee Co. Exec | First Black county exec. Won 2024 re-election 5-to-1. |
| Joel Brennan | Fmr DOA Secretary | Fmr Discovery World president. Evers cabinet. |
| Missy Hughes | Fmr WEDC CEO | Economic development focus. Pragmatic positioning. |

### Governor — Republicans
| Name | Current Role | Key Fact |
|------|-------------|----------|
| Tom Tiffany | U.S. Rep, WI-7 | Trump-endorsed. Freedom Caucus. 98% Heritage score. Chairs Federal Lands subcommittee. |
| Andy Manske | Medical technician | 26yo. Supports legal marijuana + abortion access. |

### U.S. House — Competitive
| District | Candidates | Rating |
|----------|-----------|--------|
| WI-3 (Driftless) | Derrick Van Orden (R) vs Rebecca Cooke (D) | TOSS-UP |
| WI-1 (Southeast) | Bryan Steil (R) — DCCC target | LEAN R |
| WI-7 (Northern) | Open seat (Tiffany leaving). Felzkowski (R), Clark (D) | LIKELY R |

### Ballot Measures (Certified as of Feb 18, 2026)
| Measure | Official Name | Summary |
|---------|--------------|---------|
| Anti-DEI | Prohibit Government Discrimination or Preferential Treatment Amendment | Bans race/sex/color/ethnicity/national origin criteria in public employment, education, contracting, administration |
| Places of Worship | Prohibit Government Closure of Places of Worship During Emergencies Amendment | Bans government from closing places of worship during declared emergencies including public health emergencies |
| Veto Power (POTENTIAL — not yet certified) | Prohibit Partial Veto to Increase Tax or Fee Amendment | Prohibits governor from using partial veto to create or increase any tax or fee |
