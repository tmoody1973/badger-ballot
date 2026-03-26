# Social media posts — Ballot Badger

Post these when the demo video goes live. Adjust the "12 days" / "April 7th" timing to match your actual post date.

---

## LinkedIn

Post type: Text + video. Pin the video. No external links in the post body (kills reach). Put the URL in the first comment.

```
Wisconsin votes April 7th.

Nine races on my ballot. Supreme Court, circuit court judges, county supervisor. I couldn't name half the candidates.

November is worse. Eleven people running for governor. Three constitutional amendments. A state senate map that's competitive for the first time in 15 years.

Marquette just polled it: 38% of registered voters have heard nothing about the Supreme Court race. Nothing. The election is in 12 days.

So I spent 6 days building Ballot Badger for the ElevenHacks hackathon.

You talk to it. It searches 44 sources — Congress.gov, OpenSecrets, PolitiFact, Wisconsin news outlets — and shows you what it found. Voting records. Campaign donors. Fact checks. Each finding links to its source.

The part that still surprises me: ask "where do I vote?" and it opens a headless browser, navigates the state election site, types your address into the form, clicks search, and reads your polling place back to you. Not a database. The actual government website, filled out in real time.

I asked about Tom Tiffany. It found that he raised $2 million, took Uihlein money, and criticized a billionaire tax loophole that he voted to create. 44 sources. Every one linked.

ElevenLabs handles the voice — the agent talks while the data loads, so you never wait in silence. Firecrawl handles the web — search, page scraping, and live browser automation on government forms. They run in parallel. Voice narrates while cards build on screen.

Built solo in Milwaukee. Wisconsin's elections are too important to leave to Facebook and TikTok for your research.

[video]
```

First comment:
```
Try it: badger-ballot.vercel.app

Built with @ElevenLabs ElevenAgents + @fiaborehene Firecrawl + Groq

#ElevenHacks #CivicTech #Wisconsin2026
```

---

## X / Twitter

Two options: a thread and a standalone post. Use the standalone when the video drops, then the thread a few hours later or the next day.

### Standalone (with video)

```
Wisconsin votes in 12 days. Nine races on my ballot. Couldn't name most of the candidates.

So I built an AI that:
- searches 44 sources (Congress.gov, OpenSecrets, PolitiFact)
- finds your actual polling place off the state election site — live
- narrates findings by voice while cards build on screen

It found Tiffany raised $2M and criticized a tax loophole he voted to create. 44 sources. Every one linked.

Built in 6 days for #ElevenHacks

@firecrawl @elevenlabs

badger-ballot.vercel.app
```

### Thread (more detail for builders)

```
1/ I built a voice agent that researches Wisconsin candidates and finds your polling place from the state election site.

6 days. Solo. For the @elevenlabs + @firecrawl hackathon.

Here's how it works and what I learned. 🧵

2/ The problem: Wisconsin has 28 races this cycle. 11 people running for governor. A Supreme Court seat 12 days away.

Marquette polled it — 38% of voters have heard nothing about the SC race. 53% undecided.

The information exists. It's just scattered across 20 different sites.

3/ So Ballot Badger searches them all at once.

You say "tell me about Tom Tiffany." It fires 5 parallel @firecrawl searches across Congress.gov, OpenSecrets, PolitiFact, and WI news.

44 sources. Full page content, not just snippets. Claude Sonnet synthesizes it into structured findings.

4/ The results render as cards: voting records, donor tables, fact checks, endorsements. Each one links to its source.

It found Tiffany criticized a "billionaire loophole" — then found he voted for the law that created it. You can't make that up.

5/ The voice part: @elevenlabs ElevenAgents runs the whole conversation. Speech-to-text, LLM reasoning, text-to-speech.

17 tools registered. All non-blocking — the agent calls a tool, it returns immediately, and the voice keeps talking while the data loads.

6/ The part that blew my own mind: "Where do I vote?"

The app opens a headless browser via @firecrawl's Interact API. Navigates myvote.wi.gov. Types my address into the form. Clicks search. Reads the results.

Lafollette Elementary. Ward 113. 7 AM to 8 PM. April 7th.

7/ That government site runs on ASP.NET WebForms. Regular page.fill() doesn't work — the form needs real keyboard events.

Had to use pressSequentially() to type each character, .blur() to trigger validation, and force:true on the click because ASP.NET wraps buttons in invisible spans.

8/ The architecture: ElevenLabs and Firecrawl run in parallel.

Voice talks → Firecrawl searches (5-60 seconds) → cards build on screen.

If voice disconnects, the data still renders. If the data is slow, the voice fills the gap.

Two independent pipelines. Same data.

9/ Stack:
- Next.js 16
- ElevenLabs ElevenAgents (GPT-OSS-120B)
- Firecrawl v2 (Search, Scrape, Interact APIs)
- Claude Sonnet 4 (synthesis)
- Convex (backend)
- Vercel (120s function timeout)

10/ Wisconsin votes April 7th. 28 races. 3 amendments. Nobody's going to research all of that.

This does.

badger-ballot.vercel.app

#ElevenHacks #CivicTech
```

---

## Instagram

### Reel caption (with the short video)

```
9 races on my ballot. Couldn't name a single judge.

So I built an AI that does the research for you. You talk to it. It searches 44 sources — voting records, campaign donors, fact checks — and shows you what it found.

It even finds your polling place by filling out the state election site in real time. Not a database. A robot filling out a government form.

Wisconsin votes April 7th. Are you ready?

Built in 6 days for the @elevenlabs x @firecrawl hackathon.

#ElevenHacks #CivicTech #Wisconsin2026 #AI #WisconsinElections #VoterInfo #BuildInPublic
```

### Carousel post (if you make one — 5-7 slides)

Slide 1: "9 races. I couldn't name 6 of them." (hook)
Slide 2: "38% of WI voters have heard NOTHING about the Supreme Court race" (the stat)
Slide 3: Screenshot of the app — candidate research cards (the product)
Slide 4: Screenshot of polling place card — Lafollette Elementary (the wow)
Slide 5: "44 sources. Every finding linked." (the proof)
Slide 6: "Built in 6 days. badger-ballot.vercel.app" (the CTA)

Caption for carousel:
```
Wisconsin votes in 12 days and I couldn't name most of the people on my ballot.

So I built Ballot Badger — a voice agent that searches 44 sources, pulls voting records and campaign donors, and finds your actual polling place from the state election site.

Ask it about any candidate. Every finding cites its source. No database. Everything live.

Built for the @elevenlabs x @firecrawl hackathon in 6 days.

Link in bio.

#ElevenHacks #CivicTech #Wisconsin2026 #AI #VoterInfo
```

---

## TikTok

Caption (short — TikTok penalizes long captions):

```
9 races on my ballot. Couldn't name a single judge. Built an AI that does the homework.

#ElevenHacks #Wisconsin2026 #CivicTech #AI #VoterInfo #BuildInPublic
```

If TikTok lets you add a link, use `badger-ballot.vercel.app` in bio.

---

## Posting order

1. Post the video on X first (fastest feedback loop, builder audience)
2. Post on LinkedIn within 2 hours (longer shelf life, professional audience)
3. Post Reel on Instagram + TikTok simultaneously
4. Post the X thread the next morning (catches a second wave)
5. Post the Instagram carousel 2 days later (different format, reaches different people)

## Engagement plan for launch day

- Reply to every comment within the first 2 hours (algorithm rewards early engagement)
- Quote-tweet/repost anyone who shares it with a specific thank-you
- Tag @firecrawl and @elevenlabs — if they repost, your reach multiplies
- Post a "behind the scenes" story on Instagram: screenshot of your code, the 3 AM commit, the moment the polling place worked for the first time
