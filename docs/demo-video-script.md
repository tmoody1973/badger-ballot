# Ballot Badger — Demo Video Script

**Total length:** 75-90 seconds
**Style:** Screen recording + real-world shots + ElevenLabs voiceover
**Tone:** Confident, direct, civic-minded. Not salesy.

---

## SHOT 1: The ballot reveal (0-8 seconds)
**Type:** Screen recording
**What's on screen:** BallotPreviewCard fully loaded with all 9 races for 1108 W Chambers St, Milwaukee, 53206. Election countdown showing "14 days."

**Voiceover:**
> "This is my actual ballot for April 7th. Nine races. An AI just pulled it from the Wisconsin election site — in real time."

**Why this works:** Immediately personal, real data, real government source. Judges think "wait, it actually did that?"

---

## SHOT 2: The problem (8-15 seconds)
**Type:** Real-world shot — you at your laptop, maybe at a kitchen table or desk. Quick, casual.

**You on camera (or voiceover over the real-world shot):**
> "Wisconsin has 28 races this year. Open governor's seat. Supreme Court. Three constitutional amendments. Nobody has time to research all of it."

**Cut to:** Brief flash of myvote.wi.gov, Ballotpedia, OpenSecrets tabs open — the overwhelm.

---

## SHOT 3: Introduce Ballot Badger (15-20 seconds)
**Type:** Screen recording — the app landing page with the Ballot Badger logo, candidate directory, neobrutalism UI.

**Voiceover:**
> "So I built Ballot Badger. You talk to it. It searches the web, pulls the receipts, and shows you what it found."

---

## SHOT 4: The voice research — the money shot (20-45 seconds)
**Type:** Screen recording of LIVE voice interaction

**Setup:** App is open. You click "Talk to Ballot Badger."

**You speaking (recorded live):**
> "Tell me about Tom Tiffany."

**What happens on screen:**
1. Voice connects — listening indicator appears
2. Agent says "Let me dig into that..." (we hear the ElevenLabs voice)
3. Digging progress animation: "Searching public records... Following the money trail..."
4. Quick context card appears: "Wisconsin's first open governor's race since 2010"
5. CandidateCard for Tiffany appears with photo
6. Race comparison carousel scrolls into view — all governor candidates side by side
7. VoteRecord cards appear: "Nay on Great American Outdoors Act"
8. DonorTable: Uihlein donations
9. FactCheckBadge: "Criticizes billionaire loophole but voted for law that created it"
10. Status: "Found 42 sources"

**Voiceover (over the visual montage, not the agent's voice — let the agent's voice play for a few seconds, then fade it under the voiceover):**
> "Firecrawl searches 40+ sources across Congress.gov, OpenSecrets, PolitiFact, and Wisconsin news. Groq synthesizes the findings. The ElevenLabs voice agent narrates while the UI builds in real time."

**Key:** Let the ElevenLabs agent voice be audible for 3-5 seconds so judges hear it's real. Then voiceover takes over.

---

## SHOT 5: The voter lookup — jaw-drop #2 (45-60 seconds)
**Type:** Screen recording

**You speaking to the agent (or typing in the app):**
> "Where do I vote?"

**Agent responds:** "What's your address?"

**You:** "1108 W Chambers St, Milwaukee, 53206."

**What happens on screen:**
1. Status: "Looking up your polling place..."
2. PollingPlaceCard appears:
   - Lafollette, Robert M. Elementary School
   - 3239 N 9th St, Milwaukee, WI 53206
   - Tuesday, April 7, 2026 — 7:00 AM - 8:00 PM
   - Ward 113
   - Election countdown: 14 days
   - "Verify on MyVote" button

**Voiceover:**
> "It just navigated myvote.wi.gov — the official state election site — filled in my address, and pulled my actual polling place. That's Firecrawl's Browser Sandbox filling a government form in real time."

---

## SHOT 6: The comparison (60-68 seconds)
**Type:** Screen recording — the race comparison carousel

**What's on screen:** Scrolling through governor candidates — Barnes, Rodriguez, Roys, Hong, Crowley, Tiffany — each with photos, party badges, key facts, severity dots.

**Voiceover:**
> "Every race. Every candidate. Side by side. Click any card to pull their receipts."

---

## SHOT 7: The close — real world (68-80 seconds)
**Type:** Real-world shot — you holding your phone or at your laptop, direct to camera.

**You on camera:**
> "Wisconsin votes April 7th. Ballot Badger covers 28 races, cites every source, and tells you where to vote. Built in 6 days with ElevenLabs, Firecrawl, and Groq for the ElevenHacks hackathon."

---

## END CARD (80-85 seconds)
**Type:** Static graphic

**On screen:**
- Ballot Badger logo (the SVG wordmark)
- `badger-ballot.vercel.app`
- Tech logos: ElevenLabs · Firecrawl · Groq
- `@firecrawl @elevenlabs #ElevenHacks`

---

## Recording tips

### Before you record:
- [ ] Test the voice agent — make sure it connects and speaks
- [ ] Pre-search Tiffany once so the data is cached/fast for the recording
- [ ] Test the voter lookup — confirm it returns Lafollette Elementary
- [ ] Close all other tabs, hide bookmarks bar, turn off notifications
- [ ] Dark mode OFF (our app is light mode, looks better on video)

### Audio plan:
- **Shots 1-3, 5-7:** ElevenLabs generated voiceover (clean, professional)
- **Shot 4:** Live voice interaction — your real voice + agent's ElevenLabs voice
- **Shot 7:** You on camera with your voice (builds trust, shows the builder)

### How to record the "live" voice interaction (Shot 4):
The voice agent is slow (15-20 seconds of digging). For the video:
1. Start the voice session
2. Ask about Tiffany
3. Record the full interaction
4. In editing, speed up the digging progress (2x speed)
5. Keep the agent's narration at normal speed
6. Cut to the results appearing

### Editing approach:
- Use ScreenFlow, OBS, or QuickTime for screen recording
- Use your phone for the real-world shots
- Use CapCut or iMovie to edit
- Add subtle background music (lo-fi, civic, not distracting)
- Keep cuts tight — every second earns its place

### Platform versions:
| Platform | Length | What to cut |
|----------|--------|------------|
| **TikTok** | 45-60s | Shots 1, 4 (shortened), 5, 7. Skip problem/carousel. |
| **Instagram Reels** | 45-60s | Same as TikTok |
| **X/Twitter** | 75-90s | Full version |
| **LinkedIn** | 75-90s | Full version + text post (already written in docs/social/) |

### Post copy for each platform:
**X:** "I built an AI that pulls the receipts on every Wisconsin candidate. Firecrawl searches the web. ElevenLabs narrates. It even finds your polling place from the state election site. Built in 6 days for #ElevenHacks. @firecrawl @elevenlabs"

**TikTok/IG:** "This AI researches candidates and finds your polling place in real time 🗳️ #ElevenHacks #CivicTech #Wisconsin2026 #AI"
