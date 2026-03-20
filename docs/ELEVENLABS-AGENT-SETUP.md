# ElevenAgents Setup Guide — Ballot Badger

Step-by-step instructions for configuring the voice agent in the ElevenLabs dashboard.

---

## Prerequisites

- ElevenLabs account at [elevenlabs.io](https://elevenlabs.io)
- Your Ballot Badger app deployed to Vercel (or running locally with ngrok for testing)
- API keys for Firecrawl and Anthropic in your `.env.local`

---

## Step 1: Create a New Agent

1. Go to [elevenlabs.io/app/agents](https://elevenlabs.io/app/agents)
2. Click **"Create Agent"** (or **"+ New Agent"**)
3. Select **"Blank"** template
4. Name it: **"Ballot Badger"**

---

## Step 2: Configure the Agent Tab

### First Message

Paste this as the agent's first message (what it says when a conversation starts):

```
Hey — I'm Ballot Badger. I dig into Wisconsin candidates so you don't have to. Ask me about anyone running for office — governor, state legislature, U.S. House, Supreme Court, attorney general, or the ballot measures. I can also help with voter registration and election dates. Who do you want me to dig into?
```

### System Prompt

Paste the following system prompt:

```
You are Ballot Badger, a nonpartisan civic research agent for Wisconsin's 2026 elections. You have a warm, direct tone — like a knowledgeable public radio reporter explaining things to a smart friend over coffee. You are NOT a political commentator. You never take sides.

## Your Capabilities

You have access to tools that search the web in real time and display visual components to the user. Use them proactively.

## How to Handle Requests

### When the user asks about a candidate or ballot measure:
1. Call the `pull_receipts` server tool with the candidate name and optional topic
2. Wait for the structured results
3. As you narrate each finding, call the corresponding client tool to display it visually:
   - When you first mention the candidate → call `show_candidate`
   - When you discuss a vote → call `show_vote`
   - When you discuss money/donors → call `show_donors`
   - When you cite a fact check → call `show_fact_check`
   - When you mention an endorsement → call `show_endorsement`
   - When you discuss a ballot measure → call `show_measure`
4. After presenting findings, ask: "Want me to dig deeper on the donors, the voting record, or check another candidate?"

### When the user asks a follow-up like "go deeper on donors":
1. Call the `deep_dive` server tool with the candidate and the specific angle
2. Narrate the detailed findings, calling client tools as appropriate

### When the user asks to switch candidates:
1. Call `clear_results` client tool
2. Call `select_candidate` client tool with the candidate ID
3. Then call `pull_receipts` for the new candidate

### When the user asks about races or filters:
1. Call `set_filter` client tool to change the directory view
   - Valid filters: "all", "governor", "supreme_court", "attorney_general", "house", "senate", "ballot"

### When the user asks general questions:
- Use your knowledge base for: election dates, voter registration, voter ID requirements, who's running, ballot measures
- Do NOT call Firecrawl for these — answer from knowledge base instantly

## Candidate IDs (for select_candidate tool)
- Governor (D): barnes, rodriguez, roys, hong, crowley, brennan, hughes
- Governor (R): tiffany, manske
- Supreme Court: taylor, lazar
- Attorney General: kaul, toney
- U.S. House: vanorden, cooke, pfaff, steil, felzkowski
- State Senate: sd5, sd15
- Ballot Measures: dei-amend, worship-amend, veto-amend

## Voice Style
- Direct, informed, accessible. Not preachy, not dramatic.
- Cite sources by name: "According to Congress.gov..." or "OpenSecrets shows..."
- Say "Let me dig into that..." when a tool is running (your filler phrase)
- Keep briefings to 4-6 sentences per finding, then pause for the user
- Never editorialize or express political opinions
```

### Model

Select **Claude Sonnet** or whichever LLM is available. If you can choose, prefer Claude Sonnet 4.

---

## Step 3: Configure Voice

1. Click the **Voice** tab
2. Set **Model** to **v3 Conversational** (most expressive, real-time)
3. Set **Voice ID** to: `5l5f8iK3YPeGga21rQIX`
   - Or browse the voice library and pick a voice that sounds like a 30-something public radio host — warm, clear, authoritative
4. Enable **Expressive Mode** if available
5. Set speaking speed to normal (1.0x)

---

## Step 4: Add Knowledge Base Documents

1. Click the **Knowledge Base** section
2. Click **"Add Document"**
3. Upload these files from your project (create them from the existing KB draft):

### Document 1: Election Dates
- **Name:** `Wisconsin Election Dates 2026`
- **Type:** Text or upload `background-docs/elevenlabs-kb.md`
- This covers: Spring election April 7, partisan primary August 11, general November 3, voter deadlines

### Document 2: Candidate Directory
- **Name:** `Wisconsin 2026 Candidate Directory`
- **Content:** Upload a text file with all candidates, their party, office, current role, and key facts. You can export from `src/data/candidates.ts`.

### Document 3: Ballot Measures
- **Name:** `Wisconsin 2026 Ballot Measures`
- **Content:** The three certified constitutional amendments (Anti-DEI, Worship Closure, Partial Veto) with full text summaries.

### Document 4: Voting Rules
- **Name:** `Wisconsin Voting Rules`
- **Content:** Voter eligibility, registration methods, photo ID requirements, early voting. From the KB draft.

All documents should be set to **Auto** retrieval mode (not Prompt mode).

---

## Step 5: Add Server Tools (Webhooks)

You need 3 server tools. For each one:
1. Click **"Add Tool"** in the Agent tab
2. Select **"Webhook"**

### Server Tool 1: pull_receipts

| Field | Value |
|-------|-------|
| **Name** | `pull_receipts` |
| **Description** | `Search the web for a candidate's voting record, campaign donors, fact checks, endorsements, news coverage, and platform positions. Use this when the user asks about a candidate or says "pull the receipts." Returns structured data that you should narrate and display using client tools.` |
| **Method** | POST |
| **URL** | `https://YOUR-VERCEL-URL.vercel.app/api/receipts` |

**Body Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `candidate` | string | `The candidate's name or ID (e.g., "tiffany", "Tom Tiffany", "barnes")` | Yes |
| `topic` | string | `Optional topic to focus on (e.g., "public lands", "abortion", "donors")` | No |

### Server Tool 2: deep_dive

| Field | Value |
|-------|-------|
| **Name** | `deep_dive` |
| **Description** | `Do a deeper search on a specific angle about a candidate. Use this when the user says "go deeper" or asks a focused follow-up question. Returns more detailed findings on the specific topic.` |
| **Method** | POST |
| **URL** | `https://YOUR-VERCEL-URL.vercel.app/api/deep-dive` |

**Body Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `candidate` | string | `The candidate's name or ID` | Yes |
| `angle` | string | `The specific topic to research (e.g., "campaign donors", "Jan 6 involvement", "education policy")` | Yes |

### Server Tool 3: candidate_profile

| Field | Value |
|-------|-------|
| **Name** | `candidate_profile` |
| **Description** | `Get a quick profile of a candidate or list all candidates. Use this for simple "who is" or "who's running" questions before doing a full search.` |
| **Method** | POST |
| **URL** | `https://YOUR-VERCEL-URL.vercel.app/api/candidate` |

**Body Parameters:**

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `candidate` | string | `The candidate's name or ID. Omit to get the full directory.` | No |

### Important Settings for All Server Tools:

- **Do NOT check "Wait for response"** — we want the agent to keep speaking while the tool runs
- Actually, **DO check "Wait for response"** for `pull_receipts` and `deep_dive` — the agent needs the data back before it can narrate findings. It should say "Let me dig into that..." as filler while waiting.
- For `candidate_profile`, you can check "Wait for response" — it returns instantly.

---

## Step 6: Add Client Tools

Client tools run on the user's browser. They don't need URLs — they're defined in our React code. But you still need to register them in the ElevenAgents dashboard so the agent knows they exist.

For each client tool:
1. Click **"Add Tool"**
2. Select **"Client"**

### Client Tool 1: show_candidate

| Field | Value |
|-------|-------|
| **Name** | `show_candidate` |
| **Description** | `Display a candidate profile card in the UI. Call this when you first mention a candidate in your narration.` |
| **Wait for response** | No (unchecked) |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | string | `Full name of the candidate` |
| `party` | string | `Political party: "Republican", "Democrat", "Independent"` |
| `office` | string | `Office they're running for` |
| `currentRole` | string | `Current position held` |
| `keyFact` | string | `One-line distinguishing fact` |
| `findingsCount` | number | `Number of data points found` |
| `severity` | string | `"high", "medium", or "low"` |

### Client Tool 2: show_vote

| Field | Value |
|-------|-------|
| **Name** | `show_vote` |
| **Description** | `Display a voting record card. Call this when you mention a specific vote or bill.` |
| **Wait for response** | No |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `bill` | string | `Name or number of the bill` |
| `vote` | string | `How they voted: "Yea", "Nay", "Objected", "Abstain", "Sponsored"` |
| `context` | string | `Brief explanation of what this vote means` |
| `date` | string | `Date of the vote (optional)` |
| `source` | string | `Source name, e.g., "Congress.gov"` |
| `sourceUrl` | string | `URL to the source` |
| `candidate` | string | `Who cast the vote` |

### Client Tool 3: show_donors

| Field | Value |
|-------|-------|
| **Name** | `show_donors` |
| **Description** | `Display a campaign finance table. Call this when you discuss donors, fundraising, or money.` |
| **Wait for response** | No |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `candidate` | string | `Candidate name` |
| `donors` | array | `Array of {name, amount, type, cycle} objects` |
| `totalRaised` | string | `Total amount raised (optional)` |
| `source` | string | `Source name` |
| `sourceUrl` | string | `URL to the source` |

### Client Tool 4: show_fact_check

| Field | Value |
|-------|-------|
| **Name** | `show_fact_check` |
| **Description** | `Display a fact-check badge. Call this when you cite a PolitiFact or other fact-check rating.` |
| **Wait for response** | No |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `claim` | string | `The claim that was fact-checked` |
| `rating` | string | `Rating: "True", "Mostly True", "Half True", "Mostly False", "False", "Pants on Fire"` |
| `source` | string | `Who fact-checked it` |
| `sourceUrl` | string | `URL to the fact check` |
| `year` | string | `Year of the fact check` |
| `candidate` | string | `Who is associated with the claim` |

### Client Tool 5: show_endorsement

| Field | Value |
|-------|-------|
| **Name** | `show_endorsement` |
| **Description** | `Display an endorsement card. Call this when you mention who has endorsed a candidate.` |
| **Wait for response** | No |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `endorser` | string | `Name of the endorser` |
| `type` | string | `"Organization", "Individual", "Union", "Newspaper"` |
| `context` | string | `Context about the endorsement` |
| `sourceUrl` | string | `URL to the source` |
| `candidate` | string | `Who was endorsed` |

### Client Tool 6: show_measure

| Field | Value |
|-------|-------|
| **Name** | `show_measure` |
| **Description** | `Display a ballot measure card with for/against arguments. Call this for constitutional amendments.` |
| **Wait for response** | No |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `title` | string | `Full title of the measure` |
| `summary` | string | `Summary of what it does` |
| `forArguments` | array | `Arguments in favor (array of strings)` |
| `againstArguments` | array | `Arguments against (array of strings)` |
| `sponsors` | string | `Who sponsored it (optional)` |
| `funding` | string | `Funding info (optional)` |

### Client Tool 7: select_candidate

| Field | Value |
|-------|-------|
| **Name** | `select_candidate` |
| **Description** | `Select and highlight a candidate in the directory sidebar. Call this when switching to a new candidate.` |
| **Wait for response** | No |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `candidate_id` | string | `The candidate ID (e.g., "tiffany", "barnes", "taylor")` |

### Client Tool 8: set_filter

| Field | Value |
|-------|-------|
| **Name** | `set_filter` |
| **Description** | `Change the race category filter in the directory. Call this when the user asks about a specific type of race.` |
| **Wait for response** | No |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `filter` | string | `Filter value: "all", "governor", "supreme_court", "attorney_general", "house", "senate", "ballot"` |

### Client Tool 9: clear_results

| Field | Value |
|-------|-------|
| **Name** | `clear_results` |
| **Description** | `Clear the findings panel before showing new results. Call this before switching to a new candidate.` |
| **Wait for response** | No |

**Parameters:** None

---

## Step 7: Configure Conversation Settings

1. Go to **Conversation flow** settings
2. Set **Soft timeout** to `3 seconds` — this is how long the agent waits before playing filler audio while a tool runs
3. Set the filler phrase to: `"Let me dig into that..."`

---

## Step 8: Test the Agent

1. Click **"Test AI Agent"** in the dashboard
2. Say: "Tell me about Tom Tiffany"
3. The agent should:
   - Say "Let me dig into that..."
   - Call `pull_receipts` with candidate "tiffany"
   - Start narrating findings
   - (Client tools won't render in the dashboard test — they only work in your React app)
4. Then say: "Go deeper on his donors"
5. The agent should call `deep_dive`

---

## Step 9: Get the Agent ID

1. After saving all settings, the agent ID is in the URL bar: `elevenlabs.io/app/agents/AGENT_ID_HERE`
2. Copy it
3. Add to your `.env.local`:

```env
NEXT_PUBLIC_ELEVEN_AGENT_ID=your_agent_id_here
```

4. Restart your dev server

---

## Step 10: Deploy and Test End-to-End

1. Deploy to Vercel: `vercel --prod`
2. Update the server tool URLs in ElevenAgents dashboard to point to your Vercel deployment URL
3. Open your deployed app
4. Select a candidate, click "Pull the receipts"
5. The voice agent should connect, start speaking, and client tools should render components in the UI

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Microphone not available" | Ensure HTTPS (Vercel deployment) or use `localhost` |
| Agent doesn't call tools | Check system prompt mentions tool names exactly |
| Client tools don't render | Verify tool names in dashboard match the code exactly |
| Server tools return errors | Check Vercel function logs, verify API keys are set |
| Voice sounds robotic | Switch to v3 Conversational model |
| Long delay before response | Normal — Firecrawl search takes 3-5s. Filler phrase covers it. |
