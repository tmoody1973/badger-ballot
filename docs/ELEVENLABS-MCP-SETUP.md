# ElevenAgents MCP Setup — Firecrawl Direct Integration

Add Firecrawl as an MCP server in ElevenAgents so the voice agent can search the web, navigate government sites, and do deep research directly — no webhooks needed.

## What this gives the agent

| MCP Tool | What it does | Use case |
|----------|-------------|----------|
| `firecrawl_search` | Search the web | "Tell me about Tom Tiffany" |
| `firecrawl_scrape` | Scrape a specific URL | Deep dive on a specific article |
| `firecrawl_interact` | Fill forms + navigate dynamic sites | "Where do I vote?" → navigates myvote.wi.gov |
| `firecrawl_interact_stop` | End an interact session | Clean up after voter lookup |
| `firecrawl_agent` | Multi-step AI research | "Go deeper on Tiffany's donors" |
| `firecrawl_agent_status` | Check research progress | Monitor long-running research |
| `firecrawl_extract` | Extract structured data from a page | Pull donor tables from OpenSecrets |
| `firecrawl_crawl` | Crawl a site | Crawl a candidate's website |
| `firecrawl_browser_create` | Create a browser session | Advanced browser automation |
| `firecrawl_browser_delete` | Close browser session | Clean up |

## Setup in ElevenAgents Dashboard

### Step 1: Go to your Ballot Badger agent

### Step 2: Find the MCP section
Look for "MCP" in the Tools tab or agent configuration.

### Step 3: Click "Add Custom MCP Server"

### Step 4: Fill in these fields

| Field | Value |
|-------|-------|
| **Name** | `Firecrawl` |
| **Description** | `Web search, page scraping, browser automation, and AI research agent via Firecrawl. Use firecrawl_search for candidate research. Use firecrawl_interact to navigate myvote.wi.gov for voter info (polling place, ballot preview). Use firecrawl_agent for deep multi-page research.` |
| **Server URL** | `https://mcp.firecrawl.dev/fc-6c51e9fbfb4548ca805620c585ea8351/v2/mcp` |
| **Secret Token** | Leave empty (API key is embedded in the URL) |
| **HTTP Headers** | None needed |

### Step 5: Click "Add Integration"
It should show 13 available tools.

### Step 6: Set tool approval mode
Set to **"No Approval"** for all tools so the agent can act autonomously.

### Step 7: Update the system prompt

Add this to the agent's system prompt:

```
### When the user asks about a candidate (use Firecrawl MCP directly):
1. Call firecrawl_search with the candidate's name and "Wisconsin 2026"
2. The search returns web results with content
3. Summarize the findings and narrate them to the user
4. Call the appropriate client tools (show_candidate, show_vote, etc.) to display findings

### When the user asks "where do I vote" or provides their address:
1. Call firecrawl_interact with:
   - url: "https://myvote.wi.gov/en-us/Find-My-Polling-Place"
   - prompt: "Fill Street Address with [address], City with [city], Zip with [zip]. Click Search. Tell me the polling place name, address, hours, and ward."
2. Narrate the polling place information
3. Call lookup_voter_info client tool to display the card

### When the user asks "what's on my ballot":
1. Call firecrawl_interact with:
   - url: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot"
   - prompt: "Fill Street Address with [address], City with [city], Zip with [zip]. Click Search. Wait for the sample ballot. List every race and candidate."
2. Narrate the ballot races
3. Call lookup_voter_info client tool with action "ballot" to display the card

### For deep research ("go deeper on donors"):
1. Call firecrawl_agent with a detailed research query
2. This does multi-page research automatically
3. Narrate the findings as they come back
```

## Why this matters for the hackathon

This is the most direct integration possible:
- **ElevenLabs** handles voice (speech-to-text, LLM reasoning, text-to-speech)
- **Firecrawl** handles ALL web interaction (search, scrape, browser, research) via MCP
- No middleware. No webhooks. No Vercel API routes for search.
- The voice agent talks directly to Firecrawl through the MCP protocol.

Judges see: "The ElevenLabs voice agent calls Firecrawl directly via MCP to search the web and navigate government sites."

## Important: Keep webhook tools as fallback

Don't remove the existing webhook tools (pull_receipts, deep_dive, etc.). The MCP tools add capability. If the agent uses MCP for search and it works, great. If not, the webhooks still work.

## IMPORTANT: Protect the MCP URL

The Server URL contains your Firecrawl API key. Treat it like a password:
- Don't share it publicly
- Don't commit it to git
- Don't show it in the demo video
