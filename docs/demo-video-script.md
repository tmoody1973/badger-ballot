# Ballot Badger — Demo video script

**Length:** 75-90 seconds
**Style:** You on camera + screen recording + voiceover
**Tone:** Stewart energy. Incredulous at the absurdity, specific with the facts, dead serious for two seconds when it counts.

---

## SHOT 1: The hook (0-12 seconds)
You at your desk. Casual. Direct to camera. Slight head shake.

> "Wisconsin votes in 12 days. April 7th. Nine races on my ballot. I couldn't name a candidate in six of them. And I'm the guy who BUILT the app. So imagine everyone else."

*Delivery: Conversational, not performative. The joke is real — you literally couldn't name the judges. Lean into that.*

---

## SHOT 2: The problem (12-22 seconds)
Remotion montage (see `docs/montage-assets.md` for the full prompt and links). Headlines stacking, the 38% stat punching in, contradictory amendment framing side by side, deepfake headline, ending on "How is anyone supposed to figure this out?"

> "Here's what Wisconsin looks like right now. Eleven people running for governor. A Supreme Court seat that flips the entire court for a decade. Marquette just polled it — 38% of voters have heard nothing about the race. Nothing. It's in 12 days. Three constitutional amendments — one side calls it the 'Equality Amendment,' the other side calls it 'banning DEI.' Same amendment. And then you go online and it's just... AI deepfakes, PAC ads, and a TikTok that says the election is in June. It's not in June."

*Delivery: "38% have heard nothing" gets the emphasis — slow down, let it land. Speed back up for the amendment contradiction. Deadpan on "It's not in June."*

---

## SHOT 3: The turn (22-27 seconds)
Screen recording. App loads — logo, candidate directory.

> "So I did what any reasonable person would do. I spent six days building an AI that does the homework for you."

*Delivery: Dry. The comedy is in "any reasonable person." Quick beat, then the app is on screen.*

---

## SHOT 4: The voice research (27-48 seconds)
Screen recording, LIVE voice interaction.

You click the voice button.

> "Tell me about Tom Tiffany."

On screen:
1. Listening indicator
2. Agent voice: "Let me dig into Tom Tiffany..." (audible 3-5 seconds)
3. Digging progress animation
4. Context card about the governor's race
5. CandidateCard with photo
6. Race comparison carousel — eleven governor candidates side by side
7. VoteRecord cards
8. DonorTable
9. FactCheckBadge: "Criticizes billionaire loophole but voted for the law that created it"
10. Status: "Found 44 sources"

Your voiceover fades in over the agent:

> "So that just searched 44 sources. Congress.gov for his votes. OpenSecrets for his money. PolitiFact for the stuff he says versus the stuff he does. And look — it found that he complained about a billionaire tax loophole that he literally voted to create. You can't make this up. Every finding links to its source. Check it yourself."

*Delivery: "You can't make this up" is the Stewart move — genuine disbelief at a real contradiction. Not angry, just... incredulous.*

---

## SHOT 5: The voter lookup (48-63 seconds)
Screen recording.

You, to the agent:
> "Where do I vote?"

Agent: "What's your address?"

You: "1108 W Chambers St, Milwaukee, 53206."

On screen:
- "Looking up your polling place..."
- PollingPlaceCard appears: Lafollette Elementary, 3239 N 9th St, 7 AM - 8 PM, Ward 113

Your voiceover:

> "OK so this is the part that blew my mind when I built it. It just opened a browser. Went to the actual state election website. Typed my address into the form. Clicked search. Read the results back to me. That's not a database lookup. That's a robot filling out a government website in real time. Lafollette Elementary. Ward 113. April 7th."

*Delivery: Genuine excitement. You're still impressed by your own thing. That's honest and it reads.*

---

## SHOT 6: The ballot (63-70 seconds)
Screen recording. BallotPreviewCard loads with 9 races.

> "Same thing for my ballot. Nine races. Every candidate. Pulled live off myvote.wi.gov. Including four circuit court judges I'd never heard of in my life."

*Delivery: The judges line is the self-deprecating beat. You're a voter admitting what all voters feel.*

---

## SHOT 7: The close (70-82 seconds)
Same setup as shot 1. Direct to camera. Drop the comedy for a second. Real.

> "Look. Wisconsin has a governor's race in November with eleven candidates. A Supreme Court seat on April 7th that decides the balance of the court. Three amendments. Circuit judges. County supervisors. Nobody is going to research all of that."

Beat. Slight lean in.

> "This does. Built in six days. ElevenLabs for the voice. Firecrawl for the web. Every answer cites its source."

Beat.

> "You know what's on your ballot?"

*Delivery: The shift from comedy to serious is what Stewart does best. The last line lands because you earned it with 70 seconds of showing the work.*

---

## SHOT 8: The badger (82-90 seconds)
Animated badger character. Pre-rendered 8-second clip.

> "Be like me. Before you vote, dig into the candidates and issues with Ballot Badger."

---

## END CARD (90-95 seconds)
Fade to black from the badger animation (1 second). Hold black for half a second. Then the logo fades in centered, clean, on the black background.

- Ballot Badger logo (white on black)
- `badger-ballot.vercel.app` below the logo
- ElevenLabs + Firecrawl + Groq logos smaller underneath
- `@firecrawl @elevenlabs #ElevenHacks`

Hold 4 seconds. Done.

---

## Recording checklist

Before you record:
- [ ] Run polling place once to warm up Firecrawl
- [ ] Run Tiffany research to confirm donors/votes/fact checks
- [ ] Run ballot to confirm 9 races
- [ ] Close all tabs, hide bookmarks, kill notifications
- [ ] Light mode on
- [ ] Address ready

Audio plan:
- Shots 1, 7: Your real voice on camera
- Shots 2, 3, 5, 6: Voiceover recorded separately
- Shot 4: Live interaction — your voice + agent voice

Editing the research (shot 4):
1. Record full interaction
2. Speed up digging progress to 2x
3. Keep agent narration at 1x
4. Cut to cards appearing

Short version (TikTok/Reels, 45-60s): Shots 1, 4 (trimmed), 5, 7.

---

## Post copy

**X:** "Wisconsin votes in 12 days. Eleven people running for governor. A Supreme Court seat that flips the whole court. Three amendments nobody can explain. So I built an AI that pulls actual voting records, actual donors, and actual fact checks from 44 sources — and finds your polling place off the state election site, live. 6 days. #ElevenHacks @firecrawl @elevenlabs"

**TikTok/IG:** "9 races on my ballot. Couldn't name a single judge. Built an AI that does the homework. #ElevenHacks #Wisconsin2026"

**LinkedIn:** "Wisconsin votes April 7th. Nine races on my ballot. Supreme Court, circuit court judges, county supervisor. I couldn't name half the candidates. November is worse — eleven people running for governor, three constitutional amendments, and a state senate map that's competitive for the first time in 15 years. So I spent six days building Ballot Badger for the ElevenHacks hackathon. You talk to it. It searches 44 sources — Congress.gov, OpenSecrets, PolitiFact, Wisconsin news — finds your polling place by navigating the state election site in real time, and shows what's on your actual ballot. ElevenLabs handles the voice. Firecrawl handles the web scraping and live browser automation. Every finding cites its source. No pre-loaded database. Everything is live."
