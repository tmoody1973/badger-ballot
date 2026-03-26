# Ballot Badger

A voice agent that researches Wisconsin candidates and finds your polling place. You talk to it. It searches the web, pulls the records, and shows you what it found with source links.

**Demo:** https://youtu.be/rMkRTlEANxA

**Try it:** https://badger-ballot.vercel.app

---

## Why I built this

Wisconsin has 28 races this cycle. Eleven people running for governor. A Supreme Court seat that decides the court's balance for the next decade. Three constitutional amendments that read like they were written to confuse you on purpose.

Marquette Law School polled Wisconsin voters in March 2026. 38% of registered voters had heard nothing about the Supreme Court race. Not "a little." Nothing. 53% were undecided. The election is April 7th.

I live in Milwaukee. I have nine races on my ballot. I couldn't tell you who half the candidates are, and I'm the one who built the app. The information is out there — scattered across government sites, campaign finance databases, fact-checkers, and local news. But nobody has time to open 20 tabs and piece it together. So I built something that does it for you.

## How it works

The whole thing is voice-first. You talk to Ballot Badger the way you'd ask a friend who follows politics. "Tell me about Tom Tiffany." "Where do I vote?" "Go deeper on his donors."

ElevenLabs ElevenAgents runs the conversation. Speech-to-text captures your question. The LLM (GPT-OSS-120B) figures out what you're asking and decides which tools to call. Text-to-speech narrates the findings back while the UI builds on screen.

The voice agent has 17 tools registered through the ElevenLabs CLI. Six of them render cards on screen — candidate profiles, voting records, donor tables, fact-check badges, endorsements, ballot measures. Three navigate Wisconsin's official election site to find your polling place, preview your ballot, or check your registration. One runs a deeper second pass when you say "go deeper." Three let the agent control the UI — selecting candidates, filtering by race, clearing results. One shows candidates in a side-by-side comparison.

Every tool is non-blocking. The agent calls a tool, gets a response back immediately, and keeps talking while the real work happens in the background. When results arrive, cards build on screen mid-sentence. The voice and the display are two independent pipelines that happen to converge on the same data. If the voice disconnects, the cards still render. If the data is slow, the voice fills the gap.

The agent also has Firecrawl connected as an MCP server for questions that fall outside the pre-built tools — general web searches, follow-up questions, anything the 17 tools don't cover.

## How Firecrawl is used

Firecrawl does three things in this app, and they're all different APIs.

**Candidate research** uses the Firecrawl v2 Search API. When you ask about a candidate, the app fires 5 parallel search requests with full markdown content extraction. The queries are tuned to the candidate type — incumbents get Congress.gov voting record searches and OpenSecrets donor queries, challengers get state-level finance searches, ballot measures get impact analysis queries. Firecrawl returns web and news results with the actual page content, not just two-line snippets. That full content is what lets Claude Sonnet 4 extract specific dollar amounts, individual vote records, and fact-check ratings. For a single candidate, Firecrawl pulls from Congress.gov, OpenSecrets, PolitiFact, the Wisconsin Examiner, WPR, the Milwaukee Journal Sentinel, and a handful of other Wisconsin outlets. A typical query comes back with 40 to 44 sources.

**Deep dives** use both the Search API and the Scrape API. When someone says "go deeper on donors," the app runs 3 targeted search queries on that specific angle. For finance deep dives, it also scrapes the candidate's Transparency USA or OpenSecrets donor page directly. The scrape returns the full markdown of the donor records — individual contributions, PAC donations, fundraising totals — which Claude then extracts into structured data. Search and scrape run in parallel. A deep dive adds 15 to 20 sources on top of the initial research.

**Live government site automation** uses the Firecrawl Interact API, and it's the feature I keep coming back to. When you ask "where do I vote?" the app loads myvote.wi.gov in a headless browser through Firecrawl's Scrape API, which handles the Cloudflare challenge and returns a browser session ID. Then it calls the Interact API in code mode — actual Playwright commands that type your address into the form fields, click Search, and wait for the results to load.

The government site runs on ASP.NET WebForms, which turned out to be the hardest part of the whole build. Standard Playwright fill() commands don't trigger the keyboard events that ASP.NET needs for field validation, so the form thinks it's empty and the Search button does nothing. The fix was pressSequentially(), which types each character one at a time and fires all the keydown/keypress/input events the framework expects. Each field also needs a blur event after typing to trigger validation. And the Search button is wrapped in an invisible span that breaks Playwright's default click behavior, so it needs force: true.

Once the results load, the app extracts the raw page text with document.body.innerText and hands it to Claude to parse into structured JSON — polling place name, address, hours, ward number. The same flow works for ballot preview. It fills the form on the "What's On My Ballot" page, waits for the ballot to load, and reads back every race and candidate.

None of this is a database lookup. There's no cached data. It opens a real browser, fills out a real government form, and reads real results. Every time.

## How ElevenLabs and Firecrawl work together

The two platforms run on parallel tracks.

You speak into the microphone. ElevenLabs converts it to text and the LLM decides what to do. It calls a tool — say, lookup_polling_place — and gets a response back instantly: "Looking up your polling place. Your next election is April 7th. Don't forget your photo ID." The agent keeps talking.

Meanwhile, the app fires a request to our API. Firecrawl opens the government site, fills the form, clicks Search, waits for results. This takes 30 to 60 seconds. The user never sits in silence because the voice is filling that time with useful context — election dates, photo ID reminders, what else is on the ballot.

When Firecrawl finishes, the polling place card appears on screen. If the voice session is still active, the agent can narrate what it found. If the session dropped, the card renders anyway.

Same pattern for candidate research. The agent calls the tool, starts talking about what it knows, and Firecrawl searches 44 sources in the background. Results build on screen as cards — voting records, donor tables, fact checks — while the voice walks through the findings.

Two pipelines. One for voice. One for data. They meet on screen.

## Tech stack

Next.js 16 with TypeScript. ElevenLabs ElevenAgents with the React SDK and GPT-OSS-120B. Firecrawl v2 for search, scrape, and browser automation. Claude Sonnet 4 for structured data synthesis. Convex for the backend. Tailwind CSS with a neobrutalism design in Wisconsin blue and gold. Deployed on Vercel with a 120-second function timeout for the voter lookup routes.

Built solo in six days. Milwaukee, Wisconsin.
