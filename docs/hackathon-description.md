# Ballot Badger — ElevenHacks hackathon submission

## What it is

A voice agent that researches Wisconsin candidates and finds your polling place. You talk to it. It searches the web, pulls the records, and shows you what it found with source links.

Wisconsin has 28 races this cycle. Eleven people running for governor. A Supreme Court seat that decides the court's balance for the next decade. Three constitutional amendments. According to the March 2026 Marquette Law School poll, 38% of registered voters have heard nothing about the Supreme Court race. 53% are undecided. The election is April 7th.

I built Ballot Badger because I live in Milwaukee, I have nine races on my ballot, and I couldn't tell you who half the candidates are. The information is out there, scattered across government sites, campaign finance databases, fact-checkers, and local news. Nobody has time to pull it all together. So I built something that does.

## How ElevenLabs is used

The entire interface is voice-first. ElevenLabs ElevenAgents runs the conversation: speech-to-text captures the question, the LLM (GPT-OSS-120B) decides what to do, and text-to-speech narrates the findings back.

The voice agent has 17 tools registered through the ElevenLabs CLI:

- 6 display tools (show_candidate, show_vote, show_donors, show_fact_check, show_endorsement, show_measure) that render UI cards on screen while the agent talks
- 3 voter lookup tools (lookup_polling_place, lookup_ballot, lookup_registration) that navigate the state election site in the background while the agent keeps the conversation going
- 1 deep dive tool that runs a second pass of targeted research when the user says "go deeper"
- 3 navigation tools (select_candidate, set_filter, clear_results) that let the agent control the UI
- 1 race comparison tool that shows candidates side by side

Every tool is a non-blocking client tool. The agent calls a tool, it returns immediately, and the agent keeps talking while the data loads. When results arrive, cards build on screen mid-conversation. The voice and the display run in parallel on independent pipelines but converge on the same data.

The agent also has Firecrawl connected as an MCP server, giving it direct access to web search for questions outside the pre-built tool set.

## How Firecrawl is used

Firecrawl handles three jobs:

**1. Candidate research (Firecrawl v2 Search API)**

When you ask about a candidate, the app fires 5 parallel Firecrawl v2 search requests with full markdown content extraction. The queries are tailored to the candidate type: incumbents get Congress.gov voting record searches, challengers get state-level finance queries, ballot measures get impact analysis queries. Firecrawl returns web and news results with the full page content, not just snippets. This gives the synthesis model (Claude Sonnet 4) enough context to extract specific dollar amounts, vote records, and fact-check ratings.

For a single candidate query, Firecrawl searches across Congress.gov, OpenSecrets, PolitiFact, the Wisconsin Examiner, WPR, Milwaukee Journal Sentinel, and other Wisconsin news outlets. A typical query returns 40-44 sources.

**2. Deep dive research (Firecrawl v2 Search API + Scrape API)**

When the user says "go deeper on donors," the app runs 3 targeted search queries on that specific angle. For finance deep dives, it also scrapes the candidate's Transparency USA or OpenSecrets donor page directly using Firecrawl's Scrape API. The scrape returns the full markdown content of the donor records page, which gets fed to Claude for extraction of individual contributions, PAC donations, and fundraising totals.

Search and scrape run in parallel. A deep dive returns 15-20 additional sources on top of the initial research.

**3. Live government site automation (Firecrawl Interact API)**

This is the feature I'm most proud of. When you ask "where do I vote?" the app:

1. Calls Firecrawl's Scrape API to load myvote.wi.gov in a headless browser, passing the Cloudflare challenge and getting a browser session ID
2. Calls Firecrawl's Interact API in code mode with Playwright commands that type your address into the form fields (using pressSequentially to fire the keyboard events that ASP.NET WebForms requires for validation), click the Search button, and wait for the postback results to load
3. Extracts the raw page text with document.body.innerText
4. Passes the text to Claude to parse into structured JSON (polling place name, address, hours, ward)

The same flow works for ballot preview: it fills the form on myvote.wi.gov/PreviewMyBallot, clicks Search, waits for the ballot to load, and reads every race and candidate.

This isn't a database lookup. There's no pre-cached data. The app opens a real browser, fills out a real government form, and reads the real results. Every time.

The interact step uses Playwright's getByLabel() selectors (stable across page loads) instead of element IDs (which change per session). It uses pressSequentially() instead of fill() because the ASP.NET WebForms architecture on myvote.wi.gov requires actual keyboard events to trigger field validation. And it uses force: true on the click because ASP.NET wraps buttons in invisible span elements that break Playwright's default actionability checks.

## How they work together

The architecture keeps ElevenLabs and Firecrawl on separate tracks that run simultaneously:

1. User speaks into the microphone
2. ElevenLabs converts speech to text and the LLM decides which tool to call
3. The tool fires a non-blocking request to our API (Firecrawl search, scrape, or interact)
4. ElevenLabs immediately gets a response back and keeps talking ("Let me look into that. Your next election is April 7th. Don't forget your photo ID.")
5. Firecrawl runs the search or browser automation in the background (5-60 seconds depending on the task)
6. When Firecrawl returns, the UI renders the findings as cards on screen
7. The voice agent narrates the results if the session is still active

The user never waits in silence. The voice fills the gap while Firecrawl works. When results arrive, they build on screen card by card while the agent talks through them.

For the demo: I ask about Tom Tiffany, the voice agent starts talking about what it knows, Firecrawl searches 44 sources in the background, and within 15-20 seconds the screen fills with his voting record, campaign donors ($2M raised, Uihlein donations), a fact check showing he criticized a tax loophole he voted to create, and 5 news articles. Then I ask where I vote, and Firecrawl opens the state election site, types my Milwaukee address into the form, clicks search, and reads back: Lafollette Elementary School, 3239 N 9th St, 7 AM to 8 PM, Ward 113.

## Tech stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- ElevenLabs ElevenAgents (React SDK, v3 Conversational, GPT-OSS-120B)
- Firecrawl v2 API (Search, Scrape, Interact)
- Claude Sonnet 4 (structured data synthesis)
- Convex (backend)
- Tailwind CSS with neobrutalism design (Wisconsin blue #002986, gold #FFCC18)
- Vercel (120s function timeout for voter lookup)

## Built in 6 days

Solo build. Milwaukee, Wisconsin.

badger-ballot.vercel.app
