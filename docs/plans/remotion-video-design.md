# Ballot Badger — Remotion video design

## Overview

Hackathon demo video for **Ballot Badger** (badger-ballot.vercel.app) — a voice-first civic accountability agent for Wisconsin 2026 elections. Built for ElevenHacks (Firecrawl + ElevenAgents).

- **Full Video**: 1920x1080, 30fps, ~95 seconds (~2850 frames)
- **TikTok/Reels**: 1080x1920, 30fps, ~55 seconds (vertical cut)

**Structure**: Real-world camera shots + Remotion motion graphics + screen recordings + animated badger + end card. Remotion stitches everything together with transitions, text overlays, and synced voiceover.

---

## Brand tokens

| Token | Value |
|-------|-------|
| Dark BG | `#0a0a0a` (near black) |
| Light BG | `#F8F7F4` (warm white — matches app) |
| Wisconsin Blue | `#002986` |
| Wisconsin Gold | `#FFCC18` |
| Alert Red | `#dc2626` |
| Border | `#1a1a1a` |
| Muted text | `#71717a` |
| Heading font | DM Sans (bold, app headings) |
| Body font | Public Sans (app body) |
| Data font | JetBrains Mono (stats, numbers) |

---

## Full video (1920x1080, 30fps, ~95s = ~2850 frames)

### Scene 1 — THE HOOK (0s-12s, 360 frames)

**Visual**: Real-world camera footage. You at your desk, direct to camera.

**Asset needed**: `recordings/hook-on-camera.mp4`

**Voiceover (your real voice, on camera):**
> "Wisconsin votes in 12 days. April 7th. Nine races on my ballot. I couldn't name a candidate in six of them. And I'm the guy who BUILT the app. So imagine everyone else."

**Motion**: Import video. Subtle slow zoom (scale 1.0 → 1.03 over 12s). Lower-third text overlay at 2s: "Tarik Moody · Milwaukee, WI" in DM Sans, fades out at 8s.

**Duration**: 12 seconds

---

### Scene 2 — THE PROBLEM (12s-22s, 300 frames)

**Visual**: Remotion-generated motion graphics. This is the montage. Five rapid-fire segments, hard cuts between each.

**Segment A (frames 360-420): "The volume"**
Headlines stack from bottom, one every 8 frames, slightly rotated:
- "Here Are All 11 Candidates Running for Governor" — Milwaukee Magazine
- "Supreme Court Race: Taylor vs. Lazar" — WPR
- "3 Constitutional Amendments Heading to November Ballot" — Wisconsin Examiner
- "72 School Referenda on April 7 Ballot" — Ballotpedia
White cards, black text, slight drop shadows, alternating -2deg/+2deg rotation. Stack and overlap to create visual overwhelm.

**Segment B (frames 421-490): "38%"**
Hard cut to black. The stat punches in:
- "38%" in `#dc2626`, 200px JetBrains Mono bold
- Below: "of Wisconsin voters have heard NOTHING" in white, 36px DM Sans
- Below: "about the Supreme Court race" in `#71717a`, 24px
- Below: "— Marquette Law School, March 2026" in `#71717a`, 16px JetBrains Mono
Scale spring from 0.8 → 1.0 (damping: 12, mass: 0.5). Subtle screen shake on land (translateX oscillation, 2px, 3 cycles over 8 frames).

**Segment C (frames 491-555): "The contradictions"**
Split screen:
- Left card (blue-tinted border): "WILL-Backed Equality Amendment on November Ballot"
- Right card (red-tinted border): "Vote NO on GOP Ballot Amendment to Ban DEI"
- Below both: "Same amendment." in white, centered, 28px DM Sans
Cards slide in from opposite sides with spring (damping: 15).

**Segment D (frames 556-620): "The misinformation"**
Three lines appear typewriter style (20ms per character):
1. "GOP releases AI deepfake of Democratic candidate" — CNN
2. "58% of Americans expect synthetic lies to escalate" — AI CERTs
3. "TikTok claims Wisconsin votes in June. It doesn't."
Line 3: "It doesn't." in `#dc2626` bold. Each line 28px Public Sans on `#0a0a0a`.

**Segment E (frames 621-660): "The ask"**
Hard cut to black. 10-frame pause. Fade in (opacity 0→1 over 20 frames):
"How is anyone supposed to figure this out?"
White, 48px DM Sans, centered.

**Voiceover (recorded separately):**
> "Here's what Wisconsin looks like right now. Eleven people running for governor. A Supreme Court seat that flips the entire court for a decade. Marquette just polled it — 38% of voters have heard nothing about the race. Nothing. It's in 12 days. Three constitutional amendments — one side calls it the 'Equality Amendment,' the other side calls it 'banning DEI.' Same amendment. And then you go online and it's just... AI deepfakes, PAC ads, and a TikTok that says the election is in June. It's not in June."

**Audio file**: `public/voiceover/scene-02-problem.mp3`

**Duration**: 10 seconds

---

### Scene 3 — THE TURN (22s-27s, 150 frames)

**Visual**: Transition: 0.5s dissolve from black to screen recording of the app loading. Browser window with Ballot Badger — logo, candidate directory sidebar, neobrutalism UI.

**Asset needed**: `recordings/app-load.mp4` — screen recording of the app loading at localhost or production, captured at 1920x1080. Clean browser, no bookmarks.

**Motion**: Video plays at 1x. Subtle MacOS browser window chrome overlay (optional). Text overlay appears bottom-left at 2s: "badger-ballot.vercel.app" in JetBrains Mono 16px, `#71717a`.

**Voiceover:**
> "So I did what any reasonable person would do. I spent six days building an AI that does the homework for you."

**Audio file**: `public/voiceover/scene-03-turn.mp3`

**Duration**: 5 seconds

---

### Scene 4 — THE VOICE RESEARCH (27s-48s, 630 frames)

**Visual**: Screen recording of LIVE voice interaction with the app. This is the hero shot. Record the full interaction, then edit in Remotion.

**Asset needed**: `recordings/tiffany-research.mp4` — full screen recording of:
1. Click voice button
2. Say "Tell me about Tom Tiffany"
3. Agent responds, digging progress animation plays
4. Cards build: CandidateCard, RaceComparison, VoteRecords, DonorTable, FactCheckBadge
5. Status: "Found 44 sources"

Record at 60fps (we'll use 30fps in Remotion). Total raw recording: 30-45 seconds.

**Motion**:
- frames 0-90 (0-3s): Play at 1x — voice connects, you ask the question, agent starts talking. Agent's real voice is audible.
- frames 91-270 (3-9s): Speed up to 2x — digging progress animation
- frames 271-630 (9-21s): Play at 1x — cards building, agent narrating

Your voiceover fades in at frame 150 (5s), mixed at 70% volume over the agent voice at 30%:

**Voiceover:**
> "So that just searched 44 sources. Congress.gov for his votes. OpenSecrets for his money. PolitiFact for the stuff he says versus the stuff he does. And look — it found that he complained about a billionaire tax loophole that he literally voted to create. You can't make this up. Every finding links to its source. Check it yourself."

**Audio files**:
- `public/voiceover/scene-04-research.mp3` (your voiceover)
- `recordings/tiffany-research.mp4` includes the live agent audio

**Duration**: 21 seconds

---

### Scene 5 — THE VOTER LOOKUP (48s-63s, 450 frames)

**Visual**: Screen recording of the voter lookup interaction.

**Asset needed**: `recordings/voter-lookup.mp4` — screen recording of:
1. You say (or type) "Where do I vote?"
2. Agent asks for address
3. You say "1108 W Chambers St, Milwaukee, 53206"
4. Status: "Looking up your polling place..."
5. PollingPlaceCard appears: Lafollette Elementary, 3239 N 9th St, 7 AM - 8 PM, Ward 113, 12 days countdown

Record at 60fps. The lookup takes 30-60 seconds real time. Speed up the waiting period to 2x. Keep the card appearing at 1x.

**Motion**:
- frames 0-60: Play at 1x — you ask, agent responds
- frames 61-300: Speed up to 3x — "Looking up..." waiting period
- frames 301-450: Play at 1x — card appears, data fills in

Zoom-in effect (scale 1.0 → 1.15) when the PollingPlaceCard appears, centered on the card. Spring animation (damping: 20).

**Voiceover:**
> "OK so this is the part that blew my mind when I built it. It just opened a browser. Went to the actual state election website. Typed my address into the form. Clicked search. Read the results back to me. That's not a database lookup. That's a robot filling out a government website in real time. Lafollette Elementary. Ward 113. April 7th."

**Audio file**: `public/voiceover/scene-05-voter-lookup.mp3`

**Duration**: 15 seconds

---

### Scene 6 — THE BALLOT (63s-70s, 210 frames)

**Visual**: Screen recording. BallotPreviewCard loading with all 9 races.

**Asset needed**: `recordings/ballot-preview.mp4` — screen recording of the ballot card appearing with 9 races listed.

**Motion**: Play at 1x. Zoom slowly from 1.0 → 1.05 to draw eye to the ballot card.

**Voiceover:**
> "Same thing for my ballot. Nine races. Every candidate. Pulled live off myvote.wi.gov. Including four circuit court judges I'd never heard of in my life."

**Audio file**: `public/voiceover/scene-06-ballot.mp3`

**Duration**: 7 seconds

---

### Scene 7 — THE CLOSE (70s-82s, 360 frames)

**Visual**: Real-world camera footage. Same setup as Scene 1. Direct to camera.

**Asset needed**: `recordings/close-on-camera.mp4`

**Voiceover (your real voice, on camera):**
> "Look. Wisconsin has a governor's race in November with eleven candidates. A Supreme Court seat on April 7th that decides the balance of the court. Three amendments. Circuit judges. County supervisors. Nobody is going to research all of that."
>
> "This does. Built in six days. ElevenLabs for the voice. Firecrawl for the web. Every answer cites its source."
>
> "You know what's on your ballot?"

**Motion**: Same subtle slow zoom as Scene 1. No overlays. Let the words do the work.

**Duration**: 12 seconds

---

### Scene 8 — THE BADGER (82s-90s, 240 frames)

**Visual**: Pre-rendered animated badger character clip.

**Asset needed**: `recordings/animated-badger.mp4` — your 8-second badger animation

**Audio (baked into the clip):**
> "Be like me. Before you vote, dig into the candidates and issues with Ballot Badger."

**Motion**: Play at 1x. The clip plays as-is.

**Duration**: 8 seconds

---

### Scene 9 — END CARD (90s-95s, 150 frames)

**Visual**: Remotion-generated. Fade to black (30 frames / 1s). Hold black (15 frames / 0.5s). Then logo fades in.

**Assets needed**:
- `public/branding/badger-ballot-logo-white.svg` (or PNG) — logo for dark background
- `public/branding/elevenlabs-logo.svg`
- `public/branding/firecrawl-logo.svg`
- `public/branding/groq-logo.svg`

**Layout (centered on `#0a0a0a`):**
- Ballot Badger logo — white, 200px wide, centered
- `badger-ballot.vercel.app` — 24px JetBrains Mono, `#FFCC18` (gold), 20px below logo
- Tech logos row — ElevenLabs + Firecrawl + Groq, 40px tall, `#71717a` tint, 40px below URL, spaced 30px apart
- `@firecrawl @elevenlabs #ElevenHacks` — 14px Public Sans, `#71717a`, 30px below logos

**Motion**:
- Logo: opacity 0→1 over 20 frames, scale spring 0.9→1.0 (damping: 20)
- URL: fade in 10 frames after logo
- Tech logos: stagger in left to right, 5 frames apart
- Hashtags: fade in last

Hold to end.

**Duration**: 5 seconds

---

## TikTok/Reels version (1080x1920, 30fps, ~55s)

| Scene | Duration | Adaptation |
|-------|----------|------------|
| Hook (on camera) | 8s | Crop to vertical center, larger lower-third |
| Problem montage | 8s | Same segments, text scaled up for vertical |
| Turn (app load) | 3s | Crop to app center, skip browser chrome |
| Voice research | 15s | Crop to right panel (cards building) |
| Voter lookup | 10s | Crop to PollingPlaceCard |
| Close (on camera) | 8s | Same crop as hook |
| Badger | 3s | Trimmed to just the punchline |
| End card | 3s | Vertical layout, logo + URL stacked |

Skip the ballot scene for Reels (saves time, the polling place is the stronger demo).

---

## ElevenLabs voiceover

### Full script (scenes 2, 3, 4, 5, 6 — your voiceover, not the on-camera parts)

```
Here's what Wisconsin looks like right now. Eleven people running for governor.
A Supreme Court seat that flips the entire court for a decade. Marquette just
polled it — 38% of voters have heard nothing about the race. Nothing. It's in
12 days. Three constitutional amendments — one side calls it the Equality
Amendment, the other side calls it banning DEI. Same amendment. And then you go
online and it's just... AI deepfakes, PAC ads, and a TikTok that says the
election is in June. It's not in June.

So I did what any reasonable person would do. I spent six days building an AI
that does the homework for you.

So that just searched 44 sources. Congress.gov for his votes. OpenSecrets for
his money. PolitiFact for the stuff he says versus the stuff he does. And look
— it found that he complained about a billionaire tax loophole that he literally
voted to create. You can't make this up. Every finding links to its source.
Check it yourself.

OK so this is the part that blew my mind when I built it. It just opened a
browser. Went to the actual state election website. Typed my address into the
form. Clicked search. Read the results back to me. That's not a database lookup.
That's a robot filling out a government website in real time. Lafollette
Elementary. Ward 113. April 7th.

Same thing for my ballot. Nine races. Every candidate. Pulled live off myvote
dot wi dot gov. Including four circuit court judges I'd never heard of in my
life.
```

### ElevenLabs settings

| Setting | Value |
|---------|-------|
| Voice | Your voice clone, or a warm confident voice |
| Model | `eleven_multilingual_v2` |
| Stability | 0.40 (expressive — Stewart energy needs range) |
| Similarity boost | 0.80 |
| Style | 0.40 |
| Speed | 1.0 for full video, 1.05 for Reels |

### Per-scene audio files

```
public/voiceover/ballot-badger/
├── scene-02-problem.mp3
├── scene-03-turn.mp3
├── scene-04-research.mp3
├── scene-05-voter-lookup.mp3
└── scene-06-ballot.mp3
```

Scenes 1, 7 use on-camera audio from the recorded video clips.
Scene 8 uses audio baked into the animated badger clip.

---

## Assets checklist

### From Ballot Badger codebase

| Source | Copy to Remotion `public/` as | Scene |
|--------|-------------------------------|-------|
| `public/branding/badger-ballot-logo.svg` | `branding/badger-ballot-logo.svg` | 3, 9 |
| `public/branding/badger-ballot-logo-white.svg` (if exists) | `branding/badger-ballot-logo-white.svg` | 9 |

### Screen recordings you need to capture

Record at 1920x1080, 60fps. Clean browser, no bookmarks, light mode, notifications off.

| ID | What to record | Filename | Raw duration | Remotion speed |
|----|---------------|----------|-------------|----------------|
| R1 | You on camera — hook | `recordings/hook-on-camera.mp4` | 12-15s | 1x |
| R2 | App loading — landing page with directory | `recordings/app-load.mp4` | 5-8s | 1x |
| R3 | Full Tiffany voice research — click voice, ask, wait, cards build | `recordings/tiffany-research.mp4` | 30-45s | mixed 1x/2x |
| R4 | Voter lookup — ask, give address, card appears | `recordings/voter-lookup.mp4` | 40-70s | mixed 1x/3x |
| R5 | Ballot preview — card loads with 9 races | `recordings/ballot-preview.mp4` | 40-70s | mixed 1x/3x |
| R6 | You on camera — close | `recordings/close-on-camera.mp4` | 12-15s | 1x |
| R7 | Animated badger clip | `recordings/animated-badger.mp4` | 8s | 1x |

### Tech logos needed for end card

| Logo | Source | Filename |
|------|--------|----------|
| ElevenLabs | Their press kit or website | `branding/elevenlabs-logo.svg` |
| Firecrawl | Their press kit or website | `branding/firecrawl-logo.svg` |
| Groq | Their press kit or website | `branding/groq-logo.svg` |

### Motion graphics built in Remotion (no external assets)

- Scene 2: headline cards, 38% stat, split-screen contradiction, typewriter misinformation, "how is anyone" text
- Scene 9: end card with logo + URL + tech logos + hashtags
- All scene transitions (dissolves, hard cuts, fades to black)
- Lower-third name overlay (Scene 1)
- URL overlay (Scene 3)
- Zoom effects on cards (Scenes 5, 6)

---

## Remotion file structure

```
src/
├── BallotBadgerFull.tsx           # Full composition (1920x1080, 95s)
├── BallotBadgerReels.tsx          # Reels composition (1080x1920, 55s)
├── Root.tsx                       # Register both compositions
├── scenes/
│   ├── HookScene.tsx              # Camera footage + lower-third overlay
│   ├── ProblemMontage.tsx         # Motion graphics — headlines, 38%, contradictions
│   ├── TurnScene.tsx              # App screen recording + URL overlay
│   ├── ResearchScene.tsx          # Tiffany voice interaction footage
│   ├── VoterLookupScene.tsx       # Polling place screen recording + zoom
│   ├── BallotScene.tsx            # Ballot preview screen recording
│   ├── CloseScene.tsx             # Camera footage — closing remarks
│   ├── BadgerScene.tsx            # Animated badger clip
│   └── EndCardScene.tsx           # Logo + URL + tech logos
├── components/
│   ├── HeadlineCard.tsx           # Stacking headline card (Scene 2A)
│   ├── StatReveal.tsx             # "38%" stat with screen shake (Scene 2B)
│   ├── SplitComparison.tsx        # Amendment contradiction side-by-side (Scene 2C)
│   ├── TypewriterLine.tsx         # Typewriter text effect (Scene 2D)
│   ├── LowerThird.tsx             # Name/location overlay (Scene 1)
│   ├── UrlOverlay.tsx             # URL text overlay (Scene 3)
│   └── TechLogoRow.tsx            # ElevenLabs + Firecrawl + Groq (Scene 9)
├── lib/
│   ├── fonts.ts                   # DM Sans + Public Sans + JetBrains Mono
│   └── colors.ts                  # Brand color constants
└── generate-voiceover.ts          # ElevenLabs TTS generation script
```

---

## Background music

Subtle lo-fi or ambient beat at 15% volume underneath everything. Fade in 1s at start, fade out 2s before end card.

Source: Royalty-free. Place at `public/music/bg-beat.mp3`.

Mute background music during Scene 4 when the agent's voice is audible (frames 810-900), fade back in after.

---

## Recording day checklist

Before you record anything:
- [ ] Warm up polling place: `curl -X POST .../api/voter-info` with your address
- [ ] Warm up Tiffany research: `curl -X POST .../api/receipts` with tiffany
- [ ] Warm up ballot: `curl -X POST .../api/voter-info` with ballot action
- [ ] Close all tabs, hide bookmarks, kill notifications
- [ ] Light mode on in the app
- [ ] Clean desk for on-camera shots
- [ ] Good lighting — face the window or use a ring light
- [ ] Record on-camera shots first (Scenes 1 and 7) — multiple takes, pick the best
- [ ] Then screen recordings (Scenes 3, 4, 5, 6) — can retry if needed
- [ ] Record voiceover last (or generate with ElevenLabs)

---

## Render commands

```bash
# Preview in studio
npm run dev

# Render full video
npx remotion render BallotBadgerFull --output ballot-badger-full.mp4

# Render Reels version
npx remotion render BallotBadgerReels --output ballot-badger-reels.mp4
```
